// src/components/Dashboard/Dashboard.js

import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useNavigate } from 'react-router-dom';
import { Trophy, Users, Calendar, PlusCircle } from 'lucide-react';
import './Dashboard.css';

function Dashboard({ user }) {
  const [activeEvents, setActiveEvents] = useState([]);
  const [userTeams, setUserTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [latestStory, setLatestStory] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboardData();
  }, [user.uid]);

  const loadDashboardData = async () => {
    try {
      // Laad actieve events - TIJDELIJK ZONDER ORDERBY (totdat index klaar is)
      const eventsQuery = query(
        collection(db, 'events'),
        where('status', '==', 'active')
        // orderBy('startDate', 'desc') // Tijdelijk uitgeschakeld - vereist index
      );
      const eventsSnapshot = await getDocs(eventsQuery);
      let events = eventsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Sorteer events in JavaScript (tijdelijke oplossing)
      events = events.sort((a, b) => {
        const dateA = new Date(a.startDate || 0);
        const dateB = new Date(b.startDate || 0);
        return dateB - dateA; // desc order
      });
      
      setActiveEvents(events);

      // Laad gebruiker teams
      const teamsQuery = query(
        collection(db, 'teams'),
        where('userId', '==', user.uid)
      );
      const teamsSnapshot = await getDocs(teamsQuery);
      
      const teams = teamsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUserTeams(teams);

      // Laad laatste verhaal
      if (events.length > 0) {
        const storyQuery = query(
          collection(db, 'events'),
          where('eventId', '==', events[0].id)
        );
        const storySnapshot = await getDocs(storyQuery);
        const stories = storySnapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          .filter(story => story.story) // Only stories that have been saved
          .sort((a, b) => new Date(b.processedAt) - new Date(a.processedAt));
        
        if (stories.length > 0) {
          setLatestStory(stories[0]);
        }
      }

    } catch (error) {
      console.error('Fout bij laden dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTeamForEvent = (eventId) => {
    return userTeams.find(team => team.eventId === eventId);
  };

  if (loading) {
    return <div className="loading">Laden...</div>;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Welkom, {user.displayName}!</h1>
        <p>Stel je teams samen en bekijk de standen</p>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <Calendar size={32} />
          <div>
            <h3>{activeEvents.length}</h3>
            <p>Actieve events</p>
          </div>
        </div>
        <div className="stat-card">
          <Users size={32} />
          <div>
            <h3>{userTeams.length}</h3>
            <p>Mijn teams</p>
          </div>
        </div>
      </div>

      {latestStory && latestStory.story && (
        <section className="story-section">
          <h2>Laatste Etappeverslag</h2>
          <div className="story-card">
            <div className="story-card-header">
              <h3>Etappe {latestStory.stageNumber}</h3>
              <span className="story-date">
                {new Date(latestStory.processedAt).toLocaleDateString('nl-NL', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </span>
            </div>
            <div className="story-card-content">
              {latestStory.story}
            </div>
          </div>
        </section>
      )}

      <section className="events-section">
        <h2>Actieve evenementen</h2>
        {activeEvents.length === 0 ? (
          <p className="no-events">Geen actieve evenementen op dit moment</p>
        ) : (
          <div className="events-grid">
            {activeEvents.map(event => {
              const userTeam = getTeamForEvent(event.id);
              
              return (
                <div key={event.id} className="event-card">
                  <div className="event-header">
                    <h3>{event.name}</h3>
                    <span className="event-date">
                      {new Date(event.startDate).toLocaleDateString('nl-NL')}
                    </span>
                  </div>
                  
                  {event.description && (
                    <p className="event-description">{event.description}</p>
                  )}

                  <div className="event-actions">
                    {userTeam ? (
                      <>
                        <button
                          onClick={() => navigate(`/team/${event.id}`)}
                          className="btn-secondary"
                        >
                          Team bewerken
                        </button>
                        <button
                          onClick={() => navigate(`/leaderboard/${event.id}`)}
                          className="btn-primary"
                        >
                          <Trophy size={16} />
                          Klassement
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => navigate(`/team/${event.id}`)}
                        className="btn-primary"
                      >
                        <PlusCircle size={16} />
                        Team maken
                      </button>
                    )}
                  </div>

                  {userTeam && (
                    <div className="team-status">
                      <span className="team-name">{userTeam.teamName}</span>
                      <span className="team-points">{userTeam.totalPoints || 0} punten</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

export default Dashboard;
