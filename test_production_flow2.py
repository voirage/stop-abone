import urllib.request
import urllib.parse
import json

base_url = "http://localhost:8000"

# 1. Login
login_url = f"{base_url}/token"
login_data = urllib.parse.urlencode({
    "username": "jeanluc-final@gmail.com",
    "password": "Password123!"
}).encode('utf-8')

req = urllib.request.Request(login_url, data=login_data)
try:
    with urllib.request.urlopen(req) as response:
        token_data = json.loads(response.read().decode('utf-8'))
        token = token_data['access_token']
        print("Login SUCCESS. Token obtained.")
except Exception as e:
    print("Login FAILED:", e)
    exit(1)

# 2. GET /abonnements
abos_url = f"{base_url}/abonnements"
req_abos = urllib.request.Request(abos_url, headers={"Authorization": f"Bearer {token}"})
try:
    with urllib.request.urlopen(req_abos) as response:
        print("GET /abonnements STATUS:", response.status)
        print("GET /abonnements RESPONSE:", response.read().decode('utf-8')[:100] + "...")
except Exception as e:
    print("GET /abonnements FAILED:", getattr(e, 'code', e))

# 3. GET /abonnements/resume
resume_url = f"{base_url}/abonnements/resume"
req_resume = urllib.request.Request(resume_url, headers={"Authorization": f"Bearer {token}"})
try:
    with urllib.request.urlopen(req_resume) as response:
        print("GET /abonnements/resume STATUS:", response.status)
        print("GET /abonnements/resume RESPONSE:", response.read().decode('utf-8'))
except Exception as e:
    print("GET /abonnements/resume FAILED:", getattr(e, 'code', e))
