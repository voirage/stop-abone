import sys
import json
import base64
import urllib.request
import urllib.error

print("=== SCRIPT DE DIAGNOSTIC DE SESSION ===")
print("Instructions :")
print("1. Ouvrez votre navigateur sur http://localhost:5173")
print("2. Appuyez sur F12 pour ouvrir les outils de développement")
print("3. Allez dans l'onglet 'Application' > 'Stockage local' (Local Storage) > http://localhost:5173")
print("4. Copiez la valeur de la clé 'access_token'")
print("---------------------------------------")

token = input("Collez le token JWT ici : ").strip()

if not token:
    print("Erreur : Aucun token fourni.")
    sys.exit(1)

print("\n--- DECODAGE DU TOKEN ---")
try:
    parts = token.split('.')
    if len(parts) != 3:
        raise ValueError("Format JWT invalide (ne contient pas 3 parties).")
    
    payload_b64 = parts[1]
    payload_b64 += '=' * (-len(payload_b64) % 4)
    payload = json.loads(base64.urlsafe_b64decode(payload_b64).decode('utf-8'))
    
    print("Champs JWT utilisés :", list(payload.keys()))
    print("Email (sub) :", payload.get('sub', 'NON VÉRIFIÉ'))
    print("ID Utilisateur :", payload.get('id', 'NON VÉRIFIÉ (Le token standard utilisé dans le code source backend n\'inclut que le champ sub/email)'))
    
except Exception as e:
    print("Erreur lors du décodage du payload JWT :", e)
    sys.exit(1)

print("\n--- TEST DE L'API /abonnements ---")
req = urllib.request.Request('http://localhost:8000/abonnements')
req.add_header('Authorization', f'Bearer {token}')

try:
    with urllib.request.urlopen(req) as response:
        status_code = response.status
        data = json.loads(response.read().decode('utf-8'))
        print("Code HTTP :", status_code)
        print("Nombre d'abonnements retournés :", len(data))
except urllib.error.HTTPError as e:
    print("Code HTTP :", e.code)
    try:
        err_data = e.read().decode('utf-8')
        print("Erreur :", err_data)
    except:
        print("Erreur :", e.reason)
except Exception as e:
    print("Erreur de connexion (le backend local est-il allumé ?) :", e)

print("\n=== FIN DU DIAGNOSTIC ===")
