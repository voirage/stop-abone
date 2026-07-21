import requests
import sys

def test_analyze():
    # Login to get a token
    login_resp = requests.post("http://127.0.0.1:8000/token", data={
        "username": "test_ui_fix@example.com",
        "password": "SecureP@ss1"
    })
    
    if login_resp.status_code != 200:
        print("Login failed:", login_resp.text)
        sys.exit(1)
        
    token = login_resp.json().get("access_token")
    headers = {"Authorization": f"Bearer {token}"}
    
    # Send CSV
    with open("demo_transactions.csv", "rb") as f:
        files = {"file": ("demo_transactions.csv", f, "text/csv")}
        resp = requests.post("http://127.0.0.1:8000/imports/csv/analyser", headers=headers, files=files)
        
    if resp.status_code != 200:
        print("Analysis failed:", resp.text)
        sys.exit(1)
        
    candidats = resp.json()
    print(f"Found {len(candidats)} candidats.")
    
    for c in candidats:
        print(f"[{c['type_recurrent']}] {c['nom']} - {c['prix']}€ - Confiance: {c['confiance_detection']}")

if __name__ == "__main__":
    test_analyze()
