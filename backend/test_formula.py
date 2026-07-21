import sys
sys.path.append(r'C:\Users\BABADJIDE\Desktop\STOP ABONE\backend')
import database, models, scoring
from datetime import date

print("--- 11 DONNEES ACTUELLES ---")
db = database.SessionLocal()
abos = db.query(models.Abonnement).filter(models.Abonnement.proprietaire_id == 11).all()
for a in abos:
    t_rec = getattr(a.type_recurrent, 'value', str(a.type_recurrent))
    if t_rec in ['non_subscription', 'recurring_contract']: continue
    res = scoring.calculate_stop_score(a)
    print(f"ID {a.id} {a.nom} => Score {res['score']} | {res['niveau']} | Urgence: {res['urgence']}")

class MockFreq:
    def __init__(self, v): self.value = v

class MockSub:
    def __init__(self, prix, freq, date_sous, auto, cat, d_renouv):
        self.prix = prix
        self.frequence = MockFreq(freq)
        self.date_souscription = date_sous
        self.renouvellement_auto = auto
        self.categorie = cat
        self.prochaine_date_renouvellement = d_renouv
        self.type_recurrent = 'subscription'

today = date.today()
from datetime import timedelta

print("\n--- PROFILS SYNTHETIQUES ---")
profiles = [
    ("A (Streaming, 3m, 15/m)", MockSub(15, 'mensuel', today - timedelta(days=90), True, 'Streaming', today + timedelta(days=5))),
    ("B (Streaming, 13m, 15/m)", MockSub(15, 'mensuel', today - timedelta(days=400), True, 'Streaming', today + timedelta(days=20))),
    ("C (Streaming, 25m, 15/m)", MockSub(15, 'mensuel', today - timedelta(days=770), True, 'Streaming', today + timedelta(days=20))),
    ("D (Streaming, 37m, auto)", MockSub(15, 'mensuel', today - timedelta(days=1150), True, 'Streaming', today + timedelta(days=20))),
    ("E (Streaming, 37m, no auto)", MockSub(15, 'mensuel', today - timedelta(days=1150), False, 'Streaming', today + timedelta(days=20))),
    ("F (Logiciel, 37m, 400/an)", MockSub(400, 'annuel', today - timedelta(days=1150), True, 'Logiciel', today + timedelta(days=200))),
    ("G (Sport, 3m, 50/m, J-5)", MockSub(50, 'mensuel', today - timedelta(days=90), True, 'Sport', today + timedelta(days=5))),
    ("H (Sport, 37m, 50/m)", MockSub(50, 'mensuel', today - timedelta(days=1150), True, 'Sport', today + timedelta(days=20))),
    ("I (Telecom, 60m, 30/m)", MockSub(30, 'mensuel', today - timedelta(days=1850), True, 'Telecom', today + timedelta(days=99))),
    ("J (Annuel, 3m, 500/an, J-5)", MockSub(500, 'annuel', today - timedelta(days=90), True, 'Abonnement', today + timedelta(days=5)))
]
for p in profiles:
    res = scoring.calculate_stop_score(p[1])
    print(f"Profil {p[0]} => Score: {res['score']} | {res['niveau']} | Urgence: {res['urgence']}")
