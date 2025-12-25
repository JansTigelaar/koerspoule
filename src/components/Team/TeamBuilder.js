// src/components/Team/TeamBuilder.js

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc, addDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { CATEGORIES, getAllowedRidersForCategory } from '../../data/categories';
import { RIDERS, searchRiders } from '../../data/riders';
import { Save, Search, X } from 'lucide-react';
import './TeamBuilder.css';

function TeamBuilder({ user }) {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [teamName, setTeamName] = useState('');
  const [selections, setSelections] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState(null);
  const [filteredRiders, setFilteredRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [existingTeam, setExistingTeam] = useState(null);

  useEffect(() => {
    loadEventAndTeam();
  }, [eventId, user.uid]);

  useEffect(() => {
    if (searchQuery && activeCategory) {
      // Eerst filteren op zoekterm
      const results = searchRiders(searchQuery);
      // Dan filteren op toegestane renners voor deze categorie
      const allowedRiders = getAllowedRidersForCategory(activeCategory, results);
      setFilteredRiders(allowedRiders);
    } else if (activeCategory) {
      // Als er geen zoekterm is, toon alle toegestane renners voor deze categorie
      const allowedRiders = getAllowedRidersForCategory(activeCategory, RIDERS);
      setFilteredRiders(allowedRiders);
    } else {
      setFilteredRiders([]);
    }
  }, [searchQuery, activeCategory]);

  const loadEventAndTeam = async () => {
    try {
      // Laad event
      const eventDoc = await getDoc(doc(db, 'events', eventId));
      if (eventDoc.exists()) {
        setEvent({ id: eventDoc.id, ...eventDoc.data() });
      }

      // Laad bestaand team indien aanwezig
      const teamsQuery = query(
        collection(db, 'teams'),
        where('eventId', '==', eventId),
        where('userId', '==', user.uid)
      );
      const teamsSnapshot = await getDocs(teamsQuery);
      
      if (!teamsSnapshot.empty) {
        const teamData = teamsSnapshot.docs[0].data();
        setExistingTeam({ id: teamsSnapshot.docs[0].id, ...teamData });
        setTeamName(teamData.teamName);
        setSelections(teamData.selections || {});
      }
    } catch (error) {
      console.error('Fout bij laden:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRiderSelect = (categoryId, rider) => {
    setSelections({
      ...selections,
      [categoryId]: rider
    });
    setActiveCategory(null);
    setSearchQuery('');
  };

  const handleRemoveRider = (categoryId) => {
    const newSelections = { ...selections };
    delete newSelections[categoryId];
    setSelections(newSelections);
  };

  const handleSave = async () => {
    console.log('=== SAVE DEBUG ===');
    console.log('Team naam:', teamName);
    console.log('Aantal geselecteerde renners:', Object.keys(selections).length);
    console.log('Totaal aantal categorieën:', CATEGORIES.length);
    console.log('Selections:', selections);
    console.log('Event ID:', eventId);
    console.log('User ID:', user.uid);
    console.log('User Name:', user.displayName);
    
    if (!teamName.trim()) {
      alert('Voer een teamnaam in');
      return;
    }

    if (Object.keys(selections).length !== CATEGORIES.length) {
      alert(`Selecteer een renner voor alle ${CATEGORIES.length} categorieën. Je hebt er ${Object.keys(selections).length} geselecteerd.`);
      return;
    }

    setSaving(true);

    try {
      const teamData = {
        teamName: teamName.trim(),
        eventId,
        userId: user.uid,
        userName: user.displayName,
        selections,
        updatedAt: new Date().toISOString(),
        totalPoints: 0
      };

      console.log('Team data die wordt opgeslagen:', teamData);

      if (existingTeam) {
        // Update bestaand team
        console.log('Updaten bestaand team met ID:', existingTeam.id);
        await setDoc(doc(db, 'teams', existingTeam.id), teamData);
      } else {
        // Nieuw team - gebruik addDoc voor auto-generated ID
        console.log('Nieuw team aanmaken...');
        teamData.createdAt = new Date().toISOString();
        const docRef = await addDoc(collection(db, 'teams'), teamData);
        console.log('Team succesvol aangemaakt met ID:', docRef.id);
      }

      alert('Team succesvol opgeslagen!');
      navigate('/');
    } catch (error) {
      console.error('Fout bij opslaan:', error);
      console.error('Error details:', error.message, error.code);
      alert(`Er ging iets mis bij het opslaan: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="loading">Laden...</div>;
  }

  return (
    <div className="team-builder">
      <div className="team-header">
        <h1>Team samenstellen</h1>
        {event && <h2>{event.name}</h2>}
        
        <div className="team-name-input">
          <label htmlFor="teamName">Teamnaam:</label>
          <input
            type="text"
            id="teamName"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder="Mijn superteam"
            maxLength={50}
          />
        </div>
      </div>

      <div className="categories-grid">
        {CATEGORIES.map((category, index) => {
          const selectedRider = selections[category.id];
          
          return (
            <div key={category.id} className="category-card">
              <div className="category-header">
                <span className="category-number">{index + 1}</span>
                <h3>{category.name}</h3>
              </div>

              {selectedRider ? (
                <div className="selected-rider">
                  <div className="rider-info">
                    <span className="rider-number">#{selectedRider.number}</span>
                    <span className="rider-name">{selectedRider.name}</span>
                  </div>
                  <button
                    onClick={() => handleRemoveRider(category.id)}
                    className="btn-remove"
                    title="Verwijder renner"
                  >
                    <X size={20} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setActiveCategory(category.id)}
                  className="btn-select-rider"
                >
                  Selecteer renner
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="team-actions">
        <div className="team-progress">
          <p>
            Geselecteerde renners: <strong>{Object.keys(selections).length}</strong> / <strong>{CATEGORIES.length}</strong>
          </p>
        </div>
        <button
          onClick={handleSave}
          className="btn-save"
          disabled={saving || Object.keys(selections).length !== CATEGORIES.length || !teamName.trim()}
        >
          <Save size={20} />
          {saving ? 'Opslaan...' : existingTeam ? 'Team bijwerken' : 'Team opslaan'}
        </button>
      </div>

      {/* Rider Selection Modal */}
      {activeCategory && (
        <div className="modal-overlay" onClick={() => setActiveCategory(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                Selecteer renner voor: {CATEGORIES.find(c => c.id === activeCategory)?.name}
              </h2>
              <button onClick={() => setActiveCategory(null)} className="modal-close">
                <X size={24} />
              </button>
            </div>

            <div className="search-box">
              <Search size={20} />
              <input
                type="text"
                placeholder="Zoek op naam of nummer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
            </div>

            <div className="riders-list">
              {filteredRiders.length > 0 ? (
                filteredRiders.map(rider => (
                  <div
                    key={rider.id}
                    className="rider-item"
                    onClick={() => handleRiderSelect(activeCategory, rider)}
                  >
                    <span className="rider-number">#{rider.number}</span>
                    <span className="rider-name">{rider.name}</span>
                    {rider.isJoker && <span className="badge badge-joker">Joker</span>}
                    {rider.isYoungRider && <span className="badge badge-young">U25</span>}
                  </div>
                ))
              ) : (
                <p className="no-results">Geen renners beschikbaar voor deze categorie</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeamBuilder;
