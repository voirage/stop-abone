import urllib.request
import urllib.parse
import json
import sys

url = "http://localhost:8000/token"
data = urllib.parse.urlencode({
    "username": "jeanluc-final@gmail.com",
    "password": "password123" # I don't know the actual password, maybe it fails with 401
}).encode('utf-8')

req = urllib.request.Request(url, data=data)
try:
    with urllib.request.urlopen(req) as response:
        print("HTTP Status:", response.status)
        print("Response:", response.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print("HTTP Status:", e.code)
    print("Error Response:", e.read().decode('utf-8'))
except Exception as e:
    print("Error:", e)
