from pydantic import BaseModel, EmailStr
from datetime import date
from typing import List, Optional
from models import StatutAbonnement, FrequenceAbonnement, TypeRecurrent

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

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str
    confirm_password: str

# --- Schémas Abonnement ---
class AbonnementBase(BaseModel):
    nom: str
    categorie: str
    prix: float
    frequence: FrequenceAbonnement = FrequenceAbonnement.MENSUEL
    prochaine_date_renouvellement: Optional[date] = None
    numero_contrat: Optional[str] = None
    statut: StatutAbonnement = StatutAbonnement.ACTIF
    type_recurrent: TypeRecurrent = TypeRecurrent.SUBSCRIPTION
    date_souscription: Optional[date] = None
    renouvellement_auto: bool = True
    
    # --- Champs liés à la détection par CSV ---
    source_detection: str = "manuel"
    libelle_detection: Optional[str] = None
    nombre_paiements_detectes: Optional[int] = None
    date_premier_paiement: Optional[date] = None
    date_dernier_paiement: Optional[date] = None
    confiance_detection: Optional[str] = None
    confirme_par_utilisateur: bool = True

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
    source_detection: Optional[str] = None
    libelle_detection: Optional[str] = None
    nombre_paiements_detectes: Optional[int] = None
    date_premier_paiement: Optional[date] = None
    date_dernier_paiement: Optional[date] = None
    confiance_detection: Optional[str] = None
    confirme_par_utilisateur: Optional[bool] = None

class CandidatAbonnement(BaseModel):
    nom: str
    categorie: str
    prix: float
    frequence: FrequenceAbonnement
    prochaine_date_renouvellement: date
    date_souscription: date
    statut: StatutAbonnement = StatutAbonnement.ACTIF
    type_recurrent: TypeRecurrent = TypeRecurrent.SUBSCRIPTION
    renouvellement_auto: bool = True
    source_detection: str = "import_csv"
    libelle_detection: Optional[str] = None
    nombre_paiements_detectes: int
    date_premier_paiement: date
    date_dernier_paiement: date
    confiance_detection: str
    explication_detection: str
    moyenne_intervalle: Optional[float] = None

class Abonnement(AbonnementBase):
    id: int
    proprietaire_id: int
    score: Optional[int] = None
    niveau: Optional[str] = None
    couleur: Optional[str] = None
    explication: Optional[List[str]] = None
    action: Optional[str] = None
    economieAnnuelle: Optional[float] = None

    class Config:
        from_attributes = True

class ResumeAbonnements(BaseModel):
    total_mensuel: float
    total_annuel: float
