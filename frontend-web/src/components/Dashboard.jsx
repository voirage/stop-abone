import React, { useState, useEffect, useCallback } from 'react';
import { getResume, getAbonnements, deleteAbonnement } from '../api';
import AbonnementForm from './AbonnementForm';
import AbonnementList from './AbonnementList';
import { calculateStopScore } from '../utils/scoring';

function Dashboard() {
  const [resume, setResume] = useState({ total_mensuel: 0, total_annuel: 0 });
  const [abonnements, setAbonnements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [economiesRealisees, setEconomiesRealisees] = useState(0);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [resumeData, abosData] = await Promise.all([
        getResume(),
        getAbonnements()
      ]);
      console.log("[TRACE 2] Valeur reçue dans Dashboard:", abosData);
      
      // Suppression des doublons
      const uniqueAbos = [];
      const seen = new Set();
      const duplicatesToDelete = [];
      
      abosData.forEach(abo => {
        const key = `${abo.nom}-${abo.prix}-${abo.frequence}`.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          uniqueAbos.push(abo);
        } else {
          duplicatesToDelete.push(abo.id);
        }
      });
      
      if (duplicatesToDelete.length > 0) {
        Promise.all(duplicatesToDelete.map(id => deleteAbonnement(id)))
          .catch(e => console.error("Erreur suppression doublons", e));
      }

      // Recalculer le résumé localement pour ignorer les doublons supprimés
      let calcMensuel = 0;
      let calcAnnuel = 0;
      uniqueAbos.forEach(abo => {
        if (abo.statut !== 'resilie') {
          if (abo.frequence.toLowerCase() === 'mensuel') {
            calcMensuel += abo.prix;
            calcAnnuel += abo.prix * 12;
          } else if (abo.frequence.toLowerCase() === 'trimestriel') {
            calcMensuel += abo.prix / 3;
            calcAnnuel += abo.prix * 4;
          } else {
            calcMensuel += abo.prix / 12;
            calcAnnuel += abo.prix;
          }
        }
      });
      setResume({ total_mensuel: calcMensuel, total_annuel: calcAnnuel });
      
      // Calcul du STOP SCORE en temps réel sur le frontend
      const enrichedAbos = uniqueAbos.map(abo => {
        console.log("[TRACE 3] Valeur juste avant l'appel à scoring.js:", abo);
        const scoring = calculateStopScore(abo);
        console.log("[TRACE 4] Valeur renvoyée par scoring.js:", scoring);
        return { ...abo, ...scoring };
      });
      console.log("[TRACE 4.5] Valeur finale avant setAbonnements:", enrichedAbos);
      setAbonnements(enrichedAbos);
      
      // Load saved economies from local storage
      const saved = localStorage.getItem('stopabos_economies_realisees');
      if (saved) {
        setEconomiesRealisees(parseFloat(saved));
      }
    } catch (err) {
      console.error("[REACT ERROR] Échec de loadData :", err);
      setError('Erreur lors du chargement des données.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Si on vient de supprimer un abonnement
  const handleAbonnementDeleted = (economieAnnuelle) => {
    if (economieAnnuelle && economieAnnuelle > 0) {
      const currentSaved = parseFloat(localStorage.getItem('stopabos_economies_realisees') || '0');
      const newTotal = currentSaved + economieAnnuelle;
      localStorage.setItem('stopabos_economies_realisees', newTotal.toString());
      setEconomiesRealisees(newTotal);
    }
    loadData();
  };

  if (loading && abonnements.length === 0) {
    return <div className="loading">Analyse de vos données financières en cours...</div>;
  }

  // --- CALCULS DU DASHBOARD (MOTEUR STOP SCORE FRONTEND) ---
  const abosOublies = abonnements.filter(abo => abo.score >= 61);
  const abosASurveiller = abonnements.filter(abo => abo.score >= 31 && abo.score <= 60);
  
  const abonnementPrioritaire = abonnements.length > 0 ? [...abonnements].sort((a, b) => b.score - a.score)[0] : null;

  const economiesPossibles = [...abosOublies, ...abosASurveiller].reduce((acc, abo) => acc + (abo.economieAnnuelle || 0), 0);

  const totalScore = abonnements.reduce((acc, abo) => acc + (abo.score || 0), 0);
  const moyenScore = abonnements.length > 0 ? Math.round(totalScore / abonnements.length) : 0;

  return (
    <div className="app-container animate-up">
      {error && <div className="error-msg">{error}</div>}
      
      {/* Header / Slogan */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>Analyse de vos abonnements</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto' }}>
          STOP-ABOS détecte les abonnements oubliés avant qu'ils ne vous coûtent des centaines d'euros.
        </p>
      </div>

      {/* Block Analyse STOP */}
      <h2 style={{ fontSize: '1.8rem', marginBottom: '20px', marginTop: '20px' }}>Analyse STOP</h2>
      <div className="dashboard-grid">
        <div className="metric-card" style={{ borderTop: '4px solid var(--danger)' }}>
          <div className="metric-title text-danger">Probablement oubliés</div>
          <div className="metric-value">{abosOublies.length}</div>
          <div style={{ marginTop: 'auto', paddingTop: '10px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Score &gt; 70</div>
        </div>

        <div className="metric-card" style={{ borderTop: '4px solid var(--warning)' }}>
          <div className="metric-title text-warning">À surveiller</div>
          <div className="metric-value">{abosASurveiller.length}</div>
          <div style={{ marginTop: 'auto', paddingTop: '10px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Score 41-70</div>
        </div>

        <div className="metric-card" style={{ backgroundColor: '#fff5f5', border: '1px solid #fed7d7' }}>
          <div className="metric-title" style={{ color: '#c53030' }}>Économie annuelle potentielle</div>
          <div className="metric-value" style={{ color: '#c53030' }}>{economiesPossibles.toFixed(2)} €<span style={{fontSize:'1rem'}}>/an</span></div>
        </div>

        <div className="metric-card" style={{ borderTop: '4px solid var(--accent-blue)' }}>
          <div className="metric-title">Priorité n°1 à vérifier</div>
          <div className="metric-value" style={{ fontSize: '1.2rem', marginTop: '10px' }}>
            {abonnementPrioritaire ? abonnementPrioritaire.nom : "Aucun"}
          </div>
          <div style={{ marginTop: 'auto', paddingTop: '10px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {abonnementPrioritaire ? `Score: ${abonnementPrioritaire.score} / 100` : "-"}
          </div>
        </div>
      </div>

      {/* Ajout du score moyen comme demandé */}
      <div className="dashboard-grid" style={{ marginTop: '20px' }}>
        <div className="metric-card" style={{ gridColumn: '1 / -1', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTop: '4px solid var(--accent-purple)' }}>
          <div>
            <div className="metric-title">STOP SCORE moyen</div>
            <div style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>
              Moyenne du risque sur l'ensemble de vos abonnements.
            </div>
          </div>
          <div className="score-circle" style={{ borderColor: 'var(--accent-purple)', color: 'var(--accent-purple)', margin: '0' }}>
            {moyenScore}
          </div>
        </div>
      </div>

      <div className="dashboard-grid" style={{ marginTop: '20px' }}>
         <div className="metric-card">
          <div className="metric-title">Dépense mensuelle totale</div>
          <div className="metric-value">{resume.total_mensuel.toFixed(2)} €</div>
        </div>

        <div className="metric-card">
          <div className="metric-title">Dépense annuelle totale</div>
          <div className="metric-value">{resume.total_annuel.toFixed(2)} €</div>
        </div>
        <div className="metric-card" style={{ backgroundColor: 'var(--success-light)', border: '1px solid #c6f6d5' }}>
          <div className="metric-title text-success">Économies réalisées depuis l'inscription</div>
          <div className="metric-value text-success">{economiesRealisees.toFixed(2)} €<span style={{fontSize:'1rem'}}>/an</span></div>
          <div style={{ marginTop: 'auto', paddingTop: '10px', fontSize: '0.85rem', color: 'var(--success)' }}>Bravo pour votre gestion ! 🏆</div>
        </div>
      </div>

      {/* Vos priorités aujourd'hui */}
      <div style={{ marginTop: '50px', backgroundColor: '#fff', padding: '30px', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
        <h2 style={{ fontSize: '1.8rem', marginBottom: '20px' }}>Vos priorités aujourd'hui</h2>
        {abonnements.length === 0 ? (
          <p>Aucune donnée disponible.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {[...abonnements].sort((a, b) => b.score - a.score).slice(0, 3).map(abo => {
              let icon = '🟢';
              if (abo.score >= 61) icon = '🔴';
              else if (abo.score >= 31) icon = '🟠';

              return (
                <div key={abo.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '15px', border: '1px solid var(--border-color)', borderRadius: '8px', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                    {icon} Vérifier {abo.nom}
                  </div>
                  <div style={{ color: 'var(--text-muted)' }}>
                    {abo.economieAnnuelle.toFixed(2)} €/an potentiellement économisés
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ marginBottom: '40px', textAlign: 'center' }}>
        <button 
          className="btn btn-outline"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? 'Fermer le formulaire' : '+ Ajouter manuellement un abonnement'}
        </button>
      </div>

      {showAddForm && (
        <div className="animate-up" style={{ marginBottom: '40px' }}>
          <AbonnementForm onAbonnementAdded={loadData} />
        </div>
      )}
      
      {/* Liste Intelligente des abonnements */}
      <AbonnementList 
        abonnements={abonnements} 
        loading={loading}
        onAbonnementDeleted={handleAbonnementDeleted} 
      />
    </div>
  );
}

export default Dashboard;
