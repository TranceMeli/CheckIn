import AxeBuilder from '@axe-core/playwright';
import { test, expect } from '@playwright/test';
import { ADMIN, MITARBEITER, login, setLanguage } from './helpers.js';

// Automatische Prüfung gegen WCAG 2.0/2.1 Level A und AA. axe findet nur einen Teil der Probleme,
// Tastatur- und Screenreader-Bedienung müssen weiterhin von Hand geprüft werden.
const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

async function pruefe(page) {
  // Diagramme laden Daten nach; erst scannen, wenn die Seite ruhig ist.
  await page.waitForLoadState('networkidle');
  const { violations } = await new AxeBuilder({ page }).withTags(WCAG).analyze();
  const zusammenfassung = violations.map(
    (v) => `${v.id} (${v.impact}): ${v.help}\n    ${v.nodes.slice(0, 4).map((n) => `${n.target.join(' ')}${n.any[0] ? ' - ' + n.any[0].message : ''}`).join('\n    ')}`,
  );
  expect(zusammenfassung, 'axe-Verstöße').toEqual([]);
}

test.describe('Accessibility (axe, WCAG 2.1 AA)', () => {
  for (const [name, pfad] of [
    ['Login', '/login'],
    ['Imprint', '/impressum'],
    ['Privacy policy', '/datenschutz'],
  ]) {
    test(`${name} (signed out)`, async ({ page }) => {
      await page.goto(pfad);
      await pruefe(page);
    });
  }

  for (const [name, pfad] of [
    ['Dashboard', '/dashboard'],
    ['Manage', '/manage'],
    ['Export', '/list'],
  ]) {
    test(`Admin: ${name}`, async ({ page }) => {
      await login(page, ADMIN);
      await page.goto(pfad);
      await pruefe(page);
    });
  }

  for (const [name, pfad] of [
    ['Statistics', '/dashboard'],
    ['Check-in', '/checkin'],
  ]) {
    test(`Employee: ${name}`, async ({ page }) => {
      await login(page, MITARBEITER);
      await page.goto(pfad);
      await pruefe(page);
    });
  }
});

// Unter 900px wechselt die Navigation zur Tab-Leiste, die eigene Farben und Layout hat.
test.describe('Accessibility on a phone (390 px)', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('Admin: dashboard', async ({ page }) => {
    await login(page, ADMIN);
    await pruefe(page);
  });

  test('Employee: check-in', async ({ page }) => {
    await login(page, MITARBEITER);
    await page.goto('/checkin');
    await pruefe(page);
  });
});

// Die englischen Texte haben eigene Längen und Farben-Kontraste (z. B. in den Diagrammen), deshalb ebenfalls prüfen.
test.describe('Accessibility in English', () => {
  for (const [name, pfad] of [
    ['Login', '/login'],
    ['Imprint', '/impressum'],
    ['Privacy policy', '/datenschutz'],
  ]) {
    test(`${name} (signed out)`, async ({ page }) => {
      await setLanguage(page, 'en');
      await page.goto(pfad);
      await pruefe(page);
    });
  }

  for (const [name, pfad] of [
    ['Dashboard', '/dashboard'],
    ['Manage', '/manage'],
    ['Export', '/list'],
  ]) {
    test(`Admin: ${name}`, async ({ page }) => {
      await login(page, ADMIN, 'en');
      await page.goto(pfad);
      await pruefe(page);
    });
  }

  for (const [name, pfad] of [
    ['Statistics', '/dashboard'],
    ['Check-in', '/checkin'],
  ]) {
    test(`Employee: ${name}`, async ({ page }) => {
      await login(page, MITARBEITER, 'en');
      await page.goto(pfad);
      await pruefe(page);
    });
  }
});
