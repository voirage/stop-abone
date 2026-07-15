import React, { useState, useEffect } from 'react';
import { resetPassword } from '../api';

function ResetPassword() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Extract token from URL
    const urlParams = new URLSearchParams(window.location.search);
    const tokenParam = urlParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      setError("Le lien de réinitialisation est invalide ou manquant.");
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) return;
    
    if (newPassword !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      await resetPassword(token, newPassword, confirmPassword);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.detail || "Une erreur est survenue lors de la réinitialisation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: '400px', margin: '100px auto', padding: '30px', textAlign: 'center' }}>
      <h2 style={{ marginBottom: '20px' }}>Nouveau mot de passe</h2>
      
      {success ? (
        <div>
          <div className="text-success" style={{ marginBottom: '20px', fontSize: '1.1rem' }}>
            🎉 Votre mot de passe a été réinitialisé avec succès !
          </div>
          <button className="btn btn-primary" onClick={() => window.location.href = '/'}>
            Retour à la connexion
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {error && <div className="error-msg" style={{ marginBottom: '15px' }}>{error}</div>}
          
          <div style={{ marginBottom: '15px', textAlign: 'left' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Nouveau mot de passe</label>
            <input 
              type="password" 
              value={newPassword} 
              onChange={(e) => setNewPassword(e.target.value)} 
              required 
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}
            />
            <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: '5px', fontSize: '0.8rem' }}>
              Minimum 8 caractères, dont une majuscule, une minuscule et un chiffre.
            </small>
          </div>
          
          <div style={{ marginBottom: '25px', textAlign: 'left' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Confirmer le mot de passe</label>
            <input 
              type="password" 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
              required 
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}
            />
          </div>
          
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginBottom: '15px' }} disabled={loading || !token}>
            {loading ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
          </button>
        </form>
      )}
    </div>
  );
}

export default ResetPassword;
