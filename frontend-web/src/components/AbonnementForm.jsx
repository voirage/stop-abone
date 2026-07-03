import React, { useState } from 'react';
import { createAbonnement } from '../api';

function AbonnementForm({ onAbonnementAdded }) {
  const [formData, setFormData] = useState({
    nom: '',
    categorie: '',
    prix: '',
    frequence: 'mensuel',
    prochaine_date_renouvellement: '',
    date_souscription: '',
    numero_contrat: '',
    statut: 'actif',
    renouvellement_auto: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const dataToSubmit = {
        ...formData,
        prix: Number(formData.prix)
      };
      
      // Enlever date_souscription si vide
      if (!dataToSubmit.date_souscription) {
        delete dataToSubmit.date_souscription;
      }
      
      await createAbonnement(dataToSubmit);
      
      // Vider le formulaire
      setFormData({
        nom: '',
        categorie: '',
        prix: '',
        frequence: 'mensuel',
        prochaine_date_renouvellement: '',
        date_souscription: '',
        numero_contrat: '',
        statut: 'actif',
        renouvellement_auto: true
      });
      
      // Recharger la liste et le résumé
      onAbonnementAdded();
    } catch (err) {
      const apiError = err.response?.data?.detail || err.response?.data?.message || err.message;
      setError(typeof apiError === 'object' ? JSON.stringify(apiError) : apiError || 'Erreur lors de l\'ajout de l\'abonnement.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2>Ajouter un abonnement</h2>
      {error && <div className="error-msg">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Nom</label>
          <input 
            type="text" 
            name="nom"
            className="form-control" 
            value={formData.nom}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label>Catégorie</label>
          <input 
            type="text" 
            name="categorie"
            className="form-control" 
            value={formData.categorie}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label>Prix (€)</label>
          <input 
            type="number" 
            step="0.01"
            name="prix"
            className="form-control" 
            value={formData.prix}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label>Fréquence</label>
          <select 
            name="frequence"
            className="form-control"
            value={formData.frequence}
            onChange={handleChange}
          >
            <option value="mensuel">Mensuel</option>
            <option value="annuel">Annuel</option>
            <option value="trimestriel">Trimestriel</option>
          </select>
        </div>
        
        <div className="form-group">
          <label>Prochain Renouvellement</label>
          <input 
            type="date" 
            name="prochaine_date_renouvellement"
            className="form-control" 
            value={formData.prochaine_date_renouvellement}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label>Date de souscription (optionnel, pour l'historique)</label>
          <input 
            type="date" 
            name="date_souscription"
            className="form-control" 
            value={formData.date_souscription}
            onChange={handleChange}
          />
        </div>
        
        <div className="form-group">
          <label>Numéro de contrat (optionnel)</label>
          <input 
            type="text" 
            name="numero_contrat"
            className="form-control" 
            value={formData.numero_contrat}
            onChange={handleChange}
          />
        </div>

        <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label style={{ margin: 0 }}>Renouvellement automatique</label>
          <input 
            type="checkbox" 
            name="renouvellement_auto"
            checked={formData.renouvellement_auto}
            onChange={handleChange}
            style={{ width: '20px', height: '20px' }}
          />
        </div>
        
        <div className="form-group">
          <label>Statut</label>
          <select 
            name="statut"
            className="form-control"
            value={formData.statut}
            onChange={handleChange}
          >
            <option value="actif">Actif</option>
            <option value="inactif">Inactif</option>
          </select>
        </div>
        
        <button 
          type="submit" 
          className="btn btn-primary" 
          style={{ width: '100%', marginTop: '10px' }}
          disabled={loading}
        >
          {loading ? 'Ajout...' : 'Ajouter'}
        </button>
      </form>
    </div>
  );
}

export default AbonnementForm;
