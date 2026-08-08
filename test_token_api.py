import urllib.request
import json
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

token = open('backend/test_token.txt').read().strip()
req = urllib.request.Request('http://localhost:8000/abonnements')
req.add_header('Authorization', f'Bearer {token}')
req.add_header('User-Agent', 'Mozilla/5.0')

try:
    with urllib.request.urlopen(req, context=ctx) as response:
        print("Status:", response.status)
        print("Data:", response.read().decode('utf-8'))
except Exception as e:
    print("Error:", e)
