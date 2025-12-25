// src/components/Auth/ProtectedAdminRoute.js

import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';

function ProtectedAdminRoute({ user, children }) {
  const [isAdmin, setIsAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminStatus();
  }, [user.uid]);

  const checkAdminStatus = async () => {
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists() && userDoc.data().isAdmin === true) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Toegang controleren...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div style={{ 
        padding: '3rem', 
        textAlign: 'center', 
        maxWidth: '600px', 
        margin: '0 auto' 
      }}>
        <h1 style={{ color: '#ef4444', marginBottom: '1rem' }}>⛔ Geen Toegang</h1>
        <p style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>
          Je hebt geen administrator rechten om deze pagina te bekijken.
        </p>
        <p style={{ color: '#666' }}>
          Neem contact op met een administrator als je denkt dat dit een fout is.
        </p>
      </div>
    );
  }

  return children;
}

export default ProtectedAdminRoute;
