import sys
import os
from datetime import date, timedelta
from dotenv import load_dotenv

# Assurer que le chemin du backend est dans sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
import models
import auth

def seed_11_abonnements():
    db = SessionLocal()
    try:
        # 1. Vérifier si l'utilisateur existe
        email_cible = "jeanluc-final@gmail.com"
        utilisateur = db.query(models.Utilisateur).filter(models.Utilisateur.email == email_cible).first()
        
        if not utilisateur:
            print(f"ERREUR: Le compte {email_cible} n'existe pas encore en base de données.")
            print("Veuillez d'abord créer ce compte via l'application web.")
            return

        print(f"✅ Compte {email_cible} trouvé (ID: {utilisateur.id})")

        # 2. Définir les 11 abonnements
        aujourd_hui = date.today()
        prochain_mois = aujourd_hui + timedelta(days=30)
        date_debut = aujourd_hui - timedelta(days=1500) # Existant depuis longtemps
        
        # Les 11 abonnements
        abonnements_a_inserer = [
            {"nom": "Spotify Premium", "categorie": "Musique", "prix": 10.99, "frequence": models.FrequenceAbonnement.MENSUEL, "numero_contrat": "SPOTIFY-01"},
            {"nom": "Amazon Prime", "categorie": "Streaming", "prix": 6.99, "frequence": models.FrequenceAbonnement.MENSUEL, "numero_contrat": "PRIME-01"},
            {"nom": "Disney+", "categorie": "Streaming", "prix": 11.99, "frequence": models.FrequenceAbonnement.MENSUEL, "numero_contrat": "DISNEY-01"},
            {"nom": "Apple Music", "categorie": "Musique", "prix": 10.99, "frequence": models.FrequenceAbonnement.MENSUEL, "numero_contrat": "APPLE-01"},
            {"nom": "Netflix Standard", "categorie": "Streaming", "prix": 13.49, "frequence": models.FrequenceAbonnement.MENSUEL, "numero_contrat": "NETFLIX-01"},
            {"nom": "Canal+ Sport", "categorie": "Streaming", "prix": 34.99, "frequence": models.FrequenceAbonnement.MENSUEL, "numero_contrat": "CANAL-01"},
            {"nom": "Sosh Mobile", "categorie": "Téléphonie", "prix": 15.99, "frequence": models.FrequenceAbonnement.MENSUEL, "numero_contrat": "SOSH-01"},
            {"nom": "Freebox", "categorie": "Internet", "prix": 39.99, "frequence": models.FrequenceAbonnement.MENSUEL, "numero_contrat": "FREE-01"},
            {"nom": "Le Monde", "categorie": "Presse", "prix": 9.99, "frequence": models.FrequenceAbonnement.MENSUEL, "numero_contrat": "LEMONDE-01"},
            {"nom": "Basic-Fit", "categorie": "Sport", "prix": 19.99, "frequence": models.FrequenceAbonnement.MENSUEL, "numero_contrat": "BASICFIT-01"},
            {"nom": "PlayStation Plus", "categorie": "Gaming", "prix": 8.99, "frequence": models.FrequenceAbonnement.MENSUEL, "numero_contrat": "PSPLUS-01"}
        ]

        # 3. Insérer uniquement les données manquantes
        ajouts = 0
        for abo_data in abonnements_a_inserer:
            existe = db.query(models.Abonnement).filter(
                models.Abonnement.proprietaire_id == utilisateur.id,
                models.Abonnement.nom == abo_data["nom"]
            ).first()

            if not existe:
                nouveau_abo = models.Abonnement(
                    nom=abo_data["nom"],
                    categorie=abo_data["categorie"],
                    prix=abo_data["prix"],
                    frequence=abo_data["frequence"],
                    date_souscription=date_debut,
                    prochaine_date_renouvellement=prochain_mois,
                    numero_contrat=abo_data["numero_contrat"],
                    renouvellement_auto=True,
                    statut=models.StatutAbonnement.ACTIF,
                    proprietaire_id=utilisateur.id
                )
                db.add(nouveau_abo)
                ajouts += 1
                print(f"➕ Ajout de {abo_data['nom']}")
            else:
                print(f"⏩ {abo_data['nom']} existe déjà, ignoré.")
        
        db.commit()
        print(f"✅ Migration terminée avec succès : {ajouts} abonnements ajoutés. Aucun doublon.")

    except Exception as e:
        print(f"❌ Erreur lors de la migration : {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    load_dotenv()
    seed_11_abonnements()
