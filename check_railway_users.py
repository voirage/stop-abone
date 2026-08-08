import urllib.request
import json
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

url = "http://localhost:8000/debug-production"
req = urllib.request.Request(url)
with urllib.request.urlopen(req, context=ctx) as response:
    data = json.loads(response.read().decode('utf-8'))
    print("Users in Railway:")
    print(json.dumps(data, indent=2))
