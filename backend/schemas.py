from pydantic import BaseModel, EmailStr
from datetime import date
from typing import List, Optional
from models import StatutAbonnement, FrequenceAbonnement

# --- Schémas Token ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# --- Schémas Utilisateur ---
class UtilisateurBase(BaseModel):
    email: EmailStr

class UtilisateurCreation(UtilisateurBase):
    mot_de_passe: str

class Utilisateur(UtilisateurBase):
    id: int

    class Config:
        from_attributes = True

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ForgotPasswordResponse(BaseModel):
    msg: str
    reset_code: str
    expires_in_minutes: int

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    code: str
    nouveau_mot_de_passe: str

# --- Schémas Abonnement ---
class AbonnementBase(BaseModel):
    nom: str
    categorie: str
    prix: float
    frequence: FrequenceAbonnement = FrequenceAbonnement.MENSUEL
    prochaine_date_renouvellement: Optional[date] = None
    numero_contrat: Optional[str] = None
    statut: StatutAbonnement = StatutAbonnement.ACTIF
    date_souscription: Optional[date] = None
    renouvellement_auto: bool = True

class AbonnementCreation(AbonnementBase):
    pass

class AbonnementMiseAJour(BaseModel):
    nom: Optional[str] = None
    categorie: Optional[str] = None
    prix: Optional[float] = None
    frequence: Optional[FrequenceAbonnement] = None
    prochaine_date_renouvellement: Optional[date] = None
    statut: Optional[StatutAbonnement] = None
    date_souscription: Optional[date] = None
    renouvellement_auto: Optional[bool] = None

class Abonnement(AbonnementBase):
    id: int
    proprietaire_id: int

    class Config:
        from_attributes = True

class ResumeAbonnements(BaseModel):
    total_mensuel: float
    total_annuel: float
