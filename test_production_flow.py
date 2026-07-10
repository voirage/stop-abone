import requests
import json
import uuid

API_URL = "https://stop-abone-production.up.railway.app"
TEST_EMAIL = f"test_prod_{uuid.uuid4().hex[:8]}@example.com"
TEST_PASS = "password123"

print("=== DEBUT DES TESTS EN PRODUCTION ===")

# 1. Inscription
print(f"\n1. Inscription de l'utilisateur {TEST_EMAIL}...")
res_reg = requests.post(f"{API_URL}/inscription", json={
    "email": TEST_EMAIL,
    "mot_de_passe": TEST_PASS
})
print("Statut:", res_reg.status_code)
if res_reg.status_code not in (200, 201):
    print("Erreur inscription:", res_reg.text)
    exit(1)

# 2. Login
print("\n2. Connexion...")
res_login = requests.post(f"{API_URL}/token", data={
    "username": TEST_EMAIL,
    "password": TEST_PASS
})
print("Statut:", res_login.status_code)
if res_login.status_code != 200:
    print("Erreur login:", res_login.text)
    exit(1)

token = res_login.json().get("access_token")
headers = {"Authorization": f"Bearer {token}"}
print("Token obtenu avec succès.")

# 3. Lancer le scan-demo
print("\n3. Lancement de POST /abonnements/scan-demo...")
res_scan = requests.post(f"{API_URL}/abonnements/scan-demo", headers=headers)
print("Statut:", res_scan.status_code)
print("Réponse:", res_scan.json())

# 4. Vérifier les abonnements et le score STOP
print("\n4. Récupération GET /abonnements...")
res_abos = requests.get(f"{API_URL}/abonnements", headers=headers)
print("Statut:", res_abos.status_code)
data = res_abos.json()
print(f"Nombre d'abonnements trouvés: {len(data)}")

if len(data) > 0:
    first_abo = data[0]
    print(f"\nPremier abonnement: {first_abo.get('nom')}")
    print(f"Score calculé par le backend: {first_abo.get('score')}")
    print(f"Niveau: {first_abo.get('niveau')}")
    print(f"Explication (première ligne): {first_abo.get('explication', [])[0] if first_abo.get('explication') else 'Aucune'}")
else:
    print("ERREUR: La liste est vide.")

# 5. Tester la génération de lettre
if len(data) > 0:
    abo_id = data[0].get("id")
    print(f"\n5. Test génération PDF de résiliation pour ID {abo_id}...")
    res_pdf = requests.get(f"{API_URL}/abonnements/{abo_id}/lettre-resiliation", headers=headers)
    print("Statut:", res_pdf.status_code)
    print(f"Type de contenu: {res_pdf.headers.get('Content-Type')}")
    if res_pdf.status_code == 200 and "pdf" in res_pdf.headers.get("Content-Type", ""):
        print("PDF généré avec succès!")
    else:
        print("Erreur PDF:", res_pdf.text[:200])

print("\n=== FIN DES TESTS EN PRODUCTION ===")
