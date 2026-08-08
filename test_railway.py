import urllib.request
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

req = urllib.request.Request(
    'http://localhost:8000/docs',
    headers={'User-Agent': 'Mozilla/5.0'}
)
try:
    with urllib.request.urlopen(req, context=ctx) as response:
        print("Status:", response.status)
        print("Length:", len(response.read()))
except Exception as e:
    print("Error:", e)
