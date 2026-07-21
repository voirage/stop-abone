import pytest
from csv_import import analyze_csv
import schemas

def test_detect_abonnement_mensuel():
    csv_content = b"""date;libelle;montant
05/01/2026;PRLV SEPA NETFLIX;-15,99
05/02/2026;NETFLIX.COM;-15,99
05/03/2026;CB NETFLIX 0503;-15,99
"""
    candidats = analyze_csv(csv_content)
    assert len(candidats) == 1
    assert candidats[0]["nom"].upper() == "NETFLIX"
    assert candidats[0]["frequence"] == schemas.FrequenceAbonnement.MENSUEL
    assert candidats[0]["prix"] == 15.99

def test_detect_abonnement_annuel():
    csv_content = b"""date;libelle;montant
05/01/2025;AMAZON PRIME;-69,90
05/01/2026;AMAZON PRIME;-69,90
"""
    candidats = analyze_csv(csv_content)
    assert len(candidats) == 1
    assert candidats[0]["nom"].upper() == "AMAZON PRIME"
    assert candidats[0]["frequence"] == schemas.FrequenceAbonnement.ANNUEL

def test_non_detection_achat_unique():
    csv_content = b"""date;libelle;montant
15/01/2026;SUPERMARCHE EXEMPLE;-82,40
"""
    candidats = analyze_csv(csv_content)
    assert len(candidats) == 0

def test_tolerance_variation_prix():
    csv_content = b"""date;libelle;montant
10/01/2026;EDF;-50,00
10/02/2026;EDF;-52,00
10/03/2026;EDF;-49,00
"""
    candidats = analyze_csv(csv_content)
    assert len(candidats) == 1
    assert candidats[0]["nom"].upper() == "EDF"

def test_rejet_fichier_non_csv():
    # En fait la fonction analyze_csv retourne [] si ce n'est pas parsable
    content = b"Ceci n'est pas un csv valide\nEt ca ne marche pas"
    candidats = analyze_csv(content)
    assert len(candidats) == 0

def test_gestion_ligne_invalide():
    csv_content = b"""date;libelle;montant
05/01/2026;PRLV SEPA NETFLIX;-15,99
invalid_date;NETFLIX.COM;-15,99
05/02/2026;CB NETFLIX 0503;-15,99
"""
    # Ici, une ligne invalide est ignorée, donc on n'a que 2 transactions, ce qui est suffisant pour détecter
    candidats = analyze_csv(csv_content)
    assert len(candidats) == 1
    assert candidats[0]["nombre_paiements_detectes"] == 2

def test_integration_demo_csv():
    csv_content = b"""date;libelle;montant
05/01/2026;PRLV SEPA NETFLIX;-15,99
05/02/2026;NETFLIX.COM;-15,99
05/03/2026;CB NETFLIX 0503;-15,99
10/01/2026;SPOTIFY PREMIUM;-10,99
10/02/2026;SPOTIFY PREMIUM;-10,99
10/03/2026;SPOTIFY PREMIUM;-10,99
15/01/2026;SUPERMARCHE EXEMPLE;-82,40
22/02/2026;RESTAURANT EXEMPLE;-35,00"""
    candidats = analyze_csv(csv_content)
    assert len(candidats) == 2
    noms = [c["nom"].upper() for c in candidats]
    assert "NETFLIX" in noms
    assert "SPOTIFY PREMIUM" in noms
