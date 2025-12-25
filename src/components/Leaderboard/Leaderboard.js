// src/components/Leaderboard/Leaderboard.js

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { collection, query, where, getDocs, doc, getDoc, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Trophy, Medal, Award } from 'lucide-react';
import './Leaderboard.css';

function Leaderboard({ user }) {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, [eventId]);

  const loadLeaderboard = async () => {
    try {
      // Laad event
      const eventDoc = await getDoc(doc(db, 'events', eventId));
      if (eventDoc.exists()) {
        setEvent({ id: eventDoc.id, ...eventDoc.data() });
      }

      // Laad alle teams voor dit event
      const teamsQuery = query(
        collection(db, 'teams'),
        where('eventId', '==', eventId)
      );
      const teamsSnapshot = await getDocs(teamsQuery);
      const teamsData = teamsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Sorteer op punten
      teamsData.sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0));
      setTeams(teamsData);

    } catch (error) {
      console.error('Fout bij laden klassement:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (position) => {
    switch(position) {
      case 1:
        return <Trophy className="rank-icon gold" size={24} />;
      case 2:
        return <Medal className="rank-icon silver" size={24} />;
      case 3:
        return <Award className="rank-icon bronze" size={24} />;
      default:
        return null;
    }
  };

  if (loading) {
    return <div className="loading">Laden...</div>;
  }

  return (
    <div className="leaderboard">
      <div className="leaderboard-header">
        <h1>Klassement</h1>
        {event && <h2>{event.name}</h2>}
      </div>

      {teams.length === 0 ? (
        <p className="no-teams">Nog geen teams ingeschreven</p>
      ) : (
        <div className="leaderboard-table">
          <table>
            <thead>
              <tr>
                <th>Positie</th>
                <th>Team</th>
                <th>Speler</th>
                <th>Punten</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team, index) => (
                <tr 
                  key={team.id} 
                  className={team.userId === user.uid ? 'current-user' : ''}
                >
                  <td className="rank-cell">
                    <span className="rank-number">{index + 1}</span>
                    {getRankIcon(index + 1)}
                  </td>
                  <td className="team-name">{team.teamName}</td>
                  <td className="user-name">{team.userName}</td>
                  <td className="points">{team.totalPoints || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="leaderboard-info">
        <h3>Hoe werkt het puntensysteem?</h3>
        <div className="points-grid">
          <div>1e plaats: <strong>50 punten</strong></div>
          <div>2e plaats: <strong>40 punten</strong></div>
          <div>3e plaats: <strong>32 punten</strong></div>
          <div>4e plaats: <strong>26 punten</strong></div>
          <div>5e plaats: <strong>22 punten</strong></div>
          <div>6-20e plaats: <strong>20-1 punten</strong></div>
        </div>
      </div>
    </div>
  );
}

export default Leaderboard;
