@echo off
set PATH=%SystemRoot%\system32;%SystemRoot%;%SystemRoot%\System32\Wbem;%PATH%
title 🛠️ VDE-App Test-Zentrale
cd /d "%~dp0"

:: ===================================================
:: 🔍 SCHRITT 1: INTELLIGENTER SERVER-CHECK
:: ===================================================
cls
echo ===================================================
echo   🔍 PRÜFUNG DER RAHMENBEDINGUNGEN
echo ===================================================
echo.

:: Hier den echten Namen deiner Server-Batch eintragen, falls er anders ist:
set "SERVER_BATCH_NAME=start_dev.bat"

:: Prüfen ob der Server bereits läuft (Port 3000 besetzt?)
netstat -ano | findstr :3000 > nul
if %errorlevel% equ 0 (
    echo [OK] Next.js Server laeuft bereits auf Port 3000. 
    echo      Nutze den bestehenden Server fuer die Tests...
    timeout /t 2 > nul
    goto menu
) else (
    echo [START] Server laeuft noch nicht.
    echo         Oeffne deine Server-Batch in einem neuen Fenster...
    echo.
    
    :: Prüfen, ob deine Server-Batch überhaupt existiert
    if exist "%SERVER_BATCH_NAME%" (
        :: Startet DEINE funktionierende Batch in einem separaten, sichtbaren Fenster
        start "%SERVER_BATCH_NAME%" cmd /c "%SERVER_BATCH_NAME%"
        
        echo ⏳ Warte 6 Sekunden, bis dein Server hochgefahren ist...
        timeout /t 6 > nul
        goto menu
    ) else (
        echo ❌ FEHLER: Die Datei '%SERVER_BATCH_NAME%' wurde nicht gefunden!
        echo           Bitte pruefe den Namen in der run-tests.bat in Zeile 14.
        echo.
        pause
        exit
    )
)

:: --- HAUPTMENÜ ---
:menu
cls
echo ===================================================
echo          VDE-APP AUTOMATISCHE TEST-AUSWAHL
echo ===================================================
echo.
echo  [1] SCHNELLTEST (Im Hintergrund)
echo  [2] VISUELLER TEST (Mit Benutzeroberflaeche) - Empfohlen
echo  [3] BEENDEN
echo.
echo ===================================================
echo.
set /p_choice="Waehle deine Test-Art (1-3): "

if "%_choice%"=="1" goto headless
if "%_choice%"=="2" goto ui
if "%_choice%"=="3" goto exit

echo Ungueltige Auswahl!
pause
goto menu

:headless
cls
echo Starte Tests im Hintergrund...
npx playwright test
goto end

:ui
cls
echo Oeffne das visuelle Playwright-Fenster...
npx playwright test --ui
goto end

:end
echo.
echo Testdurchlauf beendet. Zurueck zum Menue? [J/N]
set /p _again=""
if /i "%_again%"=="J" goto menu

:exit
exit