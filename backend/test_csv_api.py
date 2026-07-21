import urllib.request
import urllib.parse
import json

# Login
data = urllib.parse.urlencode({'username': 'test_agent@example.com', 'password': 'password123'}).encode('utf-8')
req = urllib.request.Request('http://127.0.0.1:8000/token', data=data)
res = urllib.request.urlopen(req)
token = json.loads(res.read())['access_token']

# POST /imports/csv/analyser
boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW'
csv_content = 'Date;Libelle;Montant\n01/01/2023;Netflix;-15.99\n01/02/2023;Netflix;-15.99\n'
body = (
    '--' + boundary + '\r\n'
    'Content-Disposition: form-data; name="file"; filename="test.csv"\r\n'
    'Content-Type: text/csv\r\n\r\n'
    + csv_content + '\r\n'
    '--' + boundary + '--\r\n'
).encode('utf-8')

headers = {
    'Authorization': f'Bearer {token}',
    'Content-Type': f'multipart/form-data; boundary={boundary}',
    'Content-Length': str(len(body))
}

req = urllib.request.Request('http://127.0.0.1:8000/imports/csv/analyser', data=body, headers=headers)
try:
    res = urllib.request.urlopen(req)
    print('POST /imports/csv/analyser:', res.status, res.read().decode())
except Exception as e:
    print('Error:', getattr(e, 'code', e), getattr(e, 'read', lambda: lambda: b'')()().decode())
