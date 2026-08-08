import sqlite3
import json

conn = sqlite3.connect('backend/stop_abos.db')
c = conn.cursor()

c.execute("SELECT id, email FROM utilisateurs ORDER BY id DESC LIMIT 5")
users = c.fetchall()

c.execute("SELECT id, nom, proprietaire_id FROM abonnements ORDER BY id DESC LIMIT 5")
abos = c.fetchall()

c.execute("SELECT id, email, created_at, endpoint FROM rate_limits ORDER BY created_at DESC LIMIT 5")
rate_limits = c.fetchall()

with open('db_dump.txt', 'w') as f:
    f.write("Recent Users:\n")
    for u in users: f.write(str(u) + "\n")
    f.write("\nRecent Abos:\n")
    for a in abos: f.write(str(a) + "\n")
    f.write("\nRecent Rate Limits:\n")
    for r in rate_limits: f.write(str(r) + "\n")
