from datetime import date
import math

def calculate_stop_score(subscription):
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

    # 2. Ancienneté
    if subscription.date_souscription:
        diff_days = (today - subscription.date_souscription).days
        diff_months = math.floor(diff_days / 30.44)
        
        if diff_months > 24:
            score += 25
            raisons.append(f"il est actif depuis plus de 2 ans ({diff_months} mois)")
        elif diff_months >= 12:
            score += 15
            raisons.append("il est actif depuis plus d'un an")
        else:
            score += 5
            raisons.append("il a été souscrit récemment")

    # 3. Renouvellement automatique
    auto_renew = subscription.renouvellement_auto
    if auto_renew is None:
        auto_renew = True
        
    if auto_renew in (True, 'true', 1):
        score += 20
        raisons.append("se renouvelle automatiquement")

    # 4. Fréquence de paiement (Risque de surprise)
    if frequence == 'annuel':
        score += 15
        raisons.append("sa facturation annuelle augmente le risque de prélèvement inattendu")
    elif frequence == 'trimestriel':
        score += 10
    else:
        score += 5 # mensuel

    # 5. Coût financier
    if economie_annuelle > 300:
        score += 20
        raisons.append(f"représente un coût très important de {economie_annuelle:.2f} € par an")
    elif economie_annuelle >= 100:
        score += 10
        raisons.append(f"représente un budget de {economie_annuelle:.2f} € par an")
    else:
        score += 5

    # 6. Catégorie et risque d'usage
    cat = (subscription.categorie or '').lower()
    if any(k in cat for k in ['assurance', 'sport', 'fitness', 'salle']):
        score += 15
        raisons.append("c'est un type de service (Assurance/Sport) statistiquement souvent payé à vide")
    elif any(k in cat for k in ['tel', 'mobile', 'internet', 'télécom', 'box']):
        score += 10
    elif any(k in cat for k in ['stream', 'video', 'vod', 'musique', 'audio']):
        score += 5
    else:
        score += 10 # Inconnu ou autre

    # 7. Proximité du renouvellement
    if subscription.prochaine_date_renouvellement:
        diff_days = (subscription.prochaine_date_renouvellement - today).days
        if 0 <= diff_days <= 15:
            score += 10
            raisons.append(f"son prochain prélèvement approche à grands pas (dans {diff_days} jours)")

    # Calcul final du score
    final_score = 100 if score > 100 else (0 if score < 0 else score)

    # Classification, action et explication
    if final_score <= 40:
        niveau = "Peu préoccupant"
        couleur = "var(--success)"
        action = "Continuer"
    elif final_score <= 70:
        niveau = "À surveiller"
        couleur = "var(--warning)"
        action = "Vérifier son utilisation"
    else:
        niveau = "Probablement oublié"
        couleur = "var(--danger)"
        action = "Résilier"

    # Formatage de la phrase finale
    phrase = f"Cet abonnement obtient un score de {final_score}/100. "
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
        "economieAnnuelle": round(economie_annuelle, 2)
    }
