import { expect } from '@playwright/test';

// Demo-Zugänge aus den Seed-Daten (nur in der Umgebung "Development" vorhanden).
export const ADMIN = { email: 'admin@checkin.de', password: 'Admin123!' };
export const MITARBEITER = { email: 'l.mueller@checkin.de', password: 'Passwort123!' };

// Beschriftungen der Anmeldeseite je Sprache
const ANMELDUNG = {
  de: { password: 'Passwort', submit: 'Einloggen' },
  en: { password: 'Password', submit: 'Sign in' },
};

// Stellt die Sprache vor dem ersten Laden ein (so wie der Schalter sie im Browser speichert).
// Gilt bei jedem Laden dieser Seite, zum Prüfen des Schalters selbst bitte den Schalter klicken.
export async function setLanguage(page, lang) {
  await page.addInitScript((l) => window.localStorage.setItem('checkin.lang', l), lang);
}

export async function login(page, { email, password }, lang = 'de') {
  if (lang !== 'de') await setLanguage(page, lang);
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel(ANMELDUNG[lang].password).fill(password);
  await page.getByRole('button', { name: ANMELDUNG[lang].submit }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

// Die Seite rendert Haupt- und Tab-Navigation, nur eine davon ist sichtbar.
export const hauptnavigation = (page, lang = 'de') =>
  page.getByRole('navigation', { name: lang === 'de' ? 'Hauptnavigation' : 'Main navigation', exact: true });
