import sys
import json
from datetime import date, timedelta
import logging

logging.basicConfig(level=logging.INFO)

sys.path.append('./backend')
import models
import scoring
import schemas
from database import SessionLocal, engine

# Create tables
models.Base.metadata.create_all(bind=engine)
db = SessionLocal()

# Clear existing test data
db.query(models.Abonnement).delete()
db.query(models.Utilisateur).delete()
db.commit()

# Insert user
user = models.Utilisateur(email="test@test.com", mot_de_passe_hache="hashed")
db.add(user)
db.commit()
db.refresh(user)

# Insert Amazon Prime subscription
date_souscription = date.today() - timedelta(days=1500)
prochaine_date = date.today() + timedelta(days=30)
abo = models.Abonnement(
    nom='Amazon Prime', 
    categorie='Streaming', 
    prix=69.90, 
    frequence=models.FrequenceAbonnement.ANNUEL, 
    prochaine_date_renouvellement=prochaine_date, 
    statut=models.StatutAbonnement.ACTIF, 
    date_souscription=date_souscription, 
    renouvellement_auto=True, 
    proprietaire_id=user.id
)
db.add(abo)
db.commit()
db.refresh(abo)

# Apply scoring logic just like backend main.py does
score_data = scoring.calculate_stop_score(abo)
for key, value in score_data.items():
    setattr(abo, key, value)

# Serialize with schema just like FastAPI does
api_response = schemas.Abonnement.from_orm(abo).dict()

print("=== REPONSE JSON EXACTE POUR AMAZON PRIME ===")
print(json.dumps(api_response, indent=2, ensure_ascii=False))
