import { test, expect } from '@playwright/test';
import { ADMIN, MITARBEITER, login, hauptnavigation } from './helpers.js';

const deutsch = (page) => page.getByRole('button', { name: 'Deutsch' });
const englisch = (page) => page.getByRole('button', { name: 'English' });

test.describe('Language switch', () => {
  test('login page starts in German and switches to English', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Willkommen bei CheckIn' })).toBeVisible();
    await expect(deutsch(page)).toHaveAttribute('aria-pressed', 'true');

    await englisch(page).click();

    await expect(page.getByRole('heading', { name: 'Welcome to CheckIn' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });

  test('the choice survives a reload and a visit to another page', async ({ page }) => {
    await page.goto('/login');
    await englisch(page).click();

    await page.reload();
    await expect(page.getByRole('heading', { name: 'Welcome to CheckIn' })).toBeVisible();

    await page.getByRole('link', { name: 'Legal notice' }).click();
    await expect(page).toHaveURL(/\/impressum$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Legal notice' })).toBeVisible();
  });

  test('legal pages switch language as well', async ({ page }) => {
    await page.goto('/datenschutz');
    await expect(page.getByRole('heading', { level: 1, name: 'Datenschutzerklärung' })).toBeVisible();

    await englisch(page).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Privacy policy' })).toBeVisible();
    await expect(page.getByRole('heading', { name: '8. Your rights' })).toBeVisible();

    await deutsch(page).click();
    await expect(page.getByRole('heading', { name: '8. Ihre Rechte' })).toBeVisible();
  });

  test('admin dashboard switches to English and back without reloading', async ({ page }) => {
    await login(page, ADMIN);
    await expect(page.getByRole('heading', { name: 'Auswertungen' })).toBeVisible();

    await englisch(page).click();

    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByLabel('Department')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Month' })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByText(/^total check-ins$/i)).toBeVisible();
    await expect(page.getByRole('heading', { name: /^target rate/i })).toBeVisible();
    await expect(page.getByRole('alert')).toHaveCount(0);
    const nav = hauptnavigation(page, 'en');
    await expect(nav.getByRole('link', { name: 'Manage' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Export' })).toBeVisible();

    await deutsch(page).click();
    await expect(page.getByRole('heading', { name: 'Auswertungen' })).toBeVisible();
    await expect(page.getByText('Check-ins gesamt')).toBeVisible();
  });

  test('the period label uses the language of the page', async ({ page }) => {
    await login(page, ADMIN, 'en');

    await page.getByRole('button', { name: 'Week', exact: true }).click();

    await expect(page.getByText(/^CW \d+ · /).first()).toBeVisible();
  });

  test('manage and export pages are translated', async ({ page }) => {
    await login(page, ADMIN, 'en');
    const nav = hauptnavigation(page, 'en');

    await nav.getByRole('link', { name: 'Manage' }).click();
    await expect(page.getByRole('heading', { name: 'Manage' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Add a check-in' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Add check-in|Change entry/ })).toBeVisible();

    await nav.getByRole('link', { name: 'Export' }).click();
    await expect(page.getByRole('button', { name: 'Download CSV' })).toBeVisible();
    await expect(page.getByLabel('Month')).toBeVisible();
  });

  test('employee sees the check-in page and statistics in English', async ({ page }) => {
    await login(page, MITARBEITER, 'en');
    await expect(page.getByRole('heading', { name: 'My statistics' })).toBeVisible();
    await expect(page.getByText(/^office days$/i)).toBeVisible();

    await hauptnavigation(page, 'en').getByRole('link', { name: 'Check-in' }).click();

    await expect(page.getByText('Home office', { exact: true })).toBeVisible();
    await expect(page.getByText('Absent', { exact: true })).toBeVisible();
  });

  test('signing out keeps the chosen language', async ({ page }) => {
    await login(page, ADMIN);
    await englisch(page).click();

    await page.getByRole('button', { name: 'User menu' }).click();
    await page.getByRole('menuitem', { name: 'Sign out' }).click();

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { name: 'Welcome to CheckIn' })).toBeVisible();
  });
});
