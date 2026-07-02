import os
import sys
from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models
from datetime import date, timedelta

# S'assurer que les tables existent
models.Base.metadata.create_all(bind=engine)

def seed_db(email: str = None):
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
        
        # Ajout à la base de données
        for abo in abos:
            db.add(abo)
            
        db.commit()
        print("✅ SUCCESS : Les 3 abonnements de test ont été ajoutés avec succès ! ")
        print("    -> Canal+ Ciné Séries (Score prévu ~90/100)")
        print("    -> Netflix Premium")
        print("    -> Spotify Premium")
        
    except Exception as e:
        print(f"❌ Erreur lors du seed : {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("=== DÉMARRAGE DU SEED DE PRODUCTION ===")
    email_arg = sys.argv[1] if len(sys.argv) > 1 else None
    seed_db(email_arg)
