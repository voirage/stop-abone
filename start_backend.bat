@echo off
echo ==============================================
echo Lancement du Backend (FastAPI) pour STOP-ABOS
echo ==============================================

cd backend

:: Vérifier si l'environnement virtuel existe
if not exist "venv\Scripts\python.exe" (
    echo [Info] Creation de l'environnement virtuel...
    python -m venv venv
    echo [Info] Installation des dependances...
    venv\Scripts\pip install -r requirements.txt
)

echo [Info] Lancement du serveur...
venv\Scripts\python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
pause
