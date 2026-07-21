import React, { useState } from 'react';
import { analyserCSV, createAbonnement } from '../api';

function ImportCSV({ onImportSuccess }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [candidates, setCandidates] = useState([]);
  const [currentCandidateIndex, setCurrentCandidateIndex] = useState(0);
  const [showConfirmForm, setShowConfirmForm] = useState(false);
  const [formData, setFormData] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleAnalyze = async () => {
    if (!file) {
      setError('Veuillez sélectionner un fichier CSV.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const results = await analyserCSV(file);
      setCandidates(results);
      if (results.length === 0) {
        setError("Aucun paiement récurrent n'a été détecté dans ce fichier.");
      }
    } catch (err) {
      setError(err.message || "Erreur lors de l'analyse du fichier");
    } finally {
      setLoading(false);
    }
  };

  const handleNextCandidate = () => {
    if (currentCandidateIndex < candidates.length - 1) {
      setCurrentCandidateIndex(currentCandidateIndex + 1);
      setShowConfirmForm(false);
    } else {
      // Finished
      setCandidates([]);
      setCurrentCandidateIndex(0);
      setShowConfirmForm(false);
      onImportSuccess(); // Refresh dashboard
    }
  };

  const handleAccept = () => {
    const candidate = candidates[currentCandidateIndex];
    setFormData({
      nom: candidate.nom,
      categorie: candidate.categorie,
      prix: candidate.prix,
      frequence: candidate.frequence,
      prochaine_date_renouvellement: candidate.prochaine_date_renouvellement,
      date_souscription: candidate.date_souscription,
      renouvellement_auto: candidate.renouvellement_auto,
      source_detection: candidate.source_detection,
      libelle_detection: candidate.libelle_detection,
      nombre_paiements_detectes: candidate.nombre_paiements_detectes,
      date_premier_paiement: candidate.date_premier_paiement,
      date_dernier_paiement: candidate.date_dernier_paiement,
      confiance_detection: candidate.confiance_detection,
      type_recurrent: candidate.type_recurrent
    });
    setShowConfirmForm(true);
  };

  const handleConfirmAdd = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await createAbonnement(formData);
      handleNextCandidate();
    } catch (err) {
      setError(err.response?.data?.detail || "Erreur lors de l'ajout");
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  if (candidates.length > 0) {
    const candidate = candidates[currentCandidateIndex];

    if (showConfirmForm) {
      return (
        <div className="card" style={{ padding: '20px', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
          <h3>Confirmer l'ajout de {candidate.nom}</h3>
          {error && <div className="error-msg">{error}</div>}
          <form onSubmit={handleConfirmAdd} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div>
              <label>Nom du service</label>
              <input type="text" name="nom" value={formData.nom} onChange={handleFormChange} required />
            </div>
            <div>
              <label>Catégorie</label>
              <select name="categorie" value={formData.categorie} onChange={handleFormChange}>
                <option value="Streaming">Streaming</option>
                <option value="Musique">Musique</option>
                <option value="Telecom">Télécom</option>
                <option value="Logiciel ou Cloud">Logiciel ou Cloud</option>
                <option value="Sport">Sport</option>
                <option value="Autre">Autre</option>
              </select>
            </div>
            <div>
              <label>Prix (€)</label>
              <input type="number" step="0.01" name="prix" value={formData.prix} onChange={handleFormChange} required />
            </div>
            <div>
              <label>Fréquence</label>
              <select name="frequence" value={formData.frequence} onChange={handleFormChange}>
                <option value="mensuel">Mensuel</option>
                <option value="annuel">Annuel</option>
              </select>
            </div>
            <div>
              <label>Prochaine date de renouvellement</label>
              <input type="date" name="prochaine_date_renouvellement" value={formData.prochaine_date_renouvellement.substring(0,10)} onChange={handleFormChange} required />
            </div>
            <div>
              <label>Date de souscription estimée</label>
              <input type="date" name="date_souscription" value={formData.date_souscription?.substring(0,10)} onChange={handleFormChange} />
            </div>
            
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button type="submit" className="btn btn-primary" disabled={loading}>Enregistrer</button>
              <button type="button" className="btn btn-outline" onClick={() => setShowConfirmForm(false)} disabled={loading}>Annuler</button>
            </div>
          </form>
        </div>
      );
    }

    let headerTitle = "Abonnements potentiels détectés";
    let actionButtons = null;

    if (candidate.type_recurrent === 'non_subscription') {
      headerTitle = "Exclu de l'analyse";
      actionButtons = (
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          <button className="btn btn-outline" onClick={handleNextCandidate}>Passer</button>
        </div>
      );
    } else if (candidate.type_recurrent === 'recurring_contract') {
      headerTitle = "Paiement récurrent à vérifier";
      actionButtons = (
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={handleAccept}>Conserver à titre d'info</button>
          <button className="btn btn-outline" onClick={handleNextCandidate}>Ignorer</button>
        </div>
      );
    } else {
      headerTitle = "Abonnement détecté";
      actionButtons = (
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={handleAccept}>Oui, ajouter cet abonnement</button>
          <button className="btn btn-outline" onClick={handleNextCandidate}>Non, ignorer</button>
          <button className="btn btn-outline" onClick={handleNextCandidate} style={{ color: 'var(--text-muted)', border: 'none' }}>Me le rappeler plus tard</button>
        </div>
      );
    }

    return (
      <div className="card animate-up" style={{ padding: '20px', border: '1px solid var(--border-color)', borderRadius: '12px', opacity: candidate.type_recurrent === 'non_subscription' ? 0.7 : 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>{headerTitle} ({currentCandidateIndex + 1}/{candidates.length})</h3>
        </div>
        
        <div style={{ margin: '20px 0', padding: '20px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
          <h4 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>{candidate.nom}</h4>
          <p><strong>Montant estimé :</strong> {candidate.prix} € / {candidate.frequence}</p>
          <p><strong>Niveau de confiance :</strong> {candidate.confiance_detection}</p>
          <p><strong>Explication :</strong> {candidate.explication_detection}</p>
          <p><strong>Catégorie suggérée :</strong> {candidate.categorie}</p>
        </div>

        {actionButtons}
      </div>
    );
  }

  return (
    <div className="card animate-up" style={{ padding: '20px', border: '1px solid var(--border-color)', borderRadius: '12px', marginBottom: '20px' }}>
      <h3>Importer un relevé bancaire</h3>
      <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>
        Importez un fichier CSV contenant vos opérations bancaires. STOP-ABOS recherchera uniquement les paiements récurrents pouvant correspondre à des abonnements. Aucun identifiant bancaire ne vous sera demandé. Le fichier est analysé uniquement pour rechercher des paiements récurrents. Il n’est pas conservé après l’analyse.
      </p>
      
      {error && <div className="error-msg">{error}</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <input 
          type="file" 
          accept=".csv" 
          onChange={handleFileChange} 
          style={{ padding: '10px', border: '1px dashed var(--border-color)', borderRadius: '8px' }}
        />
        
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Formats acceptés : CSV (séparateur virgule ou point-virgule). <br/>
          <em>Vous devrez confirmer chaque détection avant qu’elle soit enregistrée.</em>
        </div>

        <button 
          className="btn btn-primary" 
          onClick={handleAnalyze} 
          disabled={!file || loading}
          style={{ alignSelf: 'flex-start' }}
        >
          {loading ? 'Analyse en cours...' : 'Analyser le fichier'}
        </button>
      </div>
    </div>
  );
}

export default ImportCSV;
