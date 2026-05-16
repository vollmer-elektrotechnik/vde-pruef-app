import { test, expect } from '@playwright/test';

// ===================================================
// GLOBALE CONFIGURATION & TEST-ZUGANGSDATEN
// ===================================================
const BASE_URL = 'http://localhost:3000';
const TEST_EMAIL = 'julianvollmer@live.de';      // <-- Hier deine echte Test-E-Mail eintragen
const TEST_PASSWORD = 'Goodnews89';   // <-- Hier dein echtes Test-Passwort eintragen

// Kleine Hilfsfunktion, um doppelten Login-Code in den Testfällen zu vermeiden
async function login(page) {
  await page.goto(`${BASE_URL}/login`);
  await page.getByPlaceholder('E-Mail').fill(TEST_EMAIL);
  await page.getByPlaceholder('Passwort').fill(TEST_PASSWORD);
  await page.getByRole('button', { name: 'Anmelden' }).click();
  await page.waitForURL(`${BASE_URL}/`);
}

// ===================================================
// TEST SUITE: VDE-ZENTRALE
// ===================================================
test.describe('Zentrale - Authentifizierung & Dashboard-Prüfung', () => {

  // TEST 1: Routing-Schutz prüfen (ohne Login)
  test('Sollte nicht eingeloggte User zur Login-Seite umleiten', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    await page.waitForURL('**/login');
    await expect(page).toHaveURL(`${BASE_URL}/login`);
  });

  // TEST 2: Login-Vorgang prüfen
  test('Sollte sich erfolgreich einloggen und das Dashboard oeffnen', async ({ page }) => {
    // Nutzt die Hilfsfunktion mit den globalen Variablen
    await login(page);
    
    // Überprüfung, ob die Weiterleitung auf die Hauptseite geklappt hat
    await expect(page).toHaveURL(`${BASE_URL}/`);
  });

  // TEST 3: Fachliche Prüfung der Dashboard-Elemente
  test('Sollte alle wichtigen Dashboard-Elemente und Statistiken anzeigen', async ({ page }) => {
    // Nutzt ebenfalls die globale Hilfsfunktion
    await login(page);

    // 1. Prüfung der Hauptüberschrift
    await expect(page.getByRole('heading', { name: 'Zentrale' })).toBeVisible();

    // 2. Prüfung der Statistik-Karten (Supabase-Daten-Check)
    await expect(page.getByText('OFFEN')).toBeVisible();
    await expect(page.getByText('ERLEDIGT')).toBeVisible();
    await expect(page.getByText('GESAMT')).toBeVisible();

    // 3. Prüfung der Listen-Bereiche
    await expect(page.getByText('Letzte Protokolle')).toBeVisible();
    await expect(page.getByText('Schnellstart')).toBeVisible();

    // 4. Prüfung der Aktions-Buttons
    await expect(page.getByRole('button', { name: 'NEUES PROTOKOLL' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'VORLAGEN-EDITOR' })).toBeVisible();
    
    // 5. Prüfung der Seitenleiste / Navigation
    await expect(page.getByRole('link', { name: 'Zeiterfassung' })).toBeVisible();
  });
  
  // 👇 NEUER WORKFLOW-TEST: Protokoll-Erstellung starten
  test('Sollte den Prozess fuer ein neues Protokoll erfolgreich starten', async ({ page }) => {
    // 1. Einloggen
    await login(page);

    // 2. Klicke auf den weißen Button "NEUES PROTOKOLL"
    await page.getByRole('button', { name: 'NEUES PROTOKOLL' }).click();

    // 3. Hier lassen wir Playwright kurz stoppen, damit wir im Trace-Viewer sehen, was passiert.
    // Wir prüfen einfach, ob wir nicht mehr auf dem nackten Dashboard sind:
    await expect(page).not.toHaveURL(`${BASE_URL}/`);
    
    // Tipp für dich: Wenn sich nach dem Klick die Webadresse oben ändert, 
    // kannst du hier später z.B. schreiben: await expect(page).toHaveURL('**/protocols/new');
  });

});