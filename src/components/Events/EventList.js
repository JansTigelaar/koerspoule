// src/components/Events/EventList.js

import React, { useState, useEffect } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Users } from 'lucide-react';
import './EventList.css';

function EventList({ user }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const eventsQuery = query(
        collection(db, 'events'),
        orderBy('startDate', 'desc')
      );
      const eventsSnapshot = await getDocs(eventsQuery);
      const eventsData = eventsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setEvents(eventsData);
    } catch (error) {
      console.error('Fout bij laden events:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredEvents = () => {
    switch(filter) {
      case 'active':
        return events.filter(e => e.status === 'active');
      case 'upcoming':
        return events.filter(e => e.status === 'upcoming');
      case 'completed':
        return events.filter(e => e.status === 'completed');
      default:
        return events;
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: { text: 'Actief', class: 'badge-active' },
      upcoming: { text: 'Binnenkort', class: 'badge-upcoming' },
      completed: { text: 'Afgelopen', class: 'badge-completed' }
    };
    const badge = badges[status] || badges.active;
    return <span className={`status-badge ${badge.class}`}>{badge.text}</span>;
  };

  if (loading) {
    return <div className="loading">Laden...</div>;
  }

  const filteredEvents = getFilteredEvents();

  return (
    <div className="events-list">
      <div className="events-header">
        <h1>Alle evenementen</h1>
        
        <div className="filter-buttons">
          <button 
            className={filter === 'all' ? 'active' : ''}
            onClick={() => setFilter('all')}
          >
            Alles
          </button>
          <button 
            className={filter === 'active' ? 'active' : ''}
            onClick={() => setFilter('active')}
          >
            Actief
          </button>
          <button 
            className={filter === 'upcoming' ? 'active' : ''}
            onClick={() => setFilter('upcoming')}
          >
            Binnenkort
          </button>
          <button 
            className={filter === 'completed' ? 'active' : ''}
            onClick={() => setFilter('completed')}
          >
            Afgelopen
          </button>
        </div>
      </div>

      {filteredEvents.length === 0 ? (
        <p className="no-events">Geen evenementen gevonden</p>
      ) : (
        <div className="events-grid">
          {filteredEvents.map(event => (
            <div key={event.id} className="event-card">
              {getStatusBadge(event.status)}
              
              <h3>{event.name}</h3>
              
              <div className="event-details">
                <div className="event-detail">
                  <Calendar size={16} />
                  <span>
                    {new Date(event.startDate).toLocaleDateString('nl-NL')}
                    {event.endDate && ` - ${new Date(event.endDate).toLocaleDateString('nl-NL')}`}
                  </span>
                </div>
                
                {event.location && (
                  <div className="event-detail">
                    <MapPin size={16} />
                    <span>{event.location}</span>
                  </div>
                )}
              </div>

              {event.description && (
                <p className="event-description">{event.description}</p>
              )}

              <div className="event-actions">
                <button
                  onClick={() => navigate(`/team/${event.id}`)}
                  className="btn-primary"
                  disabled={event.status === 'completed'}
                >
                  {event.status === 'completed' ? 'Afgelopen' : 'Team maken'}
                </button>
                <button
                  onClick={() => navigate(`/leaderboard/${event.id}`)}
                  className="btn-secondary"
                >
                  Klassement
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default EventList;
