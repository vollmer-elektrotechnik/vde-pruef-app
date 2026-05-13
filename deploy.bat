@echo off
setlocal
title VDE App Deployment Tool - AJV Elektro GmbH

:: --- KONFIGURATION ---
set GIT_PATH="C:\Program Files\Git\cmd\git.exe"

echo ====================================================
echo   VDE-PRUEF-APP: AUTOMATISCHES DEPLOYMENT
echo ====================================================

:: Prüfen ob Git vorhanden ist
if not exist %GIT_PATH% (
    echo [FEHLER] Git wurde nicht unter %GIT_PATH% gefunden.
    echo Bitte Pfad in dieser .bat Datei anpassen!
    pause
    exit
)

:: 1. Bereinigung: Lösche alle .bak Dateien (rekursiv)
echo [*] Bereinige Verzeichnis: Loesche alle .bak Dateien...
del /s /q *.bak >nul 2>&1

:: 2. Initialisierung (falls noch nicht geschehen)
if not exist ".git" (
    echo [*] Initialisiere neues Git-Repository...
    %GIT_PATH% init
    %GIT_PATH% remote add origin https://github.com/vollmer-elektrotechnik/vde-pruef-app.git
)

:: 3. Version abfragen
echo.
set /p version="Versions-Nummer (z.B. 1.0.1): "
set /p note="Versionshinweis (Was wurde geaendert?): "

:: 4. Git Workflow
echo.
echo [*] Fuege Dateien hinzu...
%GIT_PATH% add .

echo [*] Erstelle Commit fuer v%version%...
%GIT_PATH% commit -m "v%version%: %note%"

echo [*] Setze Main-Branch...
%GIT_PATH% branch -M main

echo [*] Lade zu GitHub hoch...
%GIT_PATH% push -u origin main

echo.
echo ====================================================
echo   ERFOLGREICH: Version %version% hochgeladen!
echo ====================================================
pause