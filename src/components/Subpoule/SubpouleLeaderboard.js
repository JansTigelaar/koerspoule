import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Trophy, Medal, Award, ArrowLeft, Users } from 'lucide-react';
import '../Leaderboard/Leaderboard.css';
import './Subpoule.css';

function SubpouleLeaderboard({ user }) {
  const { subpouleId } = useParams();
  const navigate = useNavigate();
  const [subpoule, setSubpoule] = useState(null);
  const [event, setEvent] = useState(null);
  const [teams, setTeams] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [subpouleId]);

  const loadData = async () => {
    try {
      // Laad subpoule
      const subpouleDoc = await getDoc(doc(db, 'subpoules', subpouleId));
      if (subpouleDoc.exists()) {
        const subpouleData = { id: subpouleDoc.id, ...subpouleDoc.data() };
        setSubpoule(subpouleData);

        // Laad event
        const eventDoc = await getDoc(doc(db, 'events', subpouleData.eventId));
        if (eventDoc.exists()) {
          setEvent({ id: eventDoc.id, ...eventDoc.data() });
        }

        // Laad members
        const membersQuery = query(
          collection(db, 'subpoule_members'),
          where('subpouleId', '==', subpouleId)
        );
        const membersSnapshot = await getDocs(membersQuery);
        const membersData = membersSnapshot.docs.map(doc => doc.data());
        setMembers(membersData);

        // Laad alle teams voor dit event
        const teamsQuery = query(
          collection(db, 'teams'),
          where('eventId', '==', subpouleData.eventId)
        );
        const teamsSnapshot = await getDocs(teamsQuery);
        const allTeams = teamsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Filter teams die bij deze subpoule horen
        const subpouleTeams = allTeams.filter(team => 
          team.subpouleIds && team.subpouleIds.includes(subpouleId)
        );

        // Sorteer op punten
        subpouleTeams.sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0));
        setTeams(subpouleTeams);
      }
    } catch (error) {
      console.error('Fout bij laden subpoule klassement:', error);
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

  if (!subpoule) {
    return <div className="error">Subpoule niet gevonden</div>;
  }

  return (
    <div className="subpoule-leaderboard">
      <div className="page-header">
        <button onClick={() => navigate(`/event/${subpoule.eventId}/subpoules`)} className="btn-back">
          <ArrowLeft size={20} />
          Terug
        </button>
        <div>
          <h1>{subpoule.name}</h1>
          <p className="subtitle">{event?.name}</p>
        </div>
      </div>

      <div className="subpoule-info">
        <div className="info-card">
          <Users size={20} />
          <div>
            <strong>{members.length}</strong> deelnemers
          </div>
        </div>
        <div className="info-card">
          <Trophy size={20} />
          <div>
            <strong>{teams.length}</strong> teams
          </div>
        </div>
      </div>

      {subpoule.description && (
        <div className="subpoule-description-box">
          <p>{subpoule.description}</p>
        </div>
      )}

      {teams.length === 0 ? (
        <div className="no-teams-message">
          <p>Nog geen teams in deze subpoule</p>
          <p className="subtitle">Maak een team aan en selecteer deze subpoule om deel te nemen!</p>
          <button onClick={() => navigate(`/team/${subpoule.eventId}`)} className="btn-primary">
            Team maken
          </button>
        </div>
      ) : (
        <div className="leaderboard-table">
          <table>
            <thead>
              <tr>
                <th className="rank-col">Rang</th>
                <th>Team</th>
                <th>Speler</th>
                <th className="points-col">Punten</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team, index) => (
                <tr 
                  key={team.id}
                  className={team.userId === user.uid ? 'user-team' : ''}
                >
                  <td className="rank-col">
                    <div className="rank-cell">
                      {getRankIcon(index + 1)}
                      <span className="rank-number">{index + 1}</span>
                    </div>
                  </td>
                  <td className="team-name">
                    {team.teamName}
                    {team.userId === user.uid && (
                      <span className="you-badge">Jij</span>
                    )}
                  </td>
                  <td className="user-name">{team.userName}</td>
                  <td className="points-col">
                    <strong>{team.totalPoints || 0}</strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {subpoule.joinCode && members.some(m => m.userId === user.uid && m.role === 'admin') && (
        <div className="admin-section">
          <h3>Beheer</h3>
          <div className="join-code-display">
            <span className="label">Join code voor uitnodigingen:</span>
            <code>{subpoule.joinCode}</code>
          </div>
        </div>
      )}
    </div>
  );
}

export default SubpouleLeaderboard;
