import urllib.request
import urllib.parse
import json

url = "http://localhost:8000/inscription"
data = json.dumps({
    "email": "jeanluc-final@gmail.com",
    "mot_de_passe": "Password123!"
}).encode('utf-8')

req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
try:
    with urllib.request.urlopen(req) as response:
        print("HTTP Status:", response.status)
        print("Response:", response.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print("HTTP Status:", e.code)
    print("Error Response:", e.read().decode('utf-8'))
except Exception as e:
    print("Error:", e)
