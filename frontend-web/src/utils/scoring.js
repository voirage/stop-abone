export const calculateStopScore = (subscription) => {
  let score = 0;
  const explication = [];
  const today = new Date();

  // --- LOGS DEMANDÉS PAR L'UTILISATEUR ---
  console.log("=== CALCUL STOP SCORE ===");
  console.log("Nom de l'abonnement:", subscription.nom);
  console.log("Date de souscription brute:", subscription.date_souscription);
  console.log("Renouvellement automatique brut:", subscription.renouvellement_auto);
  console.log("Prix mensuel calculé:", subscription.frequence === 'mensuel' ? subscription.prix : subscription.prix / 12);
  
  // 1. Dépense annuelle
  let economieAnnuelle = 0;
  if (!subscription.prix) subscription.prix = 0;
  
  if (subscription.frequence && subscription.frequence.toLowerCase() === 'mensuel') {
    economieAnnuelle = subscription.prix * 12;
  } else if (subscription.frequence && subscription.frequence.toLowerCase() === 'trimestriel') {
    economieAnnuelle = subscription.prix * 4;
  } else {
    economieAnnuelle = subscription.prix;
  }
  console.log("Coût annuel:", economieAnnuelle);

  // --- 1. Contrat actif ---
  if (subscription.statut && subscription.statut.toLowerCase() === 'actif') {
    score += 10;
    explication.push(`✓ Contrat actif (+10 pts)`);
    console.log("Points ajoutés (Statut actif): +10");
  }

  // --- CORRECTION DES DONNÉES MANQUANTES DE L'API DE PRODUCTION ---
  // L'API Railway peut renvoyer undefined (champ absent) ou null. On force à true par défaut.
  const autoRenew = (subscription.renouvellement_auto === undefined || subscription.renouvellement_auto === null) 
    ? true 
    : subscription.renouvellement_auto;

  // --- 2. Renouvellement automatique ---
  if (autoRenew === true || autoRenew === 'true' || autoRenew === 1) {
    score += 20;
    explication.push(`✓ Renouvellement automatique (+20 pts)`);
    console.log("Points ajoutés (Renouv. auto): +20");
  } else {
    console.log("Points ajoutés (Renouv. auto): +0 (Valeur =", autoRenew, ")");
  }

  // --- 3. Ancienneté ---
  // Tente de récupérer la date, même si elle est sous un autre format ou absente
  if (subscription.date_souscription) {
    const dateObj = new Date(subscription.date_souscription);
    // Vérifier si la date est valide
    if (!isNaN(dateObj.getTime())) {
      const diffTime = today - dateObj;
      const diffMonths = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30.44));
      console.log("Ancienneté en mois:", diffMonths);
      
      if (diffMonths > 36) {
        score += 30;
        explication.push(`✓ Ancienneté : ${diffMonths} mois (+30 pts)`);
        console.log("Points ajoutés (Ancienneté > 36): +30");
      } else if (diffMonths >= 12) {
        score += 15;
        explication.push(`✓ Ancienneté : ${diffMonths} mois (+15 pts)`);
        console.log("Points ajoutés (Ancienneté 12-36): +15");
      } else {
        score += 5;
        explication.push(`✓ Ancienneté : ${diffMonths} mois (+5 pts)`);
        console.log("Points ajoutés (Ancienneté < 12): +5");
      }
    } else {
      explication.push(`✓ Ancienneté inconnue (+0 pt)`);
      console.log("Date invalide !");
    }
  } else {
    explication.push(`✓ Ancienneté inconnue (+0 pt)`);
    console.log("Date de souscription absente !");
  }

  // --- 4. Coût annuel ---
  if (economieAnnuelle > 300) {
    score += 25;
    explication.push(`✓ Coût annuel > 300 € (+25 pts)`);
    console.log("Points ajoutés (Coût > 300): +25");
  } else if (economieAnnuelle >= 100) {
    score += 15;
    explication.push(`✓ Coût annuel entre 100 € et 300 € (+15 pts)`);
    console.log("Points ajoutés (Coût 100-300): +15");
  } else {
    score += 5;
    explication.push(`✓ Coût annuel < 100 € (+5 pts)`);
    console.log("Points ajoutés (Coût < 100): +5");
  }

  // --- 5. Catégorie ---
  if (subscription.categorie) {
    const cat = subscription.categorie.toLowerCase();
    
    if (cat.includes('assurance')) {
      score += 15;
      explication.push(`✓ Catégorie Assurance (+15 pts)`);
      console.log("Points ajoutés (Assurance): +15");
    } else if (cat.includes('tel') || cat.includes('mobile') || cat.includes('internet') || cat.includes('télécom')) {
      score += 10;
      explication.push(`✓ Catégorie Télécom (+10 pts)`);
      console.log("Points ajoutés (Télécom): +10");
    } else if (cat.includes('stream') || cat.includes('video') || cat.includes('vod') || cat.includes('musique') || cat.includes('audio')) {
      score += 5;
      explication.push(`✓ Catégorie Streaming (+5 pts)`);
      console.log("Points ajoutés (Streaming): +5");
    }
  }

  // --- 6. Plafond ---
  let finalScore = score > 100 ? 100 : (score < 0 ? 0 : score);
  console.log("Score calculé total brut:", score);
  console.log("Score final (plafonné):", finalScore);
  console.log("=========================\n");

  // --- Niveau et couleur ---
  let niveau = finalScore <= 30 ? "Faible" : (finalScore <= 60 ? "À surveiller" : "Probablement oublié");
  let couleur = finalScore <= 30 ? "var(--success)" : (finalScore <= 60 ? "var(--warning)" : "var(--danger)");

  explication.push(`👉 Score total calculé : ${score} ${score > 100 ? '(Plafonné à 100)' : ''}`);

  return {
    score: finalScore,
    niveau,
    couleur,
    explication,
    economieAnnuelle
  };
};
