// src/utils/storyGenerator.js

import OpenAI from 'openai';

// API Key wordt nu uit environment variables gehaald
const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.error('WAARSCHUWING: REACT_APP_OPENAI_API_KEY is niet ingesteld in .env bestand!');
}

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Voor development - in productie gebruik Cloud Function!
});

/**
 * Genereer een verhaal over de etappe ontwikkelingen
 * @param {number} stageNumber - Etappe nummer
 * @param {Array} stageResults - De etappe resultaten (riders die gescoord hebben)
 * @param {Array} oldStandings - Klassement voor deze etappe
 * @param {Array} newStandings - Klassement na deze etappe
 */
export const generateStageStory = async (stageNumber, stageResults, oldStandings, newStandings) => {
  try {
    // Bereid de data voor voor het prompt
    const klassementText = newStandings
      .slice(0, 5)
      .map((team, i) => `${i + 1}. ${team.teamName} - ${team.totalPoints} punten`)
      .join('\n');

    // Haal de top 3 finishers uit de resultaten
    const topFinishers = stageResults
      .slice(0, 3)
      .map((result, i) => `${i + 1}. ${result.name} (#${result.number})`)
      .join('\n');

    // Bereken veranderingen
    const changes = calculateStandingsChanges(oldStandings, newStandings);
    
    const veranderingen = changes.climbers.length > 0 || changes.fallers.length > 0
      ? changes.climbers
          .slice(0, 3)
          .map(c => `${c.teamName} steeg ${c.positions} plaats${c.positions > 1 ? 'en' : ''}`)
          .concat(changes.fallers.slice(0, 3).map(f => `${f.teamName} daalde ${f.positions} plaats${f.positions > 1 ? 'en' : ''}`))
          .join('\n')
      : 'Geen grote verschuivingen in het klassement';

    const prompt = `Schrijf een kort, enthousiast verhaal (max 150 woorden) over etappe ${stageNumber} van de Koerspoule fantasy competitie. Gebruik een sportieve, Nederlandse commentator stijl (denk aan NOS Tour de France verslaggeving).

TOP 3 FINISHERS VAN DEZE ETAPPE:
${topFinishers}

KLASSEMENT NA ETAPPE ${stageNumber}:
${klassementText}

OPVALLENDE VERANDERINGEN:
${veranderingen}

Maak het verhaal levendig en noem specifieke teams. Focus op:
- De winnaar van deze etappe
- Spannende verschuivingen in het klassement
- De strijd om de top 3
- Verrassingen (teams die veel stegen of daalden)

Begin met een pakkende opening over de etappe. Gebruik Nederlandse wielertermen. Houd het kort en krachtig!`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Je bent een enthousiaste Nederlandse wieler commentator die korte, levendige verslagen schrijft over fantasy cycling competities.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 300,
      temperature: 0.8
    });

    return {
      success: true,
      story: response.choices[0].message.content,
      stageNumber,
      generatedAt: new Date().toISOString()
    };

  } catch (error) {
    console.error('Error generating story:', error);
    throw error;
  }
};

/**
 * Bereken veranderingen in het klassement
 * @param {Array} oldStandings - Oude klassement (voor deze etappe)
 * @param {Array} newStandings - Nieuwe klassement (na deze etappe)
 */
export const calculateStandingsChanges = (oldStandings, newStandings) => {
  const changes = {
    climbers: [],
    fallers: [],
    noChange: []
  };

  newStandings.forEach((team, newIndex) => {
    const oldIndex = oldStandings.findIndex(t => t.id === team.id);
    
    if (oldIndex === -1) {
      // Nieuw team, skip
      return;
    }

    const positionChange = oldIndex - newIndex; // Positief = gestegen, negatief = gedaald

    if (positionChange > 0) {
      changes.climbers.push({
        teamName: team.teamName,
        userName: team.userName,
        positions: positionChange,
        oldPosition: oldIndex + 1,
        newPosition: newIndex + 1
      });
    } else if (positionChange < 0) {
      changes.fallers.push({
        teamName: team.teamName,
        userName: team.userName,
        positions: Math.abs(positionChange),
        oldPosition: oldIndex + 1,
        newPosition: newIndex + 1
      });
    } else {
      changes.noChange.push({
        teamName: team.teamName,
        userName: team.userName,
        position: newIndex + 1
      });
    }
  });

  // Sorteer op grootste veranderingen
  changes.climbers.sort((a, b) => b.positions - a.positions);
  changes.fallers.sort((a, b) => b.positions - a.positions);

  return changes;
};

/**
 * Haal de top performers van een etappe op
 * @param {Array} teams - Alle teams
 * @param {number} stageNumber - Etappe nummer
 * @param {number} limit - Aantal teams om te tonen (default 5)
 */
export const getStageTopPerformers = (teams, stageNumber, limit = 5) => {
  const teamsWithStagePoints = teams
    .map(team => ({
      ...team,
      stagePoints: team.stagePoints?.[`stage${stageNumber}`] || 0
    }))
    .filter(team => team.stagePoints > 0)
    .sort((a, b) => b.stagePoints - a.stagePoints)
    .slice(0, limit);

  return teamsWithStagePoints;
};
