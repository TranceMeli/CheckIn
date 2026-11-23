import { test, expect } from '@playwright/test';
import { ADMIN, MITARBEITER, login } from './helpers.js';

test.describe('Sign-in and access control', () => {
  test('admin signs in and sees the dashboard', async ({ page }) => {
    await login(page, ADMIN);
    await expect(page.getByRole('heading', { name: 'Auswertungen' })).toBeVisible();
  });

  test('employee signs in and sees only their own statistics', async ({ page }) => {
    await login(page, MITARBEITER);
    await expect(page.getByRole('heading', { name: 'Meine Statistik' })).toBeVisible();
  });

  test('wrong password shows an error and stays on the login page', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(ADMIN.email);
    await page.getByLabel('Passwort').fill('falsches-Passwort');
    await page.getByRole('button', { name: 'Einloggen' }).click();

    await expect(page.getByText('Email oder Passwort falsch')).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('protected page without sign-in redirects to the login', async ({ page }) => {
    await page.goto('/manage');
    await expect(page).toHaveURL(/\/login$/);
  });

  test('employee is sent from admin pages back to the dashboard', async ({ page }) => {
    await login(page, MITARBEITER);
    // Direktaufruf lädt die App neu; die Sitzung wird über das Refresh-Cookie wiederhergestellt.
    await page.goto('/manage');
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test('signing out leads back to the login', async ({ page }) => {
    await login(page, ADMIN);
    await page.getByRole('button', { name: 'Benutzermenü' }).click();
    await page.getByRole('menuitem', { name: /abmelden/i }).click();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('imprint and privacy policy are reachable without signing in', async ({ page }) => {
    await page.goto('/impressum');
    await expect(page.getByRole('heading', { name: /impressum/i }).first()).toBeVisible();
    await page.goto('/datenschutz');
    await expect(page.getByRole('heading', { name: /datenschutz/i }).first()).toBeVisible();
  });
});
