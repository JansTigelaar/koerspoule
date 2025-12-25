// src/components/Admin/StageResults.js

import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, addDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { 
  parseStageResults, 
  validateStageResults, 
  updateTeamsWithStageResults 
} from '../../utils/pointsCalculator';
import { generateStageStory } from '../../utils/storyGenerator';
import { Upload, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import StageStory from './StageStory';
import './StageResults.css';

function StageResults({ user }) {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [stageNumber, setStageNumber] = useState(1);
  const [resultsText, setResultsText] = useState('');
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [story, setStory] = useState(null);
  const [generatingStory, setGeneratingStory] = useState(false);
  const [currentStageResultId, setCurrentStageResultId] = useState(null);
  const [storySaved, setStorySaved] = useState(false);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const eventsQuery = query(
        collection(db, 'events'),
        where('status', '==', 'active')
      );
      const snapshot = await getDocs(eventsQuery);
      const eventsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setEvents(eventsData);
      if (eventsData.length > 0) {
        setSelectedEvent(eventsData[0].id);
      }
    } catch (error) {
      console.error('Error loading events:', error);
      setMessage({ type: 'error', text: 'Fout bij laden events' });
    } finally {
      setLoading(false);
    }
  };

  const generateStory = async (eventId, stage, stageResults, teams) => {
    setGeneratingStory(true);
    setStory(null);
    setStorySaved(false);
    
    try {
      // Calculate standings before this stage
      const oldStandings = teams
        .map(team => ({
          id: team.id,
          teamName: team.teamName,
          userName: team.userName || 'Unknown',
          totalPoints: team.totalPoints - (team.stagePoints?.[`stage${stage}`] || 0)
        }))
        .sort((a, b) => b.totalPoints - a.totalPoints);
      
      // Calculate standings after this stage
      const newStandings = teams
        .map(team => ({
          id: team.id,
          teamName: team.teamName,
          userName: team.userName || 'Unknown',
          totalPoints: team.totalPoints
        }))
        .sort((a, b) => b.totalPoints - a.totalPoints);
      
      const generatedStory = await generateStageStory(
        stage,
        stageResults,
        oldStandings,
        newStandings
      );
      
      setStory(generatedStory.story);
    } catch (error) {
      console.error('Error generating story:', error);
      setStory({ error: error.message });
    } finally {
      setGeneratingStory(false);
    }
  };

  const handleRegenerateStory = async () => {
    if (!selectedEvent || !stageNumber) return;
    
    try {
      // Fetch teams to recalculate standings
      const teamsQuery = query(
        collection(db, 'teams'),
        where('eventId', '==', selectedEvent)
      );
      const teamsSnapshot = await getDocs(teamsQuery);
      const teams = teamsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Get stage results
      const resultsQuery = query(
        collection(db, 'stageResults'),
        where('eventId', '==', selectedEvent),
        where('stageNumber', '==', stageNumber - 1) // Previous stage since we incremented
      );
      const resultsSnapshot = await getDocs(resultsQuery);
      
      if (!resultsSnapshot.empty) {
        const stageData = resultsSnapshot.docs[0].data();
        await generateStory(selectedEvent, stageNumber - 1, stageData.results, teams);
      }
    } catch (error) {
      console.error('Error regenerating story:', error);
      setStory({ error: error.message });
    }
  };

  const handleSaveStory = async () => {
    if (!story || !currentStageResultId || story.error) return;
    
    try {
      const stageResultRef = doc(db, 'stageResults', currentStageResultId);
      await setDoc(stageResultRef, {
        story: story,
        storyGeneratedAt: new Date().toISOString()
      }, { merge: true });
      
      setStorySaved(true);
      setMessage({ 
        type: 'success', 
        text: 'Verhaal opgeslagen en gepubliceerd!' 
      });
    } catch (error) {
      console.error('Error saving story:', error);
      setMessage({ 
        type: 'error', 
        text: `Fout bij opslaan verhaal: ${error.message}` 
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedEvent) {
      setMessage({ type: 'error', text: 'Selecteer een event' });
      return;
    }

    if (!resultsText.trim()) {
      setMessage({ type: 'error', text: 'Voer resultaten in' });
      return;
    }

    setProcessing(true);
    setMessage({ type: 'info', text: 'Verwerken...' });

    try {
      // Parse de resultaten
      const stageResults = parseStageResults(resultsText);

      // Valideer de resultaten
      const validation = validateStageResults(stageResults);
      if (!validation.valid) {
        setMessage({ type: 'error', text: validation.error });
        setProcessing(false);
        return;
      }

      // Haal alle teams op voor dit event
      const teamsQuery = query(
        collection(db, 'teams'),
        where('eventId', '==', selectedEvent)
      );
      const teamsSnapshot = await getDocs(teamsQuery);
      const teams = teamsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Bereken punten voor elk team
      const updatedTeams = updateTeamsWithStageResults(teams, stageResults, stageNumber);

      // Update alle teams in Firestore
      let updatedCount = 0;
      for (const team of updatedTeams) {
        const teamRef = doc(db, 'teams', team.id);
        await updateDoc(teamRef, {
          stagePoints: team.stagePoints,
          totalPoints: team.totalPoints,
          lastUpdated: team.lastUpdated
        });
        updatedCount++;
      }

      // Sla de stage results op in een aparte collection
      const stageResultRef = await addDoc(collection(db, 'stageResults'), {
        eventId: selectedEvent,
        stageNumber,
        results: stageResults,
        processedAt: new Date().toISOString(),
        processedBy: user.uid,
        teamsUpdated: updatedCount
      });

      setMessage({ 
        type: 'success', 
        text: `Succes! ${updatedCount} teams bijgewerkt met punten voor etappe ${stageNumber}` 
      });
      
      // Generate AI story
      setCurrentStageResultId(stageResultRef.id);
      await generateStory(selectedEvent, stageNumber, stageResults, updatedTeams);
      
      // Reset form (but keep story visible)
      setResultsText('');
      setStageNumber(stageNumber + 1);

    } catch (error) {
      console.error('Error processing results:', error);
      setMessage({ type: 'error', text: `Fout: ${error.message}` });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return <div className="loading">Laden...</div>;
  }

  return (
    <div className="stage-results">
      <div className="stage-results-header">
        <h1>Etappe Resultaten Invoeren</h1>
        <p>Voer de resultaten van een etappe in om automatisch punten te berekenen</p>
      </div>

      {message && (
        <div className={`message message-${message.type}`}>
          {message.type === 'error' && <AlertCircle size={20} />}
          {message.type === 'success' && <CheckCircle size={20} />}
          {message.type === 'info' && <Loader size={20} />}
          <span>{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="results-form">
        <div className="form-group">
          <label htmlFor="event">Event:</label>
          <select
            id="event"
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value)}
            required
          >
            {events.map(event => (
              <option key={event.id} value={event.id}>
                {event.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="stageNumber">Etappe Nummer:</label>
          <input
            type="number"
            id="stageNumber"
            min="1"
            max="21"
            value={stageNumber}
            onChange={(e) => setStageNumber(parseInt(e.target.value) || 1)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="results">Resultaten (formaat: positie naam rugnummer):</label>
          <textarea
            id="results"
            rows="15"
            value={resultsText}
            onChange={(e) => setResultsText(e.target.value)}
            placeholder="Bijvoorbeeld:
1. POGAČAR Tadej (#1)
2. VINGEGAARD Jonas (#11)
3. EVENEPOEL Remco (#21)
4. VAN AERT Wout (#17)
5. GANNA Filippo (#64)

Of simpeler:
1. POGAČAR Tadej (1)
2. VINGEGAARD Jonas (11)
3. EVENEPOEL Remco (21)
..."
            required
          />
        </div>

        <div className="instructions">
          <h3>Instructies:</h3>
          <ul>
            <li>Ga naar Procyclingstats.com en zoek de etappe uitslag</li>
            <li>Kopieer de top 20 (of meer) finishers</li>
            <li>Formaat: <code>1. NAAM (rugnummer)</code></li>
            <li>Elk resultaat op een nieuwe regel</li>
            <li>Alleen renners in de top 20 krijgen punten</li>
          </ul>
        </div>

        <button 
          type="submit" 
          className="btn-primary btn-submit"
          disabled={processing}
        >
          {processing ? (
            <>
              <Loader size={20} className="spinning" />
              Verwerken...
            </>
          ) : (
            <>
              <Upload size={20} />
              Resultaten Verwerken
            </>
          )}
        </button>
      </form>

      {(story || generatingStory) && (
        <StageStory 
          story={story}
          stageNumber={stageNumber - 1}
          onRegenerate={handleRegenerateStory}
          onSave={handleSaveStory}
          isSaved={storySaved}
        />
      )}
    </div>
  );
}

export default StageResults;
