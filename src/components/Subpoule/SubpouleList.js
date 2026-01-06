import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Users, Lock, Globe, Plus } from 'lucide-react';
import './Subpoule.css';

function SubpouleList({ user }) {
  const [subpoules, setSubpoules] = useState([]);
  const [userMemberships, setUserMemberships] = useState(new Set());
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joinCode, setJoinCode] = useState('');
  const [showJoinCodeModal, setShowJoinCodeModal] = useState(false);
  const [joiningSubpouleId, setJoiningSubpouleId] = useState(null);
  const { eventId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, [eventId, user.uid]);

  const loadData = async () => {
    try {
      await Promise.all([
        loadEvent(),
        loadSubpoules(),
        loadUserMemberships()
      ]);
    } catch (error) {
      console.error('Fout bij laden data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEvent = async () => {
    const eventDoc = await getDoc(doc(db, 'events', eventId));
    if (eventDoc.exists()) {
      setEvent({ id: eventDoc.id, ...eventDoc.data() });
    }
  };

  const loadSubpoules = async () => {
    const subpoulesQuery = query(
      collection(db, 'subpoules'),
      where('eventId', '==', eventId)
    );
    const snapshot = await getDocs(subpoulesQuery);
    const subpoulesData = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setSubpoules(subpoulesData);
  };

  const loadUserMemberships = async () => {
    const membershipsQuery = query(
      collection(db, 'subpoule_members'),
      where('userId', '==', user.uid)
    );
    const snapshot = await getDocs(membershipsQuery);
    const membershipIds = new Set(snapshot.docs.map(doc => doc.data().subpouleId));
    setUserMemberships(membershipIds);
  };

  const handleJoinSubpoule = async (subpouleId, requiresCode = false) => {
    if (requiresCode) {
      setJoiningSubpouleId(subpouleId);
      setShowJoinCodeModal(true);
      return;
    }

    try {
      await addDoc(collection(db, 'subpoule_members'), {
        subpouleId: subpouleId,
        userId: user.uid,
        userName: user.displayName || user.email,
        joinedAt: new Date().toISOString(),
        role: 'member'
      });
      
      setUserMemberships(prev => new Set([...prev, subpouleId]));
    } catch (error) {
      console.error('Fout bij deelnemen aan subpoule:', error);
      alert('Fout bij deelnemen aan subpoule. Probeer het opnieuw.');
    }
  };

  const handleJoinWithCode = async () => {
    const subpoule = subpoules.find(s => s.id === joiningSubpouleId);
    
    if (!subpoule) {
      alert('Subpoule niet gevonden');
      return;
    }

    if (subpoule.joinCode !== joinCode.trim().toUpperCase()) {
      alert('Incorrecte join code');
      return;
    }

    try {
      await addDoc(collection(db, 'subpoule_members'), {
        subpouleId: joiningSubpouleId,
        userId: user.uid,
        userName: user.displayName || user.email,
        joinedAt: new Date().toISOString(),
        role: 'member'
      });
      
      setUserMemberships(prev => new Set([...prev, joiningSubpouleId]));
      setShowJoinCodeModal(false);
      setJoinCode('');
      setJoiningSubpouleId(null);
    } catch (error) {
      console.error('Fout bij deelnemen aan subpoule:', error);
      alert('Fout bij deelnemen aan subpoule. Probeer het opnieuw.');
    }
  };

  const getMemberCount = async (subpouleId) => {
    const membersQuery = query(
      collection(db, 'subpoule_members'),
      where('subpouleId', '==', subpouleId)
    );
    const snapshot = await getDocs(membersQuery);
    return snapshot.size;
  };

  if (loading) {
    return <div className="loading">Laden...</div>;
  }

  const publicSubpoules = subpoules.filter(s => s.isPublic);
  const privateSubpoules = subpoules.filter(s => !s.isPublic);

  return (
    <div className="subpoule-list">
      <div className="page-header">
        <button onClick={() => navigate('/events')} className="btn-back">
          <ArrowLeft size={20} />
          Terug
        </button>
        <div>
          <h1>Subpoules</h1>
          <p className="subtitle">{event?.name}</p>
        </div>
      </div>

      <div className="subpoule-actions">
        <button 
          onClick={() => navigate(`/subpoule/create/${eventId}`)}
          className="btn-primary"
        >
          <Plus size={20} />
          Nieuwe subpoule aanmaken
        </button>
      </div>

      {publicSubpoules.length === 0 && privateSubpoules.length === 0 ? (
        <div className="no-subpoules">
          <Users size={48} />
          <p>Nog geen subpoules voor dit evenement</p>
          <p className="subtitle">Maak de eerste subpoule aan om met vrienden te spelen!</p>
        </div>
      ) : (
        <>
          {publicSubpoules.length > 0 && (
            <section className="subpoule-section">
              <h2>
                <Globe size={20} />
                Openbare subpoules
              </h2>
              <div className="subpoules-grid">
                {publicSubpoules.map(subpoule => (
                  <SubpouleCard
                    key={subpoule.id}
                    subpoule={subpoule}
                    isMember={userMemberships.has(subpoule.id)}
                    onJoin={() => handleJoinSubpoule(subpoule.id, false)}
                    onView={() => navigate(`/subpoule/${subpoule.id}/leaderboard`)}
                  />
                ))}
              </div>
            </section>
          )}

          {privateSubpoules.length > 0 && (
            <section className="subpoule-section">
              <h2>
                <Lock size={20} />
                Private subpoules
              </h2>
              <div className="subpoules-grid">
                {privateSubpoules.map(subpoule => (
                  <SubpouleCard
                    key={subpoule.id}
                    subpoule={subpoule}
                    isMember={userMemberships.has(subpoule.id)}
                    isPrivate={true}
                    onJoin={() => handleJoinSubpoule(subpoule.id, true)}
                    onView={() => navigate(`/subpoule/${subpoule.id}/leaderboard`)}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {showJoinCodeModal && (
        <div className="modal-overlay" onClick={() => setShowJoinCodeModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Join code invoeren</h3>
            <p>Deze subpoule is privé. Voer de join code in om deel te nemen.</p>
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="XXXXX"
              maxLength={6}
              autoFocus
            />
            <div className="modal-actions">
              <button 
                onClick={() => {
                  setShowJoinCodeModal(false);
                  setJoinCode('');
                  setJoiningSubpouleId(null);
                }}
                className="btn-secondary"
              >
                Annuleren
              </button>
              <button 
                onClick={handleJoinWithCode}
                className="btn-primary"
                disabled={joinCode.trim().length !== 6}
              >
                Deelnemen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SubpouleCard({ subpoule, isMember, isPrivate, onJoin, onView }) {
  const [memberCount, setMemberCount] = useState(0);

  useEffect(() => {
    loadMemberCount();
  }, [subpoule.id]);

  const loadMemberCount = async () => {
    const membersQuery = query(
      collection(db, 'subpoule_members'),
      where('subpouleId', '==', subpoule.id)
    );
    const snapshot = await getDocs(membersQuery);
    setMemberCount(snapshot.size);
  };

  return (
    <div className="subpoule-card">
      <div className="subpoule-card-header">
        <h3>{subpoule.name}</h3>
        {isPrivate && <Lock size={16} className="private-icon" />}
      </div>
      
      {subpoule.description && (
        <p className="subpoule-description">{subpoule.description}</p>
      )}

      <div className="subpoule-meta">
        <span className="member-count">
          <Users size={16} />
          {memberCount} {memberCount === 1 ? 'deelnemer' : 'deelnemers'}
        </span>
      </div>

      {isPrivate && isMember && subpoule.joinCode && (
        <div className="join-code-display">
          <span className="label">Join code:</span>
          <code>{subpoule.joinCode}</code>
        </div>
      )}

      <div className="subpoule-actions">
        {isMember ? (
          <button onClick={onView} className="btn-primary">
            Bekijk klassement
          </button>
        ) : (
          <button onClick={onJoin} className="btn-secondary">
            Deelnemen
          </button>
        )}
      </div>
    </div>
  );
}

export default SubpouleList;
