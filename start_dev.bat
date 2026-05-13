@echo off
setlocal
title VDE App - Local Development Server

echo ====================================================
echo   VDE-PRUEF-APP: LOKALER START (DEVELOPMENT)
echo ====================================================

:: 1. Prüfen, ob node_modules existieren (Installation check)
if not exist "node_modules\" (
    echo [INFO] node_modules nicht gefunden. Installiere Abhaengigkeiten...
    call npm install
) else (
    echo [*] Abhaengigkeiten sind bereits installiert.
)

:: 2. Prüfen, ob .env.local existiert (Konfigurations check)
if not exist ".env.local" (
    echo [WARNUNG] .env.local Datei fehlt! 
    echo Ohne Supabase-Zugangsdaten wird die App nicht funktionieren.
    echo.
)

:: 3. Start der App
echo [*] Starte Next.js Entwicklungsserver...
echo [*] Die App ist gleich unter http://localhost:3000 erreichbar.
echo.
echo [INFO] Zum Beenden dieses Fensters: Strg + C druecken.
echo ----------------------------------------------------

call npm run dev

pause