import React, { useState, useEffect } from 'react';
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import './Subpoule.css';

function SubpouleCreate({ user }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const { eventId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    loadEvent();
  }, [eventId]);

  const loadEvent = async () => {
    try {
      const eventDoc = await getDoc(doc(db, 'events', eventId));
      if (eventDoc.exists()) {
        setEvent({ id: eventDoc.id, ...eventDoc.data() });
      } else {
        setError('Evenement niet gevonden');
      }
    } catch (error) {
      console.error('Fout bij laden evenement:', error);
      setError('Fout bij laden evenement');
    } finally {
      setLoading(false);
    }
  };

  const generateJoinCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Vul een naam in voor de subpoule');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const subpouleData = {
        name: name.trim(),
        description: description.trim(),
        eventId: eventId,
        createdBy: user.uid,
        createdAt: new Date().toISOString(),
        isPublic: isPublic,
        joinCode: isPublic ? null : generateJoinCode(),
      };

      const docRef = await addDoc(collection(db, 'subpoules'), subpouleData);
      
      // Add creator as member
      await addDoc(collection(db, 'subpoule_members'), {
        subpouleId: docRef.id,
        userId: user.uid,
        userName: user.displayName || user.email,
        joinedAt: new Date().toISOString(),
        role: 'admin'
      });

      navigate(`/event/${eventId}/subpoules`);
    } catch (error) {
      console.error('Fout bij aanmaken subpoule:', error);
      setError('Fout bij aanmaken subpoule. Probeer het opnieuw.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="loading">Laden...</div>;
  }

  if (error && !event) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="subpoule-create">
      <div className="page-header">
        <button onClick={() => navigate(`/event/${eventId}/subpoules`)} className="btn-back">
          <ArrowLeft size={20} />
          Terug
        </button>
        <div>
          <h1>Nieuwe subpoule aanmaken</h1>
          <p className="subtitle">Voor evenement: {event?.name}</p>
        </div>
      </div>

      <div className="form-container">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Naam van de subpoule *</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="bijv. Familie, Vrienden, Werk, etc."
              maxLength={50}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Beschrijving (optioneel)</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Korte beschrijving van de subpoule"
              rows={3}
              maxLength={200}
            />
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
              />
              <span>Openbare subpoule (iedereen kan deelnemen)</span>
            </label>
            <p className="help-text">
              {isPublic 
                ? 'Deze subpoule is zichtbaar voor iedereen en iedereen kan direct deelnemen.'
                : 'Deze subpoule is alleen toegankelijk met een join code die je na aanmaken ontvangt.'}
            </p>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate(`/event/${eventId}/subpoules`)}
              className="btn-secondary"
              disabled={saving}
            >
              Annuleren
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={saving || !name.trim()}
            >
              {saving ? 'Aanmaken...' : 'Subpoule aanmaken'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SubpouleCreate;
