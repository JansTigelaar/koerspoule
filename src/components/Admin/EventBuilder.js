// src/components/Admin/EventBuilder.js

import { useState, useEffect } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { RIDERS } from '../../data/riders';
import { CATEGORIES } from '../../data/categories';
import { Save, Plus, X } from 'lucide-react';
import './EventBuilder.css';

function EventBuilder() {
  const [eventName, setEventName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('upcoming');
  
  // Renner selectie
  const [selectedRiders, setSelectedRiders] = useState([]);
  const [riderSearch, setRiderSearch] = useState('');
  const [showRiderModal, setShowRiderModal] = useState(false);
  
  // Categorieën
  const [categories, setCategories] = useState([]);
  const [useDefaultCategories, setUseDefaultCategories] = useState(true);
  
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    // Start met default categorieën
    if (useDefaultCategories) {
      setCategories(CATEGORIES);
    }
  }, [useDefaultCategories]);

  const handleToggleRider = (rider) => {
    if (selectedRiders.find(r => r.id === rider.id)) {
      setSelectedRiders(selectedRiders.filter(r => r.id !== rider.id));
    } else {
      setSelectedRiders([...selectedRiders, rider]);
    }
  };

  const handleSelectAllRiders = () => {
    setSelectedRiders([...RIDERS]);
  };

  const handleClearRiders = () => {
    setSelectedRiders([]);
  };

  const getFilteredRiders = () => {
    if (!riderSearch) return RIDERS;
    const search = riderSearch.toLowerCase();
    return RIDERS.filter(r => 
      r.name.toLowerCase().includes(search) || 
      r.number.toString().includes(search)
    );
  };

  const handleAddCategory = () => {
    const newCategory = {
      id: `custom-${Date.now()}`,
      name: 'Nieuwe Categorie',
      type: 'other',
      allowedRiderNumbers: []
    };
    setCategories([...categories, newCategory]);
  };

  const handleUpdateCategory = (categoryId, updates) => {
    setCategories(categories.map(cat => 
      cat.id === categoryId ? { ...cat, ...updates } : cat
    ));
  };

  const handleDeleteCategory = (categoryId) => {
    setCategories(categories.filter(cat => cat.id !== categoryId));
  };

  const handleSaveEvent = async () => {
    if (!eventName.trim()) {
      setMessage({ type: 'error', text: 'Voer een evenement naam in' });
      return;
    }

    if (!startDate) {
      setMessage({ type: 'error', text: 'Voer een startdatum in' });
      return;
    }

    if (selectedRiders.length === 0) {
      setMessage({ type: 'error', text: 'Selecteer minimaal 1 renner' });
      return;
    }

    if (categories.length === 0) {
      setMessage({ type: 'error', text: 'Voeg minimaal 1 categorie toe' });
      return;
    }

    setSaving(true);
    setMessage({ type: 'info', text: 'Event opslaan...' });

    try {
      const eventData = {
        name: eventName.trim(),
        startDate,
        endDate: endDate || startDate,
        location: location.trim(),
        description: description.trim(),
        status,
        // Event configuratie
        availableRiders: selectedRiders.map(r => r.id),
        categories: categories,
        // Metadata
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'events'), eventData);

      setMessage({ 
        type: 'success', 
        text: `Event "${eventName}" succesvol aangemaakt!` 
      });

      // Reset form
      setTimeout(() => {
        resetForm();
      }, 2000);

    } catch (error) {
      console.error('Error saving event:', error);
      setMessage({ type: 'error', text: `Fout: ${error.message}` });
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setEventName('');
    setStartDate('');
    setEndDate('');
    setLocation('');
    setDescription('');
    setStatus('upcoming');
    setSelectedRiders([]);
    setCategories(CATEGORIES);
    setUseDefaultCategories(true);
    setMessage(null);
  };

  return (
    <div className="event-builder">
      <div className="event-builder-header">
        <h1>Nieuw Event Aanmaken</h1>
        <p>Configureer renners en categorieën voor een nieuw evenement</p>
      </div>

      {message && (
        <div className={`message message-${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Basic Event Info */}
      <div className="section">
        <h2>Evenement Details</h2>
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="eventName">Naam *</label>
            <input
              type="text"
              id="eventName"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="Tour de France 2026"
            />
          </div>

          <div className="form-group">
            <label htmlFor="location">Locatie</label>
            <input
              type="text"
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Frankrijk"
            />
          </div>

          <div className="form-group">
            <label htmlFor="startDate">Startdatum *</label>
            <input
              type="date"
              id="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="endDate">Einddatum</label>
            <input
              type="date"
              id="endDate"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <div className="form-group full-width">
            <label htmlFor="description">Beschrijving</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Beschrijf het evenement..."
              rows="3"
            />
          </div>

          <div className="form-group">
            <label htmlFor="status">Status</label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="upcoming">Binnenkort</option>
              <option value="active">Actief</option>
              <option value="completed">Afgelopen</option>
            </select>
          </div>
        </div>
      </div>

      {/* Rider Selection */}
      <div className="section">
        <div className="section-header">
          <h2>Beschikbare Renners ({selectedRiders.length})</h2>
          <div className="section-actions">
            <button 
              onClick={handleSelectAllRiders}
              className="btn-secondary"
            >
              Selecteer Alles
            </button>
            <button 
              onClick={handleClearRiders}
              className="btn-secondary"
            >
              Wis Alles
            </button>
            <button 
              onClick={() => setShowRiderModal(true)}
              className="btn-primary"
            >
              <Plus size={16} />
              Selecteer Renners
            </button>
          </div>
        </div>

        <div className="selected-riders">
          {selectedRiders.length === 0 ? (
            <p className="empty-state">Geen renners geselecteerd</p>
          ) : (
            <div className="riders-grid">
              {selectedRiders.map(rider => (
                <div key={rider.id} className="rider-chip">
                  <span>#{rider.number} {rider.name}</span>
                  <button 
                    onClick={() => handleToggleRider(rider)}
                    className="btn-remove-chip"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Categories */}
      <div className="section">
        <div className="section-header">
          <h2>Categorieën ({categories.length})</h2>
          <div className="section-actions">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={useDefaultCategories}
                onChange={(e) => {
                  setUseDefaultCategories(e.target.checked);
                  if (e.target.checked) {
                    setCategories(CATEGORIES);
                  } else {
                    setCategories([]);
                  }
                }}
              />
              Gebruik standaard categorieën
            </label>
            <button 
              onClick={handleAddCategory}
              className="btn-primary"
              disabled={useDefaultCategories}
            >
              <Plus size={16} />
              Categorie Toevoegen
            </button>
          </div>
        </div>

        {categories.length === 0 ? (
          <p className="empty-state">Geen categorieën. Voeg een categorie toe of gebruik de standaard.</p>
        ) : (
          <div className="categories-list">
            {categories.map((category, index) => (
              <div key={category.id} className="category-item">
                <div className="category-header">
                  <span className="category-number">{index + 1}</span>
                  <input
                    type="text"
                    value={category.name}
                    onChange={(e) => handleUpdateCategory(category.id, { name: e.target.value })}
                    className="category-name-input"
                    disabled={useDefaultCategories}
                  />
                  {!useDefaultCategories && (
                    <button 
                      onClick={() => handleDeleteCategory(category.id)}
                      className="btn-icon-danger"
                      title="Verwijder categorie"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
                <div className="category-stats">
                  {category.isJoker ? (
                    <span className="badge badge-joker">Joker categorie - alle joker renners</span>
                  ) : (
                    <span className="badge">
                      {category.allowedRiderNumbers?.length || 0} renners toegestaan
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="event-builder-actions">
        <button
          onClick={resetForm}
          className="btn-secondary"
          disabled={saving}
        >
          Reset
        </button>
        <button
          onClick={handleSaveEvent}
          className="btn-primary btn-large"
          disabled={saving}
        >
          <Save size={20} />
          {saving ? 'Opslaan...' : 'Event Opslaan'}
        </button>
      </div>

      {/* Rider Selection Modal */}
      {showRiderModal && (
        <div className="modal-overlay" onClick={() => setShowRiderModal(false)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Selecteer Renners ({selectedRiders.length} / {RIDERS.length})</h2>
              <button onClick={() => setShowRiderModal(false)} className="modal-close">
                <X size={24} />
              </button>
            </div>

            <div className="modal-body">
              <div className="search-box">
                <input
                  type="text"
                  placeholder="Zoek op naam of nummer..."
                  value={riderSearch}
                  onChange={(e) => setRiderSearch(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="riders-selection-list">
                {getFilteredRiders().map(rider => {
                  const isSelected = selectedRiders.find(r => r.id === rider.id);
                  return (
                    <div
                      key={rider.id}
                      className={`rider-selection-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleToggleRider(rider)}
                    >
                      <input
                        type="checkbox"
                        checked={!!isSelected}
                        onChange={() => {}}
                      />
                      <span className="rider-number">#{rider.number}</span>
                      <span className="rider-name">{rider.name}</span>
                      <div className="rider-badges">
                        {rider.isJoker && <span className="badge badge-joker">Joker</span>}
                        {rider.isYoungRider && <span className="badge badge-young">U25</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="modal-footer">
              <button onClick={() => setShowRiderModal(false)} className="btn-primary">
                Klaar ({selectedRiders.length} geselecteerd)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EventBuilder;
