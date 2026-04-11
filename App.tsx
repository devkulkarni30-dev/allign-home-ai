import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { User } from './src/types';
import Home from './src/pages/Home';
import Login from './src/pages/Login';
import Signup from './src/pages/Signup';
import Dashboard from './src/pages/Dashboard';
import Results from './src/pages/Results';
import Profile from './src/pages/Profile';
import Subscription from './src/pages/Subscription';
import Comparison from './src/pages/Comparison';
import LiveAudit from './src/pages/LiveAudit';
import Feedback from './src/pages/Feedback';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        localStorage.setItem('alignhome_user', JSON.stringify(data.user));
      } else {
        // Fallback to localStorage if fetch fails but user was previously logged in
        const savedUser = localStorage.getItem('alignhome_user');
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }
      }
    } catch (error) {
      console.error('Session check failed:', error);
      const savedUser = localStorage.getItem('alignhome_user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem('alignhome_user', JSON.stringify(userData));
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout failed');
    }
    setUser(null);
    localStorage.removeItem('alignhome_user');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login onLogin={handleLogin} />} />
        <Route path="/signup" element={user ? <Navigate to="/dashboard" /> : <Signup onLogin={handleLogin} />} />
        <Route path="/dashboard" element={<Dashboard user={user} onLogout={handleLogout} />} />
        <Route path="/results/:id" element={<Results user={user} onLogout={handleLogout} />} />
        <Route path="/profile" element={<Profile user={user} onLogout={handleLogout} />} />
        <Route path="/subscription" element={<Subscription user={user} onLogout={handleLogout} />} />
        <Route path="/comparison" element={<Comparison user={user} onLogout={handleLogout} />} />
        <Route path="/live-audit" element={<LiveAudit user={user} onLogout={handleLogout} />} />
        <Route path="/feedback" element={<Feedback user={user} onLogout={handleLogout} />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

export default App;
