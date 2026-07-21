from datetime import date
import math

def calculate_stop_score(subscription):
    type_recurrent = getattr(subscription, 'type_recurrent', 'subscription')
    if type_recurrent == 'non_subscription':
        return {
            "score": 0,
            "niveau": "Exclu",
            "couleur": "var(--text-muted)",
            "explication": ["Ce paiement a été classé comme dépense courante (non résiliable).", "💡 Aucune action requise."],
            "action": "Ignorer",
            "economieAnnuelle": 0.0,
            "urgence": False
        }

    score = 0
    today = date.today()
    
    # 1. Dépense annuelle
    economie_annuelle = 0.0
    prix = float(subscription.prix) if subscription.prix else 0.0
    frequence = str(subscription.frequence.value if hasattr(subscription.frequence, 'value') else subscription.frequence).lower()
    
    if frequence == 'mensuel':
        economie_annuelle = prix * 12
    elif frequence == 'trimestriel':
        economie_annuelle = prix * 4
    else:
        economie_annuelle = prix

    raisons = []

    # 2. Ancienneté (Facteur structurel principal)
    diff_months = 0
    if subscription.date_souscription:
        diff_days = (today - subscription.date_souscription).days
        diff_months = math.floor(diff_days / 30.44)
        
        if diff_months >= 36:
            score += 50
            raisons.append(f"il est actif depuis 3 ans ou plus ({diff_months} mois)")
        elif diff_months >= 24:
            score += 35
            raisons.append(f"il est actif depuis plus de 2 ans ({diff_months} mois)")
        elif diff_months >= 12:
            score += 20
            raisons.append("il est actif depuis plus d'un an")
        else:
            score += 10
            raisons.append("il a été souscrit récemment")
    else:
        score += 10
        raisons.append("il a été souscrit récemment")

    # 3. Renouvellement automatique
    auto_renew = subscription.renouvellement_auto
    if auto_renew is None:
        auto_renew = True
        
    if auto_renew in (True, 'true', 1):
        score += 20
        raisons.append("se renouvelle automatiquement")

    # 4. Fréquence de paiement
    # Retiré : double emploi avec coût annuel + renouvellement automatique

    # 5. Coût financier
    if economie_annuelle >= 300:
        score += 10
        raisons.append(f"représente un budget important de {economie_annuelle:.2f} € par an")
    else:
        score += 5

    # 6. Catégorie neutre (0 point)
    # Aucune discrimination artificielle par catégorie

    # Garde-fou structurel : si < 12 mois, score plafonné à 60
    if diff_months < 12 and score > 60:
        score = 60
        raisons.append("son niveau est plafonné car il a moins d'un an")

    # 7. Proximité du renouvellement (Gère l'urgence, hors score principal)
    urgence = False
    if subscription.prochaine_date_renouvellement:
        diff_prox = (subscription.prochaine_date_renouvellement - today).days
        if 0 <= diff_prox <= 15:
            urgence = True
            raisons.append(f"le prochain prélèvement est imminent (dans {diff_prox} jours)")

    # Calcul final du score
    final_score = 100 if score > 100 else (0 if score < 0 else score)

    # Classification, action et explication
    if type_recurrent == 'recurring_contract':
        niveau = "Contrat à surveiller"
        couleur = "var(--warning)"
        action = "Vérifier le montant"
        economie_annuelle = 0.0 # Ne pas afficher d'économie fictive
    elif final_score <= 35:
        niveau = "Faible priorité"
        couleur = "var(--success)"
        action = "Continuer"
    elif final_score < 65:
        niveau = "À examiner"
        couleur = "var(--warning)"
        action = "Vérifier son utilité"
    else:
        niveau = "Priorité élevée"
        couleur = "var(--danger)"
        action = "Réexaminer d'urgence"

    # Formatage de la phrase finale
    phrase = f"Cette dépense obtient une priorité de {final_score}/100. "
    if raisons:
        if len(raisons) == 1:
            phrase += f"Il a été classé '{niveau}' car {raisons[0]}."
        else:
            dernier = raisons.pop()
            phrase += f"Il a été classé '{niveau}' car {', '.join(raisons)} et {dernier}."
    else:
        phrase += f"Il a été classé '{niveau}'."
        
    explication = [phrase, f"💡 Action recommandée : {action}"]

    return {
        "score": final_score,
        "niveau": niveau,
        "couleur": couleur,
        "explication": explication,
        "action": action,
        "economieAnnuelle": round(economie_annuelle, 2),
        "urgence": urgence
    }
