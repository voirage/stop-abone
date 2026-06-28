from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status, Security
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
import schemas, models, database

# Configuration pour le token (à sécuriser en production via des variables d'environnement)
SECRET_KEY = "STOP_ABOS_SUPER_SECRET_KEY_FOR_MVP_ONLY"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 # 1 semaine
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def verifier_mot_de_passe(mot_de_passe_clair, mot_de_passe_hache):
    return pwd_context.verify(mot_de_passe_clair, mot_de_passe_hache)

def obtenir_hachage_mot_de_passe(mot_de_passe):
    return pwd_context.hash(mot_de_passe)

def creer_token_acces(donnees: dict, expires_delta: Optional[timedelta] = None):
    a_encoder = donnees.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    a_encoder.update({"exp": expire})
    jwt_encode = jwt.encode(a_encoder, SECRET_KEY, algorithm=ALGORITHM)
    return jwt_encode

def obtenir_utilisateur(db: Session, email: str):
    return db.query(models.Utilisateur).filter(models.Utilisateur.email == email).first()

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(database.get_db)):
    exception_identifiants = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Impossible de valider les identifiants",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise exception_identifiants
        donnees_token = schemas.TokenData(email=email)
    except JWTError:
        raise exception_identifiants
    
    utilisateur = obtenir_utilisateur(db, email=donnees_token.email)
    if utilisateur is None:
        raise exception_identifiants
    return utilisateur
