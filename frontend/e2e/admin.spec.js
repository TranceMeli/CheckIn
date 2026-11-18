import { test, expect } from '@playwright/test';
import { ADMIN, login, hauptnavigation } from './helpers.js';

test.describe('Admin area', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, ADMIN);
  });

  test('dashboard shows filters and can be narrowed to one department', async ({ page }) => {
    await expect(page.getByLabel('Abteilung')).toBeVisible();
    await expect(page.getByLabel('Mitarbeiter')).toBeVisible();
    await expect(page.getByRole('alert')).toHaveCount(0);

    await page.getByLabel('Abteilung').selectOption({ index: 1 });
    await expect(page.getByRole('heading', { name: 'Auswertungen' })).toBeVisible();
    await expect(page.getByRole('alert')).toHaveCount(0);
  });

  test('navigation leads to Manage and Export', async ({ page }) => {
    const nav = hauptnavigation(page);

    await nav.getByRole('link', { name: 'Verwalten' }).click();
    await expect(page).toHaveURL(/\/manage$/);

    await nav.getByRole('link', { name: 'Export' }).click();
    await expect(page).toHaveURL(/\/list$/);
  });
});
