import React, { useState } from 'react';
import { deleteAbonnement, downloadLettreResiliation } from '../api';

function AbonnementList({ abonnements, loading, onAbonnementDeleted }) {
  const [actionLoading, setActionLoading] = useState(null);
  
  // State pour la modale de résiliation
  const [showResiliationModal, setShowResiliationModal] = useState(false);
  const [aboResiliation, setAboResiliation] = useState(null);
  const [showBravo, setShowBravo] = useState(false);
  const [lastEconomie, setLastEconomie] = useState({ mensuel: 0, annuel: 0 });
  const [showReasonsModal, setShowReasonsModal] = useState(false);
  const [aboReasons, setAboReasons] = useState(null);

  const startResiliation = async (abo) => {
    setActionLoading(abo.id);
    try {
      // 1. Télécharger la lettre automatiquement
      await downloadLettreResiliation(abo.id, abo.nom);
      
      // 2. Afficher la modale des étapes
      setAboResiliation(abo);
      setShowResiliationModal(true);
    } catch (err) {
      alert('Erreur lors du téléchargement de la lettre.');
    } finally {
      setActionLoading(null);
    }
  };

  const finishResiliation = async () => {
    if (!aboResiliation) return;
    
    const id = aboResiliation.id;
    let economieAnnuelle = 0;
    let economieMensuelle = 0;
    
    if (aboResiliation.frequence.toLowerCase() === 'mensuel') {
      economieMensuelle = aboResiliation.prix;
      economieAnnuelle = aboResiliation.prix * 12;
    } else if (aboResiliation.frequence.toLowerCase() === 'trimestriel') {
      economieMensuelle = aboResiliation.prix / 3;
      economieAnnuelle = aboResiliation.prix * 4;
    } else {
      economieMensuelle = aboResiliation.prix / 12;
      economieAnnuelle = aboResiliation.prix;
    }

    setShowResiliationModal(false);
    setActionLoading(`delete-${id}`);

    try {
      await deleteAbonnement(id);
      
      // Afficher l'écran Bravo
      setLastEconomie({ mensuel: economieMensuelle, annuel: economieAnnuelle });
      setShowBravo(true);
      
      // Mettre à jour les données globales
      onAbonnementDeleted(economieAnnuelle);
      
      // Fermer le bravo après 5 secondes
      setTimeout(() => {
        setShowBravo(false);
      }, 5000);

    } catch (err) {
      alert('Erreur lors de la suppression.');
    } finally {
      setActionLoading(null);
      setAboResiliation(null);
    }
  };

  const handleDownloadOnly = async (id, nom) => {
    setActionLoading(`dl-${id}`);
    try {
      await downloadLettreResiliation(id, nom);
    } catch (err) {
      alert('Erreur lors du téléchargement de la lettre.');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="card loading">
        Analyse de vos abonnements en cours...
      </div>
    );
  }

  if (abonnements.length === 0) {
    return (
      <div className="card empty-state">
        <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🎉</div>
        Aucun abonnement actif trouvé.
      </div>
    );
  }

  const today = new Date();

  console.log("[TRACE 5] Valeur reçue dans AbonnementList:", abonnements);
  
  // On trie par score STOP décroissant (les plus risqués en premier)
  const sortedAbonnements = [...abonnements].sort((a, b) => {
    return (b.score || 0) - (a.score || 0);
  });

  return (
    <div style={{ marginTop: '20px' }}>
      
      {/* Modale de Résiliation */}
      {showResiliationModal && aboResiliation && (
        <div className="modal-overlay animate-up">
          <div className="modal-content">
            <h2 style={{ fontSize: '1.8rem', marginBottom: '20px' }}>Lettre téléchargée ! 📥</h2>
            <div style={{ textAlign: 'left', marginBottom: '30px' }}>
              <p style={{ fontSize: '1.1rem', color: 'var(--text-main)', marginBottom: '20px' }}>
                Voici les prochaines étapes pour finaliser la résiliation de <strong>{aboResiliation.nom}</strong> :
              </p>
              
              <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                <div style={{ backgroundColor: 'var(--accent-blue)', color: 'white', width: '30px', height: '30px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0 }}>1</div>
                <div>
                  <div style={{ fontWeight: 'bold' }}>Signer la lettre</div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Imprimez la lettre téléchargée et signez-la en bas de page.</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                <div style={{ backgroundColor: 'var(--accent-blue)', color: 'white', width: '30px', height: '30px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0 }}>2</div>
                <div>
                  <div style={{ fontWeight: 'bold' }}>L'envoyer au fournisseur</div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Envoyez la lettre par courrier recommandé avec accusé de réception.</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                <div style={{ backgroundColor: 'var(--accent-blue)', color: 'white', width: '30px', height: '30px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0 }}>3</div>
                <div>
                  <div style={{ fontWeight: 'bold' }}>Vérifier que le prélèvement est arrêté</div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Surveillez votre compte bancaire le mois prochain.</div>
                </div>
              </div>
            </div>

            <div style={{ backgroundColor: 'var(--success-light)', color: 'var(--success)', padding: '15px', borderRadius: 'var(--radius-md)', marginBottom: '30px', fontWeight: '500' }}>
              Vous êtes sur la bonne voie. Fini les prélèvements abusifs !
            </div>

            <button 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '15px' }}
              onClick={finishResiliation}
            >
              J'ai compris, retirer cet abonnement
            </button>
          </div>
        </div>
      )}

      {/* Modale de Célébration (Bravo) */}
      {showBravo && (
        <div className="modal-overlay animate-up" style={{ zIndex: 2000 }}>
          <div className="modal-content" style={{ textAlign: 'center', padding: '50px 30px' }}>
            <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🎉</div>
            <h2 style={{ fontSize: '2.5rem', margin: '0 0 10px 0', color: 'var(--success)' }}>Bravo !</h2>
            <p style={{ fontSize: '1.2rem', color: 'var(--text-main)' }}>Vous économisez désormais :</p>
            <div style={{ fontSize: '2rem', fontWeight: '900', color: 'var(--text-dark)', margin: '20px 0' }}>
              {lastEconomie.mensuel.toFixed(2)} € <span style={{fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 'normal'}}>/mois</span>
            </div>
            <div style={{ fontSize: '1.2rem', color: 'var(--success)', fontWeight: 'bold' }}>
              Soit {lastEconomie.annuel.toFixed(2)} € par an !
            </div>
            <button 
              className="btn btn-outline" 
              style={{ marginTop: '30px' }}
              onClick={() => setShowBravo(false)}
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* Modale des raisons du score */}
      {showReasonsModal && aboReasons && (
        <div className="modal-overlay animate-up" style={{ zIndex: 2000 }}>
          <div className="modal-content" style={{ textAlign: 'left', padding: '30px' }}>
            <h2 style={{ fontSize: '1.8rem', marginBottom: '20px' }}>Détail du STOP SCORE</h2>
            <p style={{ fontSize: '1.1rem', marginBottom: '20px', color: 'var(--text-main)' }}>
              Voici pourquoi nous vous recommandons de surveiller l'abonnement <strong>{aboReasons.nom}</strong> :
            </p>
            <div style={{ paddingLeft: '10px', marginBottom: '30px', fontSize: '1.05rem', color: 'var(--text-dark)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {aboReasons.explication && aboReasons.explication.length > 0 ? (
                aboReasons.explication.map((reason, idx) => (
                  <div key={idx}>{reason}</div>
                ))
              ) : (
                <div>Aucun point de vigilance particulier.</div>
              )}
            </div>
            <button 
              className="btn btn-outline" 
              style={{ width: '100%' }}
              onClick={() => setShowReasonsModal(false)}
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      <div className="abos-list">
        {sortedAbonnements.map((abo) => {
          console.log(`[TRACE 6] Valeur utilisée pour le render de la carte '${abo.nom}':`, abo.score);
          let borderStyle = '1px solid var(--border-color)';
          let riskIcon = '🟢';
          
          if (abo.niveau === "Probablement oublié") {
            riskIcon = '🔴';
            borderStyle = '1px solid #fc8181';
          } else if (abo.niveau === "À surveiller") {
            riskIcon = '🟠';
            borderStyle = '1px solid #f6ad55';
          }

          return (
            <div key={abo.id} className="card animate-up" style={{ 
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              border: borderStyle
            }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.3rem' }}>{abo.nom}</h3>
                    {/* Badge retiré au profit du bloc STOP SCORE plus bas */}
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{abo.categorie}</div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--text-dark)' }}>
                    {abo.prix} € <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>/{abo.frequence.toLowerCase()}</span>
                  </div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--success)', fontWeight: 'bold' }}>
                    Économie annuelle : {(abo.economieAnnuelle || 0).toFixed(2)} €
                  </div>
                </div>
              </div>

              <div style={{ backgroundColor: 'var(--bg-color)', padding: '15px', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '5px' }}>STOP SCORE</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: '900', color: abo.couleur }}>{abo.score || 0} <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>/100</span></div>
                  <div style={{ fontWeight: '500', color: abo.couleur, marginTop: '5px' }}>
                    {riskIcon} {abo.niveau || "Aucun risque"}
                  </div>
                </div>
                <button 
                  className="btn btn-outline" 
                  style={{ padding: '8px 15px', fontSize: '0.9rem' }}
                  onClick={() => { setAboReasons(abo); setShowReasonsModal(true); }}
                >
                  Pourquoi ?
                </button>
              </div>

              <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
                <button 
                  className="btn btn-danger"
                  style={{ flex: '1 1 250px', padding: '16px' }}
                  onClick={() => startResiliation(abo)}
                  disabled={actionLoading !== null}
                >
                  {actionLoading === abo.id ? 'Veuillez patienter...' : 'Résilier cet abonnement'}
                </button>
                
                <button 
                  className="btn btn-outline"
                  style={{ flex: '0 1 auto', padding: '16px' }}
                  onClick={() => handleDownloadOnly(abo.id, abo.nom)}
                  disabled={actionLoading !== null}
                >
                  {actionLoading === `dl-${abo.id}` ? '...' : 'Télécharger la lettre (uniquement)'}
                </button>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}

export default AbonnementList;
