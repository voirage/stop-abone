import os
from dotenv import load_dotenv

# Set it in the environment as Render would
os.environ["DATABASE_URL"] = "postgresql://dummy"

print("Avant load_dotenv:", os.environ.get("DATABASE_URL"))
load_dotenv()
print("Après load_dotenv:", os.environ.get("DATABASE_URL"))
