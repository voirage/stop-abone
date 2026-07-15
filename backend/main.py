from fastapi import FastAPI, Depends, HTTPException, status, Security, Request
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List, Annotated
from datetime import timedelta, datetime
import random
import string
import logging
import secrets
import hashlib
import re

logger = logging.getLogger("uvicorn.error")

import models, schemas, auth, database
from pdf_generator import generer_lettre_resiliation
import scoring
from email_service import send_reset_password_email

# Création des tables dans la base de données
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(
    title="API STOP-ABOS",
    description="API pour l'application de suivi et résiliation d'abonnements",
    version="1.0.0",
    servers=[{"url": "/"}]
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Routes d'Authentification ---

@app.post("/inscription", response_model=schemas.Utilisateur, status_code=status.HTTP_201_CREATED, tags=["Authentification"])
def creer_utilisateur(utilisateur: schemas.UtilisateurCreation, db: Session = Depends(database.get_db)):
    email_norm = utilisateur.email.strip().lower()
    utilisateur_bd = auth.obtenir_utilisateur(db, email=email_norm)
    if utilisateur_bd:
        raise HTTPException(status_code=400, detail="Cet email est déjà utilisé")
    
    try:
        mot_de_passe_hache = auth.obtenir_hachage_mot_de_passe(utilisateur.mot_de_passe)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
        
    nouvel_utilisateur = models.Utilisateur(email=email_norm, mot_de_passe_hache=mot_de_passe_hache)
    db.add(nouvel_utilisateur)
    db.commit()
    db.refresh(nouvel_utilisateur)
    return nouvel_utilisateur

@app.get("/debug-production", tags=["Authentification"])
def debug_production(email: str = None, db: Session = Depends(database.get_db)):
    query = db.query(models.Utilisateur)
    if email:
        query = query.filter(models.Utilisateur.email == email.strip().lower())
        
    utilisateurs = query.all()
    result = []
    for u in utilisateurs:
        algo = "inconnu"
        if u.mot_de_passe_hache:
            if u.mot_de_passe_hache.startswith("$2b$"):
                algo = "bcrypt"
            elif u.mot_de_passe_hache.startswith("$pbkdf2"):
                algo = "pbkdf2_sha256"
                
        result.append({
            "id": u.id,
            "email": u.email,
            "algo_hash": algo,
            "hash_prefix": u.mot_de_passe_hache[:15] + "..." if u.mot_de_passe_hache else "aucun"
        })
    return {"utilisateurs_trouves": len(result), "utilisateurs": result}

@app.post("/token", response_model=schemas.Token, tags=["Authentification"])
def connexion_pour_token_acces(form_data: Annotated[OAuth2PasswordRequestForm, Depends()], db: Session = Depends(database.get_db)):
    email_norm = form_data.username.strip().lower()
    logger.warning("=== DIAGNOSTIC LOGIN ===")
    logger.warning(f"Tentative de connexion pour : '{email_norm}' (brut: '{form_data.username}')")
    
    utilisateur = auth.obtenir_utilisateur(db, email=email_norm)
    if not utilisateur:
        logger.warning(f"ECHEC : L'utilisateur '{email_norm}' N'EXISTE PAS en base de donnees.")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    logger.warning(f"SUCCES : L'utilisateur a ete trouve. ID = {utilisateur.id}")
    
    mot_de_passe_valide = auth.verifier_mot_de_passe(form_data.password, utilisateur.mot_de_passe_hache)
    if not mot_de_passe_valide:
        logger.warning(f"ECHEC : Le mot de passe fourni pour '{email_norm}' ne correspond pas au hash en base.")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    logger.warning("SUCCES : Mot de passe valide. Generation du JWT...")
    expiration_token = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    token_acces = auth.creer_token_acces(
        donnees={"sub": utilisateur.email}, expires_delta=expiration_token
    )
    return {"access_token": token_acces, "token_type": "Bearer"}


@app.post("/auth/forgot-password", response_model=schemas.ForgotPasswordResponse, tags=["Authentification"])
def forgot_password(req: schemas.ForgotPasswordRequest, request: Request, db: Session = Depends(database.get_db)):
    email_norm = req.email.strip().lower()
    client_ip = request.client.host if request.client else "unknown"
    
    # Generic response
    generic_msg = "Si un compte correspond à cette adresse, un email de réinitialisation a été envoyé."
    
    # Rate limit check
    time_threshold = datetime.utcnow() - timedelta(minutes=15)
    
    ip_requests = db.query(models.RateLimit).filter(
        models.RateLimit.ip_address == client_ip,
        models.RateLimit.endpoint == "forgot_password",
        models.RateLimit.created_at >= time_threshold
    ).count()
    
    if ip_requests >= 5:
        return {"msg": generic_msg}
        
    email_requests = db.query(models.RateLimit).filter(
        models.RateLimit.email == email_norm,
        models.RateLimit.endpoint == "forgot_password",
        models.RateLimit.created_at >= time_threshold
    ).count()
    
    if email_requests >= 3:
        return {"msg": generic_msg}
        
    # Record request
    new_limit = models.RateLimit(ip_address=client_ip, email=email_norm, endpoint="forgot_password")
    db.add(new_limit)
    db.commit()
    
    user = db.query(models.Utilisateur).filter(models.Utilisateur.email == email_norm).first()
    
    if user:
        # Invalidate old tokens
        db.query(models.PasswordResetToken).filter(
            models.PasswordResetToken.user_id == user.id,
            models.PasswordResetToken.used_at == None
        ).update({"used_at": datetime.utcnow()})
        
        # Generate new token
        raw_token = secrets.token_urlsafe(32)
        token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
        
        reset_token = models.PasswordResetToken(
            user_id=user.id,
            token_hash=token_hash,
            expires_at=datetime.utcnow() + timedelta(minutes=30),
            request_ip=client_ip
        )
        db.add(reset_token)
        db.commit()
        
        # Send email
        send_reset_password_email(user.email, raw_token)
    else:
        # Dummy hash calculation to mitigate timing attacks
        _ = hashlib.sha256(secrets.token_urlsafe(32).encode()).hexdigest()
        
    return {"msg": generic_msg}

@app.post("/auth/reset-password", tags=["Authentification"])
def reset_password(req: schemas.ResetPasswordRequest, db: Session = Depends(database.get_db)):
    if req.new_password != req.confirm_password:
        raise HTTPException(status_code=400, detail="Les mots de passe ne correspondent pas.")
        
    # Check password complexity
    if len(req.new_password) < 8 or \
       not re.search(r"[A-Z]", req.new_password) or \
       not re.search(r"[a-z]", req.new_password) or \
       not re.search(r"[0-9]", req.new_password):
        raise HTTPException(status_code=400, detail="Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre.")
        
    token_hash = hashlib.sha256(req.token.encode()).hexdigest()
    
    reset_token = db.query(models.PasswordResetToken).filter(
        models.PasswordResetToken.token_hash == token_hash,
        models.PasswordResetToken.used_at == None,
        models.PasswordResetToken.expires_at > datetime.utcnow()
    ).first()
    
    if not reset_token:
        raise HTTPException(status_code=400, detail="Jeton invalide ou expiré.")
        
    user = db.query(models.Utilisateur).filter(models.Utilisateur.id == reset_token.user_id).first()
    if not user:
        raise HTTPException(status_code=400, detail="Utilisateur introuvable.")
        
    # Check if new password is the same as the old one
    if auth.verifier_mot_de_passe(req.new_password, user.mot_de_passe_hache):
        raise HTTPException(status_code=400, detail="Le nouveau mot de passe doit être différent de l'ancien.")
        
    # Update password
    user.mot_de_passe_hache = auth.obtenir_hachage_mot_de_passe(req.new_password)
    reset_token.used_at = datetime.utcnow()
    db.commit()
    
    return {"msg": "Mot de passe réinitialisé avec succès."}

# --- Routes d'Import CSV ---
from fastapi import UploadFile, File
import csv_import

@app.post("/imports/csv/analyser", response_model=List[schemas.CandidatAbonnement], tags=["Imports"], dependencies=[Depends(auth.get_current_user)])
async def analyser_csv(
    file: UploadFile = File(...),
    db: Session = Depends(database.get_db),
    utilisateur_actuel: models.Utilisateur = Depends(auth.get_current_user)
):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Le fichier doit être au format CSV.")
    
    # Limite simple de taille de fichier pour le MVP
    content = await file.read()
    if len(content) > 2 * 1024 * 1024: # 2MB
        raise HTTPException(status_code=400, detail="Fichier trop volumineux (max 2 Mo).")
        
    candidats = csv_import.analyze_csv(content)
    return candidats

# --- Routes Abonnements ---

@app.post("/abonnements", response_model=schemas.Abonnement, status_code=status.HTTP_201_CREATED, tags=["Abonnements"], dependencies=[Depends(auth.get_current_user)])
def ajouter_abonnement(
    abonnement: schemas.AbonnementCreation, 
    db: Session = Depends(database.get_db),
    utilisateur_actuel: models.Utilisateur = Depends(auth.get_current_user)
):
    nouvel_abonnement = models.Abonnement(**abonnement.dict(), proprietaire_id=utilisateur_actuel.id)
    db.add(nouvel_abonnement)
    db.commit()
    db.refresh(nouvel_abonnement)
    
    # Calculate score
    score_data = scoring.calculate_stop_score(nouvel_abonnement)
    for key, value in score_data.items():
        setattr(nouvel_abonnement, key, value)
        
    return nouvel_abonnement

@app.get("/abonnements", response_model=List[schemas.Abonnement], tags=["Abonnements"], dependencies=[Depends(auth.get_current_user)])
def lister_abonnements(
    db: Session = Depends(database.get_db),
    utilisateur_actuel: models.Utilisateur = Depends(auth.get_current_user)
):
    logger.warning(f"=== [DEBUG BACKEND] GET /abonnements ===")
    logger.warning(f"Chemin de la base utilisée: {db.get_bind().url}")
    logger.warning(f"Email utilisateur connecté: {utilisateur_actuel.email}")
    logger.warning(f"ID utilisateur: {utilisateur_actuel.id}")
    
    try:
        abonnements = db.query(models.Abonnement).filter(models.Abonnement.proprietaire_id == utilisateur_actuel.id).all()
        logger.warning(f"Nombre d'abonnements trouvés pour cet utilisateur: {len(abonnements)}")
        
        # Calculate score for each subscription
        for abo in abonnements:
            score_data = scoring.calculate_stop_score(abo)
            for key, value in score_data.items():
                setattr(abo, key, value)
                
        return abonnements
    except Exception as e:
        logger.warning(f"[BACKEND SQL ERROR] Erreur lors de la requête SQL: {e}")
        raise HTTPException(status_code=500, detail="Erreur interne du serveur")

@app.get("/abonnements/resume", response_model=schemas.ResumeAbonnements, tags=["Abonnements"], dependencies=[Depends(auth.get_current_user)])
def obtenir_resume_abonnements(
    db: Session = Depends(database.get_db),
    utilisateur_actuel: models.Utilisateur = Depends(auth.get_current_user)
):
    logger.warning(f"=== [BACKEND LOG] GET /abonnements/resume appelé pour l'utilisateur ID {utilisateur_actuel.id} ===")
    try:
        abonnements = db.query(models.Abonnement).filter(models.Abonnement.proprietaire_id == utilisateur_actuel.id).all()
    except Exception as e:
        logger.warning(f"[BACKEND SQL ERROR] Erreur SQL dans le résumé: {e}")
        raise HTTPException(status_code=500, detail="Erreur interne du serveur")
        
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

@app.put("/abonnements/{abonnement_id}", response_model=schemas.Abonnement, tags=["Abonnements"], dependencies=[Depends(auth.get_current_user)])
def modifier_abonnement(
    abonnement_id: int, 
    mise_a_jour: schemas.AbonnementMiseAJour,
    db: Session = Depends(database.get_db),
    utilisateur_actuel: models.Utilisateur = Depends(auth.get_current_user)
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
    
    # Calculate score
    score_data = scoring.calculate_stop_score(abonnement_bd)
    for key, value in score_data.items():
        setattr(abonnement_bd, key, value)
        
    return abonnement_bd

@app.delete("/abonnements/{abonnement_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Abonnements"], dependencies=[Depends(auth.get_current_user)])
def supprimer_abonnement(
    abonnement_id: int, 
    db: Session = Depends(database.get_db),
    utilisateur_actuel: models.Utilisateur = Depends(auth.get_current_user)
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

@app.get("/abonnements/{abonnement_id}/lettre-resiliation", tags=["Abonnements"], dependencies=[Depends(auth.get_current_user)])
def telecharger_lettre_resiliation(
    abonnement_id: int, 
    db: Session = Depends(database.get_db),
    utilisateur_actuel: models.Utilisateur = Depends(auth.get_current_user)
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

@app.post("/admin/seed", tags=["Admin"], dependencies=[Depends(auth.get_current_user)])
def seed_donnees_test(
    db: Session = Depends(database.get_db),
    utilisateur_actuel: models.Utilisateur = Depends(auth.get_current_user)
):
    """
    Route pour injecter les données de test directement dans la base de données du conteneur web actif.
    Indispensable sur Railway si on utilise SQLite sans volume persistant.
    """
    from datetime import date, timedelta
    
    aujourd_hui = date.today()
    prochain_mois = aujourd_hui + timedelta(days=30)
    
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
            proprietaire_id=utilisateur_actuel.id
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
            proprietaire_id=utilisateur_actuel.id
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
            proprietaire_id=utilisateur_actuel.id
        )
    ]
    
    for abo in abos:
        db.add(abo)
        
    db.commit()
    return {"message": "Données de test ajoutées avec succès à la base SQLite du serveur web !"}
@app.post("/abonnements/scan-demo")
def scan_demo_abonnements(
    db: Session = Depends(database.get_db),
    utilisateur_actuel: models.Utilisateur = Depends(auth.get_current_user)
):
    from datetime import date, timedelta

    aujourd_hui = date.today()
    date_renouvellement = aujourd_hui + timedelta(days=30)
    date_debut = aujourd_hui - timedelta(days=1500)

    abonnements = [
        ("Spotify Premium", "Musique", 10.99, models.FrequenceAbonnement.MENSUEL, "SPOTIFY-DEMO"),
        ("Amazon Prime", "Streaming", 6.99, models.FrequenceAbonnement.MENSUEL, "PRIME-DEMO"),
        ("Disney+", "Streaming", 11.99, models.FrequenceAbonnement.MENSUEL, "DISNEY-DEMO"),
        ("Apple Music", "Musique", 10.99, models.FrequenceAbonnement.MENSUEL, "APPLEMUSIC-DEMO"),
    ]

    for nom, categorie, prix, frequence, contrat in abonnements:
        existe = db.query(models.Abonnement).filter(
            models.Abonnement.proprietaire_id == utilisateur_actuel.id,
            models.Abonnement.nom == nom
        ).first()

        if not existe:
            nouveau_abo = models.Abonnement(
                nom=nom,
                categorie=categorie,
                prix=prix,
                frequence=frequence,
                date_souscription=date_debut,
                prochaine_date_renouvellement=date_renouvellement,
                numero_contrat=contrat,
                renouvellement_auto=True,
                statut=models.StatutAbonnement.ACTIF,
                proprietaire_id=utilisateur_actuel.id
            )
            db.add(nouveau_abo)

    db.commit()

    return {"message": "Scan démo terminé"}
