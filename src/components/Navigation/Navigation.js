// src/components/Navigation/Navigation.js

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase/config';
import { Home, Calendar, LogOut, User, Settings, Shield } from 'lucide-react';
import './Navigation.css';

function Navigation({ user }) {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminStatus();
  }, [user.uid]);

  const checkAdminStatus = async () => {
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists() && userDoc.data().isAdmin) {
        setIsAdmin(true);
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Fout bij uitloggen:', error);
    }
  };

  return (
    <nav className="navigation">
      <div className="nav-container">
        <Link to="/" className="nav-brand">
          <span className="nav-logo">🚴</span>
          Koerspoule
        </Link>

        <div className="nav-links">
          <Link to="/" className="nav-link">
            <Home size={20} />
            <span>Dashboard</span>
          </Link>
          <Link to="/events" className="nav-link">
            <Calendar size={20} />
            <span>Evenementen</span>
          </Link>
          {isAdmin && (
            <>
              <Link to="/admin/stage-results" className="nav-link nav-link-admin">
                <Settings size={20} />
                <span>Resultaten</span>
              </Link>
              <Link to="/admin/event-management" className="nav-link nav-link-admin">
                <Shield size={20} />
                <span>Event Beheer</span>
              </Link>
            </>
          )}
        </div>

        <div className="nav-user">
          <span className="user-name">
            <User size={18} />
            {user.displayName}
            {isAdmin && <span className="admin-badge">Admin</span>}
          </span>
          <button onClick={handleLogout} className="btn-logout">
            <LogOut size={18} />
            Uitloggen
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navigation;
