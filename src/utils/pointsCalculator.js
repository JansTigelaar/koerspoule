// src/utils/pointsCalculator.js

import { POINTS_SYSTEM } from '../data/categories';

/**
 * Berekent punten voor een renner op basis van zijn positie
 */
export const calculatePointsForPosition = (position) => {
  const pointEntry = POINTS_SYSTEM.find(p => p.position === position);
  return pointEntry ? pointEntry.points : 0;
};

/**
 * Berekent totale punten voor een team op basis van etappe resultaten
 * @param {Object} teamSelections - Object met category IDs als keys en rider objects als values
 * @param {Array} stageResults - Array van {riderNumber, position}
 * @returns {number} - Totaal aantal punten voor dit team in deze etappe
 */
export const calculateTeamPointsForStage = (teamSelections, stageResults) => {
  let totalPoints = 0;
  
  // Loop door alle geselecteerde renners in het team
  Object.values(teamSelections).forEach(rider => {
    // Zoek de positie van deze renner in de etappe resultaten
    const result = stageResults.find(r => r.riderNumber === rider.number);
    
    if (result && result.position) {
      const points = calculatePointsForPosition(result.position);
      totalPoints += points;
    }
  });
  
  return totalPoints;
};

/**
 * Update alle teams met punten voor een specifieke etappe
 * @param {Array} teams - Alle teams in de database
 * @param {Array} stageResults - Etappe resultaten
 * @param {number} stageNumber - Etappe nummer
 * @returns {Array} - Teams met updated punten
 */
export const updateTeamsWithStageResults = (teams, stageResults, stageNumber) => {
  return teams.map(team => {
    const stagePoints = calculateTeamPointsForStage(team.selections, stageResults);
    
    // Initialiseer stagePoints object als het nog niet bestaat
    const updatedStagePoints = team.stagePoints || {};
    updatedStagePoints[`stage${stageNumber}`] = stagePoints;
    
    // Bereken nieuwe totale punten
    const totalPoints = Object.values(updatedStagePoints).reduce((sum, points) => sum + points, 0);
    
    return {
      ...team,
      stagePoints: updatedStagePoints,
      totalPoints,
      lastUpdated: new Date().toISOString()
    };
  });
};

/**
 * Parse etappe resultaten uit Procyclingstats formaat
 * Bijvoorbeeld: "1. POGAČAR Tadej (1), 2. VINGEGAARD Jonas (11), ..."
 */
export const parseStageResults = (resultsText) => {
  const results = [];
  const lines = resultsText.trim().split('\n');
  
  lines.forEach(line => {
    // Verwacht formaat: "1. NAAM (#123)" of "1. NAAM (123)"
    const match = line.match(/^(\d+)\.\s+(.+?)\s+\(#?(\d+)\)/);
    if (match) {
      const [, position, name, riderNumber] = match;
      results.push({
        position: parseInt(position),
        name: name.trim(),
        riderNumber: parseInt(riderNumber)
      });
    }
  });
  
  return results;
};

/**
 * Valideer of alle benodigde velden aanwezig zijn in stage results
 */
export const validateStageResults = (stageResults) => {
  if (!Array.isArray(stageResults)) {
    return { valid: false, error: 'Results moet een array zijn' };
  }
  
  if (stageResults.length === 0) {
    return { valid: false, error: 'Results array is leeg' };
  }
  
  for (let i = 0; i < stageResults.length; i++) {
    const result = stageResults[i];
    if (!result.position || !result.riderNumber) {
      return { 
        valid: false, 
        error: `Result op index ${i} mist position of riderNumber` 
      };
    }
    
    if (typeof result.position !== 'number' || typeof result.riderNumber !== 'number') {
      return { 
        valid: false, 
        error: `Position en riderNumber moeten nummers zijn (index ${i})` 
      };
    }
  }
  
  return { valid: true };
};
