import sqlite3
import os

for db_path in ['stop_abos.db', 'backend/stop_abos.db']:
    if os.path.exists(db_path):
        print(f"\n--- Checking {db_path} ---")
        try:
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
            tables = [row[0] for row in cursor.fetchall()]
            print("Tables:", tables)
            
            if 'utilisateurs' in tables:
                cursor.execute("SELECT id, email FROM utilisateurs")
                users = cursor.fetchall()
                print(f"Users ({len(users)}):", users)
            
            if 'abonnements' in tables:
                cursor.execute("SELECT id, proprietaire_id, nom, prix, statut FROM abonnements")
                subs = cursor.fetchall()
                print(f"Subscriptions ({len(subs)}):")
                for sub in subs:
                    print("  ", sub)
            conn.close()
        except Exception as e:
            print("Error:", e)
    else:
        print(f"{db_path} does not exist")
