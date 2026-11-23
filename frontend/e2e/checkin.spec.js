import { test, expect } from '@playwright/test';
import { MITARBEITER, login, hauptnavigation } from './helpers.js';

test.describe('Check-in (employee)', () => {
  test('shows the three options and locks after checking in', async ({ page }) => {
    await login(page, MITARBEITER);

    // Der Zustand ("bereits eingecheckt") steht erst nach der API-Antwort fest, vorher nicht verzweigen.
    const status = page.waitForResponse((r) => r.url().includes('/CheckIn/checkin'));
    await hauptnavigation(page).getByRole('link', { name: 'Check-in' }).click();
    await expect(page).toHaveURL(/\/checkin$/);
    await status;

    for (const label of ['Home Office', 'Office', 'Abwesend']) {
      await expect(page.getByText(label, { exact: true })).toBeVisible();
    }

    const hinweis = page.getByRole('status').filter({ hasText: 'bereits eingecheckt' });
    // Die Seed-Daten füllen alle Werktage 2026. An Tagen mit Eintrag ist nur dieser Zustand prüfbar,
    // an anderen Tagen (Wochenende, anderes Jahr) wird ein echter Check-in durchgeführt.
    if (await hinweis.isVisible()) {
      await expect(page.getByRole('button', { name: 'Einchecken' })).toBeDisabled();
      return;
    }

    await page.getByText('Office', { exact: true }).click();
    await page.getByRole('button', { name: 'Einchecken' }).click();
    await expect(page.getByText('Erfolgreich eingecheckt!')).toBeVisible();
    await expect(hinweis).toBeVisible();
  });
});
