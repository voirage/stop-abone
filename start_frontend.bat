@echo off
echo ============================================
echo Lancement du Frontend Web Vite pour STOP-ABOS
echo ============================================

cd /d "%~dp0frontend-web"

if not exist "node_modules" (
    echo [Info] Installation des dependances...
    npm install
)

echo [Info] Lancement du serveur Vite...
npm run dev

pause