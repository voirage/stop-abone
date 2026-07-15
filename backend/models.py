from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey, Enum, DateTime, Boolean
from sqlalchemy.orm import relationship
import enum
from database import Base
from datetime import datetime

class StatutAbonnement(str, enum.Enum):
    ACTIF = "actif"
    A_RESILIER = "a_resilier"
    RESILIE = "resilie"

class FrequenceAbonnement(str, enum.Enum):
    MENSUEL = "mensuel"
    ANNUEL = "annuel"

class Utilisateur(Base):
    __tablename__ = "utilisateurs"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    mot_de_passe_hache = Column(String, nullable=False)
    reset_code = Column(String, nullable=True)
    reset_expiry = Column(DateTime, nullable=True)

    abonnements = relationship("Abonnement", back_populates="proprietaire")

class Abonnement(Base):
    __tablename__ = "abonnements"

    id = Column(Integer, primary_key=True, index=True)
    nom = Column(String, index=True, nullable=False)
    categorie = Column(String, index=True, nullable=False) # ex: Telecom, Streaming, Banque
    prix = Column(Float, nullable=False)
    frequence = Column(Enum(FrequenceAbonnement), default=FrequenceAbonnement.MENSUEL, nullable=False)
    prochaine_date_renouvellement = Column(Date, nullable=False)
    numero_contrat = Column(String, nullable=True)
    statut = Column(Enum(StatutAbonnement), default=StatutAbonnement.ACTIF, nullable=False)
    date_souscription = Column(Date, nullable=True)
    renouvellement_auto = Column(Boolean, default=True, nullable=False)
    
    # --- Champs liés à la détection par CSV ---
    source_detection = Column(String, default="manuel", nullable=False)
    libelle_detection = Column(String, nullable=True)
    nombre_paiements_detectes = Column(Integer, nullable=True)
    date_premier_paiement = Column(Date, nullable=True)
    date_dernier_paiement = Column(Date, nullable=True)
    confiance_detection = Column(String, nullable=True) # faible, moyen, eleve
    confirme_par_utilisateur = Column(Boolean, default=True, nullable=False)
    date_confirmation_utilisateur = Column(DateTime, nullable=True)

    proprietaire_id = Column(Integer, ForeignKey("utilisateurs.id"))
    proprietaire = relationship("Utilisateur", back_populates="abonnements")

class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("utilisateurs.id"), nullable=False)
    token_hash = Column(String, nullable=False, unique=True, index=True)
    expires_at = Column(DateTime, nullable=False)
    used_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    request_ip = Column(String, nullable=True)

    user = relationship("Utilisateur")

class RateLimit(Base):
    __tablename__ = "rate_limits"
    
    id = Column(Integer, primary_key=True, index=True)
    ip_address = Column(String, index=True, nullable=True)
    email = Column(String, index=True, nullable=True)
    endpoint = Column(String, index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
