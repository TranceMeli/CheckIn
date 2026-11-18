import { expect } from '@playwright/test';

// Demo-Zugänge aus den Seed-Daten (nur in der Umgebung "Development" vorhanden).
export const ADMIN = { email: 'admin@checkin.de', password: 'Admin123!' };
export const MITARBEITER = { email: 'l.mueller@checkin.de', password: 'Passwort123!' };

export async function login(page, { email, password }) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Passwort').fill(password);
  await page.getByRole('button', { name: 'Einloggen' }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

// Die Seite rendert Haupt- und Tab-Navigation, nur eine davon ist sichtbar.
export const hauptnavigation = (page) =>
  page.getByRole('navigation', { name: 'Hauptnavigation', exact: true });
