from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List
from datetime import timedelta, datetime
import random
import string
import logging

logger = logging.getLogger("uvicorn.error")

import models, schemas, auth, database
from pdf_generator import generer_lettre_resiliation

# Création des tables dans la base de données
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(
    title="API STOP-ABOS",
    description="API pour l'application de suivi et résiliation d'abonnements",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Routes d'Authentification ---

@app.post("/inscription", response_model=schemas.Utilisateur, status_code=status.HTTP_201_CREATED, tags=["Authentification"])
def creer_utilisateur(utilisateur: schemas.UtilisateurCreation, db: Session = Depends(database.get_db)):
    utilisateur_bd = auth.obtenir_utilisateur(db, email=utilisateur.email)
    if utilisateur_bd:
        raise HTTPException(status_code=400, detail="Cet email est déjà utilisé")
    
    mot_de_passe_hache = auth.obtenir_hachage_mot_de_passe(utilisateur.mot_de_passe)
    nouvel_utilisateur = models.Utilisateur(email=utilisateur.email, mot_de_passe_hache=mot_de_passe_hache)
    db.add(nouvel_utilisateur)
    db.commit()
    db.refresh(nouvel_utilisateur)
    return nouvel_utilisateur

@app.post("/token", response_model=schemas.Token, tags=["Authentification"])
def connexion_pour_token_acces(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    utilisateur = auth.obtenir_utilisateur(db, email=form_data.username)
    if not utilisateur or not auth.verifier_mot_de_passe(form_data.password, utilisateur.mot_de_passe_hache):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect",
            headers={"WWW-Authenticate": "Bearer"},
        )
    expiration_token = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    token_acces = auth.creer_token_acces(
        donnees={"sub": utilisateur.email}, expires_delta=expiration_token
    )
    return {"access_token": token_acces, "token_type": "bearer"}


@app.post("/auth/forgot-password", response_model=schemas.ForgotPasswordResponse, tags=["Authentification"])
def forgot_password(req: schemas.ForgotPasswordRequest, db: Session = Depends(database.get_db)):
    email_norm = req.email.strip().lower()
    user = db.query(models.Utilisateur).filter(models.Utilisateur.email == email_norm).first()
    
    # Generate 6 digit code
    code = ''.join(random.choices(string.digits, k=6))
    
    if user:
        user.reset_code = code
        user.reset_expiry = datetime.utcnow() + timedelta(minutes=15)
        db.commit()
    
    # In real life, we send an email here.
    # For MVP, we return it in the response to make it testable on frontend.
    return {
        "msg": "Si l'email existe, un code a été généré.",
        "reset_code": code,
        "expires_in_minutes": 15
    }

@app.post("/auth/reset-password", tags=["Authentification"])
def reset_password(req: schemas.ResetPasswordRequest, db: Session = Depends(database.get_db)):
    email_norm = req.email.strip().lower()
    
    stmt = db.query(models.Utilisateur).filter(models.Utilisateur.email == email_norm)
    logger.warning(f"SQL requête: {str(stmt)}")
    
    utilisateurs_trouves = stmt.all()
    logger.warning(f"Nombre d'utilisateurs trouvés: {len(utilisateurs_trouves)}")
    
    user = utilisateurs_trouves[0] if utilisateurs_trouves else None
    
    logger.warning("=== DEBUG RESET PASSWORD ===")
    logger.warning(f"email recherché: {email_norm}")
    logger.warning(f"code reçu: {req.code!r}")
    
    if user:
        logger.warning(f"user trouvé: True, ID: {user.id}")
        logger.warning(f"code base: {user.reset_code!r}")
        logger.warning(f"expiry base: {user.reset_expiry!r}")
    logger.warning(f"utcnow: {datetime.utcnow()!r}")

    if not user:
        raise HTTPException(status_code=400, detail="Code invalide ou expiré")
        
    db_code = str(user.reset_code).strip() if user.reset_code else ""
    req_code = str(req.code).strip()
    
    if db_code != req_code:
        logger.warning("Échec: les codes ne correspondent pas")
        raise HTTPException(status_code=400, detail="Code invalide ou expiré")
        
    if not user.reset_expiry or user.reset_expiry < datetime.utcnow():
        logger.warning("Échec: le code est expiré")
        raise HTTPException(status_code=400, detail="Code invalide ou expiré")
    
    user.mot_de_passe_hache = auth.obtenir_hachage_mot_de_passe(req.nouveau_mot_de_passe)
    user.reset_code = None
    user.reset_expiry = None
    db.commit()
    
    return {"msg": "Mot de passe réinitialisé avec succès"}

# --- Routes Abonnements ---

@app.post("/abonnements", response_model=schemas.Abonnement, status_code=status.HTTP_201_CREATED, tags=["Abonnements"])
def ajouter_abonnement(
    abonnement: schemas.AbonnementCreation, 
    db: Session = Depends(database.get_db),
    utilisateur_actuel: models.Utilisateur = Depends(auth.obtenir_utilisateur_actuel)
):
    nouvel_abonnement = models.Abonnement(**abonnement.dict(), proprietaire_id=utilisateur_actuel.id)
    db.add(nouvel_abonnement)
    db.commit()
    db.refresh(nouvel_abonnement)
    return nouvel_abonnement

@app.get("/abonnements", response_model=List[schemas.Abonnement], tags=["Abonnements"])
def lister_abonnements(
    db: Session = Depends(database.get_db),
    utilisateur_actuel: models.Utilisateur = Depends(auth.obtenir_utilisateur_actuel)
):
    abonnements = db.query(models.Abonnement).filter(models.Abonnement.proprietaire_id == utilisateur_actuel.id).all()
    return abonnements

@app.get("/abonnements/resume", response_model=schemas.ResumeAbonnements, tags=["Abonnements"])
def obtenir_resume_abonnements(
    db: Session = Depends(database.get_db),
    utilisateur_actuel: models.Utilisateur = Depends(auth.obtenir_utilisateur_actuel)
):
    abonnements = db.query(models.Abonnement).filter(models.Abonnement.proprietaire_id == utilisateur_actuel.id).all()
    
    total_mensuel = 0.0
    total_annuel = 0.0
    
    for abonnement in abonnements:
        if abonnement.statut != models.StatutAbonnement.RESILIE:
            if abonnement.frequence == models.FrequenceAbonnement.MENSUEL:
                total_mensuel += abonnement.prix
                total_annuel += abonnement.prix * 12
            elif abonnement.frequence == models.FrequenceAbonnement.ANNUEL:
                total_mensuel += abonnement.prix / 12
                total_annuel += abonnement.prix

    return {"total_mensuel": round(total_mensuel, 2), "total_annuel": round(total_annuel, 2)}

@app.put("/abonnements/{abonnement_id}", response_model=schemas.Abonnement, tags=["Abonnements"])
def modifier_abonnement(
    abonnement_id: int, 
    mise_a_jour: schemas.AbonnementMiseAJour,
    db: Session = Depends(database.get_db),
    utilisateur_actuel: models.Utilisateur = Depends(auth.obtenir_utilisateur_actuel)
):
    abonnement_bd = db.query(models.Abonnement).filter(
        models.Abonnement.id == abonnement_id,
        models.Abonnement.proprietaire_id == utilisateur_actuel.id
    ).first()
    
    if not abonnement_bd:
        raise HTTPException(status_code=404, detail="Abonnement non trouvé")
        
    donnees_mise_a_jour = mise_a_jour.dict(exclude_unset=True)
    for cle, valeur in donnees_mise_a_jour.items():
        setattr(abonnement_bd, cle, valeur)
        
    db.commit()
    db.refresh(abonnement_bd)
    return abonnement_bd

@app.delete("/abonnements/{abonnement_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Abonnements"])
def supprimer_abonnement(
    abonnement_id: int, 
    db: Session = Depends(database.get_db),
    utilisateur_actuel: models.Utilisateur = Depends(auth.obtenir_utilisateur_actuel)
):
    abonnement_bd = db.query(models.Abonnement).filter(
        models.Abonnement.id == abonnement_id,
        models.Abonnement.proprietaire_id == utilisateur_actuel.id
    ).first()
    
    if not abonnement_bd:
        raise HTTPException(status_code=404, detail="Abonnement non trouvé")
        
    db.delete(abonnement_bd)
    db.commit()
    return

@app.get("/abonnements/{abonnement_id}/lettre-resiliation", tags=["Abonnements"])
def telecharger_lettre_resiliation(
    abonnement_id: int, 
    db: Session = Depends(database.get_db),
    utilisateur_actuel: models.Utilisateur = Depends(auth.obtenir_utilisateur_actuel)
):
    abonnement_bd = db.query(models.Abonnement).filter(
        models.Abonnement.id == abonnement_id,
        models.Abonnement.proprietaire_id == utilisateur_actuel.id
    ).first()
    
    if not abonnement_bd:
        raise HTTPException(status_code=404, detail="Abonnement non trouvé")
        
    date_str = abonnement_bd.prochaine_date_renouvellement.strftime("%d/%m/%Y")
    chemin_pdf = generer_lettre_resiliation(
        nom_service=abonnement_bd.nom, 
        numero_contrat=abonnement_bd.numero_contrat, 
        date_fin=date_str
    )
    
    return FileResponse(
        path=chemin_pdf, 
        filename=f"resiliation_{abonnement_bd.nom}.pdf", 
        media_type="application/pdf"
    )

