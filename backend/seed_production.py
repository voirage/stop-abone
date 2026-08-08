import os
import sys
from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models
from datetime import date, timedelta

# S'assurer que les tables existent
models.Base.metadata.create_all(bind=engine)

def seed_db(email: str):
    db: Session = SessionLocal()
    try:
        # Trouver l'utilisateur
        if email:
            utilisateur = db.query(models.Utilisateur).filter(models.Utilisateur.email == email.strip().lower()).first()
        else:
            utilisateur = db.query(models.Utilisateur).first()
            
        if not utilisateur:
            print(f"Erreur : Aucun utilisateur trouvé{f' avec email {email}' if email else ' dans la base de données'}.")
            print("Veuillez d'abord créer un utilisateur via l'application ou l'API d'inscription.")
            return

        print(f"Utilisateur cible : {utilisateur.email} (ID: {utilisateur.id})")

        # Dates pour les données de test
        aujourd_hui = date.today()
        prochain_mois = aujourd_hui + timedelta(days=30)
        
        # Définition des abonnements
        abos = [
            models.Abonnement(
                nom="Canal+ Ciné Séries",
                categorie="Streaming",
                prix=39.99,
                frequence=models.FrequenceAbonnement.MENSUEL,
                prochaine_date_renouvellement=prochain_mois,
                statut=models.StatutAbonnement.ACTIF,
                date_souscription=date(2022, 2, 1),
                renouvellement_auto=True,
                proprietaire_id=utilisateur.id
            ),
            models.Abonnement(
                nom="Netflix Premium",
                categorie="Streaming",
                prix=19.99,
                frequence=models.FrequenceAbonnement.MENSUEL,
                prochaine_date_renouvellement=prochain_mois,
                statut=models.StatutAbonnement.ACTIF,
                date_souscription=date(2023, 1, 15),
                renouvellement_auto=True,
                proprietaire_id=utilisateur.id
            ),
            models.Abonnement(
                nom="Spotify Premium",
                categorie="Musique",
                prix=10.99,
                frequence=models.FrequenceAbonnement.MENSUEL,
                prochaine_date_renouvellement=prochain_mois,
                statut=models.StatutAbonnement.ACTIF,
                date_souscription=date(2021, 6, 10),
                renouvellement_auto=True,
                proprietaire_id=utilisateur.id
            )
        ]
        
        # Ajout à la base de données de manière idempotente
        nouveaux_ajouts = 0
        for abo in abos:
            existe = db.query(models.Abonnement).filter(
                models.Abonnement.nom == abo.nom,
                models.Abonnement.proprietaire_id == utilisateur.id
            ).first()
            
            if not existe:
                db.add(abo)
                nouveaux_ajouts += 1
            else:
                print(f"    -> Ignoré : L'abonnement '{abo.nom}' existe déjà.")
                
        db.commit()
        print(f"✅ SUCCESS : Seed terminé. {nouveaux_ajouts} abonnement(s) ajouté(s).")
        
    except Exception as e:
        print(f"❌ Erreur lors du seed : {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("=== DÉMARRAGE DU SEED DE PRODUCTION ===")
    email_arg = sys.argv[1] if len(sys.argv) > 1 else os.getenv("SEED_EMAIL")

    if not email_arg:
        print("❌ Erreur : Aucune adresse e-mail fournie.")
        print("Veuillez fournir l'email en argument ou via la variable d'environnement SEED_EMAIL.")
        sys.exit(1)

    seed_db(email_arg)
