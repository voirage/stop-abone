import sys
import json
sys.path.append('./backend')

from fastapi.testclient import TestClient
from main import app
from database import Base, engine, SessionLocal
import models
import logging

logging.basicConfig(level=logging.WARNING)

client = TestClient(app)

print("\n--- 1. Login ---")
resp = client.post("/token", data={"username": "test_scan@example.com", "password": "password"})
token = resp.json().get("access_token")
headers = {"Authorization": f"Bearer {token}"}

print("\n--- 4. Call GET /abonnements ---")
resp_get = client.get("/abonnements", headers=headers)
if resp_get.status_code == 200:
    data = resp_get.json()
    print(f"Returned items: {len(data)}")
    if data:
        # Save to a file instead of print to avoid terminal encoding issues
        with open("api_response.json", "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print("Response saved to api_response.json")
else:
    print(resp_get.text)

