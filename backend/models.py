from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey, Enum, DateTime, Boolean
from sqlalchemy.orm import relationship
import enum
from database import Base

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
    
    proprietaire_id = Column(Integer, ForeignKey("utilisateurs.id"))
    proprietaire = relationship("Utilisateur", back_populates="abonnements")
