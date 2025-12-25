// src/components/Admin/EventManagement.js

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { AlertTriangle, Trash2, RotateCcw, XCircle } from 'lucide-react';
import './EventManagement.css';

function EventManagement() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState(null);
  const [stats, setStats] = useState({ teams: 0, results: 0 });
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [stageToDelete, setStageToDelete] = useState('');

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      loadEventStats();
    }
  }, [selectedEvent]);

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

  const loadEventStats = async () => {
    try {
      // Count teams
      const teamsQuery = query(
        collection(db, 'teams'),
        where('eventId', '==', selectedEvent)
      );
      const teamsSnapshot = await getDocs(teamsQuery);
      
      // Count stage results
      const resultsQuery = query(
        collection(db, 'stageResults'),
        where('eventId', '==', selectedEvent)
      );
      const resultsSnapshot = await getDocs(resultsQuery);

      setStats({
        teams: teamsSnapshot.docs.length,
        results: resultsSnapshot.docs.length
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleResetAllPoints = async () => {
    setProcessing(true);
    setMessage({ type: 'info', text: 'Punten resetten...' });

    try {
      const teamsQuery = query(
        collection(db, 'teams'),
        where('eventId', '==', selectedEvent)
      );
      const teamsSnapshot = await getDocs(teamsQuery);

      const batch = writeBatch(db);
      let count = 0;

      teamsSnapshot.docs.forEach((teamDoc) => {
        const teamRef = doc(db, 'teams', teamDoc.id);
        batch.update(teamRef, {
          stagePoints: {},
          totalPoints: 0,
          lastUpdated: new Date().toISOString()
        });
        count++;
      });

      await batch.commit();

      setMessage({ 
        type: 'success', 
        text: `Succes! Punten gereset voor ${count} teams` 
      });
      loadEventStats();
    } catch (error) {
      console.error('Error resetting points:', error);
      setMessage({ type: 'error', text: `Fout: ${error.message}` });
    } finally {
      setProcessing(false);
      setShowConfirmModal(false);
    }
  };

  const handleDeleteStage = async () => {
    if (!stageToDelete) {
      setMessage({ type: 'error', text: 'Voer een etappe nummer in' });
      return;
    }

    setProcessing(true);
    setMessage({ type: 'info', text: `Etappe ${stageToDelete} verwijderen...` });

    try {
      // Get all teams
      const teamsQuery = query(
        collection(db, 'teams'),
        where('eventId', '==', selectedEvent)
      );
      const teamsSnapshot = await getDocs(teamsQuery);

      const batch = writeBatch(db);
      const stageKey = `stage${stageToDelete}`;
      let count = 0;

      teamsSnapshot.docs.forEach((teamDoc) => {
        const teamData = teamDoc.data();
        const stagePoints = { ...teamData.stagePoints };
        
        // Remove this stage
        delete stagePoints[stageKey];

        // Recalculate total points
        const totalPoints = Object.values(stagePoints).reduce((sum, pts) => sum + pts, 0);

        const teamRef = doc(db, 'teams', teamDoc.id);
        batch.update(teamRef, {
          stagePoints,
          totalPoints,
          lastUpdated: new Date().toISOString()
        });
        count++;
      });

      await batch.commit();

      // Delete stage results document
      const resultsQuery = query(
        collection(db, 'stageResults'),
        where('eventId', '==', selectedEvent),
        where('stageNumber', '==', parseInt(stageToDelete))
      );
      const resultsSnapshot = await getDocs(resultsQuery);
      
      for (const resultDoc of resultsSnapshot.docs) {
        await deleteDoc(doc(db, 'stageResults', resultDoc.id));
      }

      setMessage({ 
        type: 'success', 
        text: `Etappe ${stageToDelete} verwijderd! ${count} teams bijgewerkt` 
      });
      setStageToDelete('');
      loadEventStats();
    } catch (error) {
      console.error('Error deleting stage:', error);
      setMessage({ type: 'error', text: `Fout: ${error.message}` });
    } finally {
      setProcessing(false);
      setShowConfirmModal(false);
    }
  };

  const handleDeleteAllTeams = async () => {
    setProcessing(true);
    setMessage({ type: 'info', text: 'Teams verwijderen...' });

    try {
      const teamsQuery = query(
        collection(db, 'teams'),
        where('eventId', '==', selectedEvent)
      );
      const teamsSnapshot = await getDocs(teamsQuery);

      const batch = writeBatch(db);
      let count = 0;

      teamsSnapshot.docs.forEach((teamDoc) => {
        batch.delete(doc(db, 'teams', teamDoc.id));
        count++;
      });

      await batch.commit();

      setMessage({ 
        type: 'success', 
        text: `${count} teams verwijderd` 
      });
      loadEventStats();
    } catch (error) {
      console.error('Error deleting teams:', error);
      setMessage({ type: 'error', text: `Fout: ${error.message}` });
    } finally {
      setProcessing(false);
      setShowConfirmModal(false);
    }
  };

  const openConfirmModal = (action) => {
    setConfirmAction(action);
    setShowConfirmModal(true);
  };

  const executeAction = () => {
    switch (confirmAction.type) {
      case 'resetPoints':
        handleResetAllPoints();
        break;
      case 'deleteStage':
        handleDeleteStage();
        break;
      case 'deleteTeams':
        handleDeleteAllTeams();
        break;
      default:
        setShowConfirmModal(false);
    }
  };

  if (loading) {
    return <div className="loading">Laden...</div>;
  }

  return (
    <div className="event-management">
      <div className="event-management-header">
        <h1>Event Beheer</h1>
        <p>Beheer events, reset punten, of verwijder data</p>
      </div>

      {message && (
        <div className={`message message-${message.type}`}>
          <span>{message.text}</span>
        </div>
      )}

      <div className="event-select-group">
        <label htmlFor="event">Selecteer Event:</label>
        <select
          id="event"
          value={selectedEvent}
          onChange={(e) => setSelectedEvent(e.target.value)}
        >
          {events.map(event => (
            <option key={event.id} value={event.id}>
              {event.name}
            </option>
          ))}
        </select>
      </div>

      {selectedEvent && (
        <>
          <div className="stats-card">
            <h2>Event Statistieken</h2>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-value">{stats.teams}</span>
                <span className="stat-label">Teams</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{stats.results}</span>
                <span className="stat-label">Etappes verwerkt</span>
              </div>
            </div>
          </div>

          <div className="warning-box">
            <h3>
              <AlertTriangle size={20} />
              Let Op!
            </h3>
            <p>Deze acties kunnen niet ongedaan gemaakt worden. Gebruik ze alleen als je zeker weet wat je doet.</p>
          </div>

          <div className="action-buttons">
            {/* Reset Points */}
            <div className="action-card">
              <h3>Punten Resetten</h3>
              <p>Reset alle punten voor alle teams naar 0. Teams blijven behouden, alleen punten worden gewist.</p>
              <button
                className="btn-warning"
                onClick={() => openConfirmModal({
                  type: 'resetPoints',
                  title: 'Alle punten resetten?',
                  message: `Alle punten van ${stats.teams} teams worden gereset naar 0. Teams en selecties blijven behouden.`
                })}
                disabled={processing || stats.teams === 0}
              >
                <RotateCcw size={20} />
                Reset Alle Punten
              </button>
            </div>

            {/* Delete Stage */}
            <div className="action-card">
              <h3>Etappe Verwijderen</h3>
              <p>Verwijder een specifieke etappe en haar punten. Handig als je verkeerde resultaten hebt ingevoerd.</p>
              <div className="stage-selector">
                <label htmlFor="stageNumber">Etappe Nummer:</label>
                <input
                  type="number"
                  id="stageNumber"
                  min="1"
                  max="21"
                  value={stageToDelete}
                  onChange={(e) => setStageToDelete(e.target.value)}
                  placeholder="Bijv. 5"
                />
              </div>
              <button
                className="btn-warning"
                onClick={() => openConfirmModal({
                  type: 'deleteStage',
                  title: `Etappe ${stageToDelete} verwijderen?`,
                  message: `Alle punten en resultaten van etappe ${stageToDelete} worden verwijderd. Het klassement wordt herberekend.`
                })}
                disabled={processing || !stageToDelete}
              >
                <XCircle size={20} />
                Verwijder Etappe
              </button>
            </div>

            {/* Delete All Teams */}
            <div className="action-card">
              <h3>Alle Teams Verwijderen</h3>
              <p>Verwijder alle teams en hun data. Gebruik dit om de competitie volledig opnieuw te starten.</p>
              <button
                className="btn-danger"
                onClick={() => openConfirmModal({
                  type: 'deleteTeams',
                  title: 'Alle teams verwijderen?',
                  message: `Alle ${stats.teams} teams, hun selecties en punten worden PERMANENT verwijderd. Deze actie kan NIET ongedaan gemaakt worden!`
                })}
                disabled={processing || stats.teams === 0}
              >
                <Trash2 size={20} />
                Verwijder Alle Teams
              </button>
            </div>
          </div>
        </>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && confirmAction && (
        <div className="confirmation-modal">
          <div className="modal-content">
            <h3>
              <AlertTriangle size={24} />
              {confirmAction.title}
            </h3>
            <p>{confirmAction.message}</p>
            <p><strong>Weet je het zeker?</strong></p>
            <div className="modal-actions">
              <button
                className="btn-cancel"
                onClick={() => setShowConfirmModal(false)}
                disabled={processing}
              >
                Annuleren
              </button>
              <button
                className="btn-danger"
                onClick={executeAction}
                disabled={processing}
              >
                {processing ? 'Bezig...' : 'Ja, Doorgaan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EventManagement;
