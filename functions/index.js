// functions/index.js

// Load environment variables from .env file (for local development)
require('dotenv').config();

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const OpenAI = require('openai');

// Initialize Firebase Admin
admin.initializeApp();

/**
 * Cloud Function to generate AI story for a stage
 * HTTPS Callable function - can be called from the client with authentication
 */
exports.generateStageStory = functions.https.onCall(async (data, context) => {
  // Check if user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Je moet ingelogd zijn om een verhaal te genereren.'
    );
  }

  // Check if user is admin
  const userDoc = await admin.firestore()
    .collection('users')
    .doc(context.auth.uid)
    .get();
  
  if (!userDoc.exists || !userDoc.data().isAdmin) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Je hebt geen toestemming om verhalen te genereren. Alleen admins kunnen dit doen.'
    );
  }

  // Get OpenAI API key from environment (supports both old and new methods)
  const apiKey = process.env.OPENAI_API_KEY || functions.config().openai?.key;
  if (!apiKey) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'OpenAI API key niet geconfigureerd. Stel OPENAI_API_KEY environment variable in of gebruik: firebase functions:config:set openai.key="YOUR_KEY"'
    );
  }

  // Extract parameters
  const { stageNumber, stageResults, oldStandings, newStandings } = data;

  // Validate required parameters
  if (!stageNumber || !stageResults || !oldStandings || !newStandings) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Ontbrekende verplichte parameters: stageNumber, stageResults, oldStandings, newStandings'
    );
  }

  try {
    // Initialize OpenAI client
    const openai = new OpenAI({ apiKey });

    // Prepare data for the prompt
    const klassementText = newStandings
      .slice(0, 5)
      .map((team, i) => `${i + 1}. ${team.teamName} - ${team.totalPoints} punten`)
      .join('\n');

    // Get top 3 finishers
    const topFinishers = stageResults
      .slice(0, 3)
      .map((result, i) => `${i + 1}. ${result.name} (#${result.number})`)
      .join('\n');

    // Calculate changes
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

    // Call OpenAI API
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

    // Return the generated story
    return {
      success: true,
      story: response.choices[0].message.content,
      stageNumber,
      generatedAt: new Date().toISOString()
    };

  } catch (error) {
    console.error('Error generating story:', error);
    throw new functions.https.HttpsError(
      'internal',
      `Er ging iets mis bij het genereren van het verhaal: ${error.message}`
    );
  }
});

/**
 * Helper function to calculate standings changes
 */
function calculateStandingsChanges(oldStandings, newStandings) {
  const changes = {
    climbers: [],
    fallers: [],
    noChange: []
  };

  newStandings.forEach((team, newIndex) => {
    const oldIndex = oldStandings.findIndex(t => t.id === team.id);
    
    if (oldIndex === -1) {
      // New team, skip
      return;
    }

    const positionChange = oldIndex - newIndex; // Positive = climbed, negative = fell

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

  // Sort by largest changes
  changes.climbers.sort((a, b) => b.positions - a.positions);
  changes.fallers.sort((a, b) => b.positions - a.positions);

  return changes;
}
