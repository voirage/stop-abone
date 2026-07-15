import React, { useState } from 'react';
import { forgotPassword } from '../api';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      await forgotPassword(email);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.detail || "Une erreur réseau s'est produite. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: '400px', margin: '100px auto', padding: '30px', textAlign: 'center' }}>
      <h2 style={{ marginBottom: '20px' }}>Mot de passe oublié</h2>
      
      {success ? (
        <div>
          <div className="text-success" style={{ marginBottom: '20px' }}>
            Si un compte correspond à cette adresse, un email de réinitialisation vous a été envoyé.
          </div>
          <button className="btn btn-outline" onClick={() => window.location.href = '/'}>
            Retour à la connexion
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>
            Saisissez votre adresse e-mail. Nous vous enverrons un lien sécurisé pour choisir un nouveau mot de passe.
          </p>
          {error && <div className="error-msg" style={{ marginBottom: '15px' }}>{error}</div>}
          
          <div style={{ marginBottom: '20px', textAlign: 'left' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>E-mail</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}
            />
          </div>
          
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginBottom: '15px' }} disabled={loading}>
            {loading ? 'Envoi en cours...' : 'Envoyer le lien de réinitialisation'}
          </button>
          
          <button type="button" className="btn btn-outline" style={{ width: '100%', border: 'none', backgroundColor: 'transparent' }} onClick={() => window.location.href = '/'}>
            Annuler
          </button>
        </form>
      )}
    </div>
  );
}

export default ForgotPassword;
