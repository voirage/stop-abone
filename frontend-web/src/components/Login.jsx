import React, { useState } from 'react';
import { login, register } from '../api';

function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);
    
    try {
      const data = await login(email, password);
      localStorage.setItem('access_token', data.access_token);
      onLoginSuccess();
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors de la connexion. Vérifiez vos identifiants.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);
    
    try {
      await register(email, password);
      setSuccessMsg('Compte créé avec succès ! Vous pouvez maintenant vous connecter.');
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors de la création du compte.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: '400px', margin: '0 auto' }}>
      <h2 className="text-center">Connexion / Inscription</h2>
      
      {error && <div className="error-msg text-center">{error}</div>}
      {successMsg && <div style={{ color: 'var(--success)', marginBottom: '10px', textAlign: 'center' }}>{successMsg}</div>}
      
      <form>
        <div className="form-group">
          <label>Email</label>
          <input 
            type="email" 
            className="form-control" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Mot de passe</label>
          <input 
            type="password" 
            className="form-control" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div style={{ textAlign: 'right', marginTop: '5px' }}>
          <a 
            href="/forgot-password" 
            style={{ fontSize: '0.85rem', color: 'var(--primary-color)', textDecoration: 'none' }}
            onClick={(e) => {
              e.preventDefault();
              window.location.href = '/forgot-password';
            }}
          >
            Mot de passe oublié ?
          </a>
        </div>
        
        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button 
            type="button" 
            className="btn btn-primary" 
            style={{ flex: 1 }}
            onClick={handleLogin}
            disabled={loading || !email || !password}
          >
            {loading ? 'Chargement...' : 'Se connecter'}
          </button>
          
          <button 
            type="button" 
            className="btn btn-outline" 
            style={{ flex: 1 }}
            onClick={handleRegister}
            disabled={loading || !email || !password}
          >
            Créer un compte
          </button>
        </div>
      </form>
    </div>
  );
}

export default Login;
