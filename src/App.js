// src/App.js

import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase/config';

// Components
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import ProtectedAdminRoute from './components/Auth/ProtectedAdminRoute';
import Dashboard from './components/Dashboard/Dashboard';
import EventList from './components/Events/EventList';
import TeamBuilder from './components/Team/TeamBuilder';
import Leaderboard from './components/Leaderboard/Leaderboard';
import StageResults from './components/Admin/StageResults';
import Navigation from './components/Navigation/Navigation';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Laden...</p>
      </div>
    );
  }

  return (
    <Router basename="/koerspoule">
      <div className="app">
        {user && <Navigation user={user} />}
        
        <Routes>
          <Route 
            path="/login" 
            element={user ? <Navigate to="/" /> : <Login />} 
          />
          <Route 
            path="/register" 
            element={user ? <Navigate to="/" /> : <Register />} 
          />
          <Route 
            path="/" 
            element={user ? <Dashboard user={user} /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/events" 
            element={user ? <EventList user={user} /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/team/:eventId" 
            element={user ? <TeamBuilder user={user} /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/leaderboard/:eventId" 
            element={user ? <Leaderboard user={user} /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/admin/stage-results" 
            element={
              user ? (
                <ProtectedAdminRoute user={user}>
                  <StageResults user={user} />
                </ProtectedAdminRoute>
              ) : (
                <Navigate to="/login" />
              )
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
