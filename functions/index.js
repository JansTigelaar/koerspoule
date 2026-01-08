// functions/index.js

const { onCall } = require('firebase-functions/v2/https');
const { defineString } = require('firebase-functions/params');
const admin = require('firebase-admin');
const OpenAI = require('openai');
const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');

// Initialize Firebase Admin
admin.initializeApp();

// Define OPENAI_API_KEY parameter
const openaiApiKey = defineString('OPENAI_API_KEY');

/**
 * Cloud Function to generate AI story for a stage
 * HTTPS Callable function - can be called from the client with authentication
 * Version 2.0 - Updated with Firebase Functions v2 params
 */
exports.generateStageStory = onCall(async (request) => {
  // Check if user is authenticated
  if (!request.auth) {
    throw new Error('Je moet ingelogd zijn om een verhaal te genereren.');
  }

  // Check if user is admin
  const userDoc = await admin.firestore()
    .collection('users')
    .doc(request.auth.uid)
    .get();
  
  if (!userDoc.exists || !userDoc.data().isAdmin) {
    throw new Error('Je hebt geen toestemming om verhalen te genereren. Alleen admins kunnen dit doen.');
  }

  // Get OpenAI API key from parameter
  const apiKey = openaiApiKey.value();
  
  if (!apiKey) {
    console.error('OPENAI_API_KEY not configured');
    throw new Error('OpenAI API key niet geconfigureerd. Neem contact op met de beheerder.');
  }

  // Extract parameters
  const { stageNumber, stageResults, oldStandings, newStandings } = request.data;

  // Validate required parameters
  if (!stageNumber || !stageResults || !oldStandings || !newStandings) {
    throw new Error('Ontbrekende verplichte parameters: stageNumber, stageResults, oldStandings, newStandings');
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
    throw new Error(`Er ging iets mis bij het genereren van het verhaal: ${error.message}`);
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

/**
 * Cloud Function to fetch race results from FirstCycling.com using Puppeteer
 * HTTPS Callable function - can be called from the admin panel
 */
exports.fetchRaceResults = onCall({
  memory: '1GiB',
  timeoutSeconds: 60,
}, async (request) => {
  // Check if user is authenticated
  if (!request.auth) {
    throw new Error('Je moet ingelogd zijn om resultaten op te halen.');
  }

  // Check if user is admin
  const userDoc = await admin.firestore()
    .collection('users')
    .doc(request.auth.uid)
    .get();
  
  if (!userDoc.exists || !userDoc.data().isAdmin) {
    throw new Error('Je hebt geen toestemming om resultaten op te halen. Alleen admins kunnen dit doen.');
  }

  // Extract parameters
  const { raceUrl, source = 'firstcycling' } = request.data;

  // Validate required parameters
  if (!raceUrl) {
    throw new Error('Ontbrekende verplichte parameter: raceUrl');
  }

  // Validate URL format
  if (!raceUrl.startsWith('https://firstcycling.com/race.php') && 
      !raceUrl.startsWith('https://www.procyclingstats.com/race/')) {
    throw new Error('Ongeldig race URL formaat. Gebruik een FirstCycling of ProCyclingStats URL.');
  }

  let browser;
  
  try {
    console.log(`Fetching race results from: ${raceUrl}`);
    
    // Launch Puppeteer browser with serverless chromium
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    
    // Set user agent to mimic real browser
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Navigate to the race page
    await page.goto(raceUrl, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    // Wait a bit for dynamic content
    await page.waitForTimeout(2000);

    let results;
    
    // Parse results based on source
    if (source === 'firstcycling' || raceUrl.includes('firstcycling.com')) {
      results = await parseFirstCyclingResults(page);
    } else {
      results = await parseProcyclingStatsResults(page);
    }

    await browser.close();

    console.log(`Successfully fetched ${results.length} results from ${raceUrl}`);

    return {
      success: true,
      results,
      source,
      fetchedAt: new Date().toISOString(),
      raceUrl,
    };

  } catch (error) {
    if (browser) {
      await browser.close();
    }
    console.error('Error fetching race results:', error);
    throw new Error(`Er ging iets mis bij het ophalen van de resultaten: ${error.message}`);
  }
});

/**
 * Parse race results from FirstCycling.com
 */
async function parseFirstCyclingResults(page) {
  const results = await page.evaluate(() => {
    const resultsArray = [];
    
    // FirstCycling uses table.tablesorter for results
    // Look for the results table
    const tables = document.querySelectorAll('table.tablesorter');
    
    for (const table of tables) {
      const rows = table.querySelectorAll('tbody tr');
      
      for (const row of rows) {
        const cells = row.querySelectorAll('td');
        
        if (cells.length >= 2) {
          // First cell usually contains position
          const positionText = cells[0].textContent.trim();
          const position = parseInt(positionText.replace(/\D/g, ''), 10);
          
          if (isNaN(position) || position < 1 || position > 50) {
            continue;
          }
          
          // Find rider name - usually in a link
          let riderName = '';
          let riderNumber = null;
          
          // Look through cells for rider name
          for (let i = 1; i < cells.length; i++) {
            const link = cells[i].querySelector('a[href*="rider.php"]');
            if (link) {
              riderName = link.textContent.trim();
              
              // Try to find rider number in the row
              const rowText = row.textContent;
              const numberMatch = rowText.match(/\(#?(\d+)\)/) || rowText.match(/#(\d+)/);
              if (numberMatch) {
                riderNumber = parseInt(numberMatch[1], 10);
              }
              
              break;
            }
          }
          
          if (riderName && position) {
            resultsArray.push({
              position,
              name: riderName.toUpperCase(),
              riderNumber,
            });
          }
        }
      }
      
      // If we found results, break
      if (resultsArray.length > 0) {
        break;
      }
    }
    
    return resultsArray;
  });
  
  if (results.length === 0) {
    throw new Error('Geen resultaten gevonden op de pagina. Zorg ervoor dat de race al is afgelopen en de resultaten zijn gepubliceerd.');
  }
  
  return results.slice(0, 30); // Return top 30
}

/**
 * Parse race results from ProCyclingStats.com
 */
async function parseProcyclingStatsResults(page) {
  const results = await page.evaluate(() => {
    const resultsArray = [];
    
    // ProCyclingStats structure - find results table
    const tables = document.querySelectorAll('table');
    
    for (const table of tables) {
      const rows = table.querySelectorAll('tbody tr, tr');
      
      for (const row of rows) {
        const cells = row.querySelectorAll('td, th');
        
        if (cells.length >= 2) {
          const positionText = cells[0].textContent.trim();
          const position = parseInt(positionText.replace(/\D/g, ''), 10);
          
          if (isNaN(position) || position < 1 || position > 50) {
            continue;
          }
          
          // Find rider name
          let riderName = '';
          let riderNumber = null;
          
          for (let i = 1; i < cells.length; i++) {
            const link = cells[i].querySelector('a');
            if (link && link.href && link.href.includes('rider/')) {
              riderName = link.textContent.trim();
              
              // Try to find rider number
              const rowText = row.textContent;
              const numberMatch = rowText.match(/\(#?(\d+)\)/) || rowText.match(/#(\d+)/) || rowText.match(/\b(\d{1,3})\b/);
              if (numberMatch) {
                riderNumber = parseInt(numberMatch[1], 10);
              }
              
              break;
            }
          }
          
          if (riderName && position) {
            resultsArray.push({
              position,
              name: riderName.toUpperCase(),
              riderNumber,
            });
          }
        }
      }
      
      if (resultsArray.length > 0) {
        break;
      }
    }
    
    return resultsArray;
  });
  
  if (results.length === 0) {
    throw new Error('Geen resultaten gevonden op de pagina. Zorg ervoor dat de race al is afgelopen en de resultaten zijn gepubliceerd.');
  }
  
  return results.slice(0, 30);
}
