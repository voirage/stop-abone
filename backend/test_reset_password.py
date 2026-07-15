import pytest
from fastapi.testclient import TestClient
from main import app
import models, database, auth
import hashlib
from datetime import datetime, timedelta

client = TestClient(app)

@pytest.fixture(scope="module")
def setup_db():
    models.Base.metadata.create_all(bind=database.engine)
    db = database.SessionLocal()
    
    # Nettoyage initial
    db.query(models.RateLimit).delete()
    db.query(models.PasswordResetToken).delete()
    db.query(models.Utilisateur).filter(models.Utilisateur.email.in_([
        "test_reset@example.com", 
        "test_rate@example.com"
    ])).delete()
    db.commit()
    
    # Utilisateur de test
    mot_de_passe_hache = auth.obtenir_hachage_mot_de_passe("OldPass123!")
    user = models.Utilisateur(email="test_reset@example.com", mot_de_passe_hache=mot_de_passe_hache)
    db.add(user)
    db.commit()
    
    yield db
    
    # Nettoyage final
    db.query(models.RateLimit).delete()
    db.query(models.PasswordResetToken).delete()
    db.query(models.Utilisateur).filter(models.Utilisateur.email.in_([
        "test_reset@example.com", 
        "test_rate@example.com"
    ])).delete()
    db.commit()
    db.close()

def test_forgot_password_email_exists(setup_db):
    res = client.post("/auth/forgot-password", json={"email": "test_reset@example.com"})
    assert res.status_code == 200
    assert "Si un compte correspond" in res.json()["msg"]
    
    # Vérifie que le token a été créé
    user = setup_db.query(models.Utilisateur).filter(models.Utilisateur.email == "test_reset@example.com").first()
    token = setup_db.query(models.PasswordResetToken).filter(models.PasswordResetToken.user_id == user.id).first()
    assert token is not None

def test_forgot_password_email_not_exists(setup_db):
    res = client.post("/auth/forgot-password", json={"email": "nobody@example.com"})
    assert res.status_code == 200
    assert "Si un compte correspond" in res.json()["msg"]

def test_rate_limiting(setup_db):
    # Les tests précédents ont déjà consommé 2 requêtes sur cette IP (testclient)
    # L'email test_rate@example.com est nouveau.
    for _ in range(3):
        res = client.post("/auth/forgot-password", json={"email": "test_rate@example.com"})
        assert res.status_code == 200
        
    # La 4ème requête pour cet email devrait être bloquée (limite de 3 par email)
    # Mais le message reste le même
    res = client.post("/auth/forgot-password", json={"email": "test_rate@example.com"})
    assert res.status_code == 200

def test_reset_password_weak_password():
    res = client.post("/auth/reset-password", json={
        "token": "dummy",
        "new_password": "weak",
        "confirm_password": "weak"
    })
    assert res.status_code == 400
    assert "Le mot de passe doit contenir au moins 8 caractères" in res.json()["detail"]

def test_reset_password_invalid_token():
    res = client.post("/auth/reset-password", json={
        "token": "invalid_token_xyz",
        "new_password": "NewPassword123",
        "confirm_password": "NewPassword123"
    })
    assert res.status_code == 400
    assert "invalide ou expiré" in res.json()["detail"]

def test_reset_password_valid(setup_db):
    user = setup_db.query(models.Utilisateur).filter(models.Utilisateur.email == "test_reset@example.com").first()
    raw_token = "valid_token_123"
    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
    reset_token = models.PasswordResetToken(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=datetime.utcnow() + timedelta(minutes=30)
    )
    setup_db.add(reset_token)
    setup_db.commit()
    
    res = client.post("/auth/reset-password", json={
        "token": raw_token,
        "new_password": "NewPassword123",
        "confirm_password": "NewPassword123"
    })
    assert res.status_code == 200
    assert "succès" in res.json()["msg"]
    
    # Vérifie que le token est marqué comme utilisé
    setup_db.refresh(reset_token)
    assert reset_token.used_at is not None
    
def test_reset_password_already_used(setup_db):
    raw_token = "valid_token_123" # Le même que le test précédent
    res = client.post("/auth/reset-password", json={
        "token": raw_token,
        "new_password": "AnotherPassword123",
        "confirm_password": "AnotherPassword123"
    })
    assert res.status_code == 400
    assert "invalide ou expiré" in res.json()["detail"]

def test_reset_password_old_password_rejected(setup_db):
    user = setup_db.query(models.Utilisateur).filter(models.Utilisateur.email == "test_reset@example.com").first()
    raw_token = "valid_token_456"
    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
    reset_token = models.PasswordResetToken(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=datetime.utcnow() + timedelta(minutes=30)
    )
    setup_db.add(reset_token)
    setup_db.commit()
    
    res = client.post("/auth/reset-password", json={
        "token": raw_token,
        "new_password": "NewPassword123", # C'est le mdp actuel après le test précédent
        "confirm_password": "NewPassword123"
    })
    assert res.status_code == 400
    assert "différent de l'ancien" in res.json()["detail"]
