import { defineConfig, devices } from '@playwright/test';

// E2E-Tests laufen gegen die echte App: API (https://localhost:7005) und Vite-Dev-Server.
// Die API-Adresse ist im Frontend fest verdrahtet, und CORS erlaubt nur die Ports 5173, 5174 und 5176.
// Daher feste Ports (strictPort). Eine laufende API wird lokal wiederverwendet, das Frontend nie.
export default defineConfig({
  testDir: './e2e',
  // Alle Tests teilen sich eine Datenbank, deshalb nacheinander ausführen.
  workers: 1,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://localhost:5176',
    // Die Entwicklungs-API nutzt das selbstsignierte dotnet-Zertifikat.
    ignoreHTTPSErrors: true,
    trace: 'retain-on-failure',
    locale: 'de-DE',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'dotnet run --project ../backend --launch-profile https',
      url: 'https://localhost:7005/swagger/index.html',
      ignoreHTTPSErrors: true,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: 'npm run dev -- --port 5176 --strictPort',
      url: 'http://localhost:5176',
      // Nie einen fremden Server auf dem Port wiederverwenden: Es soll genau diese App getestet werden.
      reuseExistingServer: false,
      timeout: 60_000,
    },
  ],
});
