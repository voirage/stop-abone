import React, { useState } from 'react';
import { downloadLettreResiliation } from '../api';

function AssistantMenage({ abonnements, onClose, onAbonnementDeleted }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loadingAction, setLoadingAction] = useState(false);

  // S'il n'y a pas d'abonnement, on ferme
  if (!abonnements || abonnements.length === 0) {
    onClose();
    return null;
  }

  // Si on a terminé le parcours
  if (currentIndex >= abonnements.length) {
    return (
      <div className="modal-overlay">
        <div className="modal-content animate-up">
          <div style={{ fontSize: '4rem', marginBottom: '10px' }}>🎉</div>
          <h2 style={{ textAlign: 'center', color: 'var(--success)' }}>Bravo !</h2>
          <p style={{ textAlign: 'center', fontSize: '1.2rem', color: 'var(--text-main)', marginBottom: '30px' }}>
            Vous avez vérifié tous vos abonnements. Ce petit ménage régulier vous évitera des prélèvements inutiles.
          </p>
          <div style={{ textAlign: 'center' }}>
            <button 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '16px' }}
              onClick={onClose}
            >
              Retour au tableau de bord
            </button>
          </div>
        </div>
      </div>
    );
  }

  const abo = abonnements[currentIndex];
  
  // Calculs
  const today = new Date();
  const dateRenouv = new Date(abo.prochaine_date_renouvellement);
  const diffDaysRenouv = Math.ceil((dateRenouv - today) / (1000 * 60 * 60 * 24));
  
  let moisAnciennete = null;
  let annualCost = 0;

  if (abo.frequence.toLowerCase() === 'mensuel') annualCost = abo.prix * 12;
  else if (abo.frequence.toLowerCase() === 'trimestriel') annualCost = abo.prix * 4;
  else annualCost = abo.prix;

  if (abo.date_souscription) {
    const dateSouscription = new Date(abo.date_souscription);
    if (today >= dateSouscription) {
      moisAnciennete = Math.floor((today - dateSouscription) / (1000 * 60 * 60 * 24 * 30.44));
    }
  }

  const handleKeep = () => {
    setCurrentIndex(prev => prev + 1);
  };

  const handleCancel = async () => {
    setLoadingAction(true);
    try {
      await downloadLettreResiliation(abo.id, abo.nom);
      alert(`La lettre pour ${abo.nom} a été téléchargée !\n\nProchaines étapes :\n1. Imprimez et signez la lettre.\n2. Envoyez-la en recommandé avec accusé de réception.\n3. Bloquez le prélèvement auprès de votre banque si nécessaire.`);
      // On passe au suivant
    } catch (err) {
      alert("Erreur lors du téléchargement de la lettre.");
    } finally {
      setLoadingAction(false);
      setCurrentIndex(prev => prev + 1);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content animate-up" style={{ padding: '0', overflow: 'hidden' }}>
        
        {/* En-tête */}
        <div style={{ backgroundColor: 'var(--bg-color)', padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.9rem', textTransform: 'uppercase' }}>
            Analyse {currentIndex + 1} / {abonnements.length}
          </span>
          <button style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-muted)' }} onClick={onClose}>✕</button>
        </div>

        {/* Contenu */}
        <div style={{ padding: '40px 30px' }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h1 style={{ margin: '0 0 10px 0', fontSize: '2.5rem', color: 'var(--text-dark)' }}>{abo.nom}</h1>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--text-main)' }}>
              {abo.prix} € <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>/{abo.frequence.toLowerCase()}</span>
            </div>
            <div style={{ color: 'var(--success)', fontWeight: 'bold', marginTop: '10px' }}>
              Coût annuel : {annualCost.toFixed(2)} €
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--bg-color)', padding: '20px', borderRadius: 'var(--radius-md)', marginBottom: '30px', textAlign: 'center' }}>
            {moisAnciennete !== null && (
              <p style={{ margin: '0 0 10px 0', fontSize: '1.1rem', color: 'var(--text-main)' }}>
                ⏳ Abonné(e) depuis <strong>{moisAnciennete} mois</strong>
              </p>
            )}
            <p style={{ margin: 0, fontSize: '1.1rem', color: diffDaysRenouv <= 7 ? 'var(--danger)' : 'var(--text-main)', fontWeight: diffDaysRenouv <= 7 ? 'bold' : 'normal' }}>
              🔄 Renouvellement dans <strong>{diffDaysRenouv === 0 ? "aujourd'hui" : `${diffDaysRenouv} jours`}</strong>
            </p>
          </div>

          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <p style={{ fontSize: '1.3rem', fontWeight: 'bold', color: 'var(--text-dark)' }}>
              Utilisez-vous encore cet abonnement ?
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <button 
              className="btn btn-outline" 
              style={{ padding: '16px' }}
              onClick={handleKeep}
              disabled={loadingAction}
            >
              ✅ Je le garde pour l'instant
            </button>
            
            <button 
              className="btn btn-danger" 
              style={{ padding: '16px' }}
              onClick={handleCancel}
              disabled={loadingAction}
            >
              {loadingAction ? 'Génération de la lettre...' : '🔴 Résilier maintenant'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default AssistantMenage;
