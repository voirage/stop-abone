import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import logo from './assets/logo-stop-abos-transparent.png';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Vérifier si un token existe au chargement
    const token = localStorage.getItem('access_token');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    setIsAuthenticated(false);
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <img src={logo} alt="STOP-ABOS" className="app-logo" />
        {isAuthenticated && (
          <button className="btn btn-outline" onClick={handleLogout}>
            Déconnexion
          </button>
        )}
      </header>
      
      <main>
        {isAuthenticated ? (
          <Dashboard />
        ) : window.location.pathname === '/forgot-password' ? (
          <ForgotPassword />
        ) : window.location.pathname === '/reset-password' ? (
          <ResetPassword />
        ) : (
          <Login onLoginSuccess={handleLoginSuccess} />
        )}
      </main>
    </div>
  );
}

export default App;
