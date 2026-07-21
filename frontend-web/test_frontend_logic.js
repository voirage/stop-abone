const abos = [
  { nom: 'Fitness Park', score: 65, type_recurrent: 'subscription', niveau: 'A surveiller' },
  { nom: 'EDF Clients', score: 60, type_recurrent: 'recurring_contract', niveau: 'Contrat à surveiller' },
  { nom: 'Orange Mobile', score: 60, type_recurrent: 'subscription', niveau: 'A surveiller' },
  { nom: 'Canal Plus', score: 55, type_recurrent: 'subscription', niveau: 'A surveiller' },
  { nom: 'Adobe Systems', score: 50, type_recurrent: 'subscription', niveau: 'A surveiller' },
  { nom: 'Netflix', score: 45, type_recurrent: 'subscription', niveau: 'A surveiller' },
  { nom: 'Spotify France', score: 45, type_recurrent: 'subscription', niveau: 'A surveiller' },
  { nom: 'Restaurant Le Jardin', score: 0, type_recurrent: 'non_subscription', niveau: 'Exclu' },
  { nom: 'TotalEnergies', score: 0, type_recurrent: 'non_subscription', niveau: 'Exclu' },
  { nom: 'Test 35', score: 35, type_recurrent: 'subscription', niveau: 'Faible priorité' },
  { nom: 'Test 36', score: 36, type_recurrent: 'subscription', niveau: 'Faible priorité' },
  { nom: 'Test 64', score: 64, type_recurrent: 'subscription', niveau: 'A surveiller' },
  { nom: 'Test 65', score: 65, type_recurrent: 'subscription', niveau: 'A surveiller' }
];

const processedAbos = abos.map(abo => {
  let niveau = abo.niveau;
  let couleur = "var(--text-muted)";
  
  if (abo.type_recurrent === 'non_subscription' || abo.score === 0 || abo.niveau === 'Exclu') {
    niveau = "Exclu";
    couleur = "var(--text-muted)";
  } else if (abo.score >= 65) {
    niveau = "Priorité élevée";
    couleur = "var(--danger)";
  } else if (abo.score >= 36) {
    niveau = "À examiner";
    couleur = "var(--warning)";
  } else {
    niveau = "Faible priorité";
    couleur = "var(--success)";
  }
  
  return { ...abo, niveau, couleur };
});

processedAbos.forEach(a => console.log(a.nom.padEnd(20) + " -> " + a.niveau));
