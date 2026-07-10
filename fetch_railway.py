import urllib.request
import urllib.parse
import json
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

data = urllib.parse.urlencode({'username': 'test@test.com', 'password': 'password123'}).encode('utf-8')
req = urllib.request.Request('https://stop-abone-production.up.railway.app/token', data=data)
try:
    response = urllib.request.urlopen(req, context=ctx)
    token = json.loads(response.read().decode('utf-8'))['access_token']
    
    req2 = urllib.request.Request('https://stop-abone-production.up.railway.app/abonnements')
    req2.add_header('Authorization', f'Bearer {token}')
    res2 = urllib.request.urlopen(req2, context=ctx)
    abos = json.loads(res2.read().decode('utf-8'))
    print("RAILWAY API RESPONSE:")
    print(json.dumps(abos, indent=2))
except Exception as e:
    print("Error:", e)
    import traceback
    traceback.print_exc()
