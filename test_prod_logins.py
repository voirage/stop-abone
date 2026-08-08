import urllib.request
import urllib.parse
import json
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

def test_user(email, password):
    print(f"\n--- Testing {email} ---")
    data = urllib.parse.urlencode({'username': email, 'password': password}).encode('utf-8')
    req = urllib.request.Request('http://localhost:8000/token', data=data)
    try:
        response = urllib.request.urlopen(req, context=ctx)
        token = json.loads(response.read().decode('utf-8'))['access_token']
        
        req2 = urllib.request.Request('http://localhost:8000/abonnements')
        req2.add_header('Authorization', f'Bearer {token}')
        res2 = urllib.request.urlopen(req2, context=ctx)
        abos = json.loads(res2.read().decode('utf-8'))
        print(f"Success. Token obtained. Abonnements count: {len(abos)}")
        
        req3 = urllib.request.Request('http://localhost:8000/abonnements/resume')
        req3.add_header('Authorization', f'Bearer {token}')
        res3 = urllib.request.urlopen(req3, context=ctx)
        resume = json.loads(res3.read().decode('utf-8'))
        print(f"Resume: {resume}")
        return True, len(abos)
    except Exception as e:
        print("Error:", e)
        return False, 0

users_to_test = [
    ("jeanluc-final@gmail.com", "Password123!"),
    ("jeanlucdeparis16@gmail.com", "Password123!"),
    ("test@test.com", "password123"),
    ("jeanluctest2026@gmail.com", "Password123!")
]

for u, p in users_to_test:
    test_user(u, p)
