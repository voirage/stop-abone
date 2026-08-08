import sqlite3
import urllib.request
import urllib.parse
import json
import ssl
import sys

# URL de production (ajustez si elle a changé)
API_BASE_URL = "http://localhost:8000"
USER_EMAIL = "jeanluc-final@gmail.com"
USER_PASS = "Password123!"

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

def login():
    url = f"{API_BASE_URL}/token"
    data = urllib.parse.urlencode({'username': USER_EMAIL, 'password': USER_PASS}).encode('utf-8')
    req = urllib.request.Request(url, data=data)
    try:
        response = urllib.request.urlopen(req, context=ctx)
        token = json.loads(response.read().decode('utf-8'))['access_token']
        print("Connecte avec succes a la production.")
        return token
    except Exception as e:
        print(f"Echec de la connexion a {API_BASE_URL}: {e}")
        sys.exit(1)

def get_prod_abos(token):
    req = urllib.request.Request(f"{API_BASE_URL}/abonnements")
    req.add_header('Authorization', f'Bearer {token}')
    try:
        res = urllib.request.urlopen(req, context=ctx)
        return json.loads(res.read().decode('utf-8'))
    except Exception as e:
        print(f"Impossible de recuperer les abonnements en prod: {e}")
        sys.exit(1)

def delete_prod_abo(token, abo_id):
    req = urllib.request.Request(f"{API_BASE_URL}/abonnements/{abo_id}", method="DELETE")
    req.add_header('Authorization', f'Bearer {token}')
    try:
        urllib.request.urlopen(req, context=ctx)
        print(f"Doublon supprime en prod (ID: {abo_id})")
    except Exception as e:
        print(f"Erreur lors de la suppression de l'abo {abo_id}: {e}")

def get_local_abos():
    conn = sqlite3.connect("backend/stop_abos.db")
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    # On récupère les abonnements de l'ID 2 (jeanluc-final) qu'on a déjà migrés localement
    abos = c.execute("SELECT * FROM abonnements WHERE proprietaire_id=2").fetchall()
    conn.close()
    return [dict(a) for a in abos]

def post_prod_abo(token, abo):
    req = urllib.request.Request(f"{API_BASE_URL}/abonnements", method="POST")
    req.add_header('Authorization', f'Bearer {token}')
    req.add_header('Content-Type', 'application/json')
    
    payload = {
        "nom": abo["nom"],
        "categorie": abo["categorie"],
        "prix": abo["prix"],
        "frequence": abo["frequence"],
        "prochaine_date_renouvellement": abo["prochaine_date_renouvellement"],
        "numero_contrat": abo["numero_contrat"],
        "statut": abo["statut"],
        "renouvellement_auto": bool(abo["renouvellement_auto"])
    }
    
    if abo.get("date_souscription"):
        payload["date_souscription"] = abo["date_souscription"]
    
    try:
        res = urllib.request.urlopen(req, data=json.dumps(payload).encode('utf-8'), context=ctx)
        new_abo = json.loads(res.read().decode('utf-8'))
        print(f"Abonnement insere : {new_abo['nom']} (Prix: {new_abo['prix']} €)")
    except Exception as e:
        print(f"Erreur lors de l'insertion de {abo['nom']}: {e}")

def main():
    print("=== DÉBUT DU TRANSFERT VERS LA PRODUCTION ===")
    token = login()
    
    prod_abos = get_prod_abos(token)
    print(f"La production contient actuellement {len(prod_abos)} abonnements.")
    
    if len(prod_abos) > 0:
        print("Nettoyage des abonnements existants pour éviter les doublons...")
        for pa in prod_abos:
            delete_prod_abo(token, pa["id"])
            
    local_abos = get_local_abos()
    print(f"{len(local_abos)} abonnements trouves dans la base locale pour l'utilisateur 2.")
    
    for abo in local_abos:
        post_prod_abo(token, abo)
        
    final_abos = get_prod_abos(token)
    print(f"OPERATION TERMINEE. La production contient maintenant {len(final_abos)} abonnements.")
    
    req_resume = urllib.request.Request(f"{API_BASE_URL}/abonnements/resume")
    req_resume.add_header('Authorization', f'Bearer {token}')
    res_resume = urllib.request.urlopen(req_resume, context=ctx)
    resume = json.loads(res_resume.read().decode('utf-8'))
    print(f"GET /abonnements/resume : {resume}")

if __name__ == "__main__":
    main()
