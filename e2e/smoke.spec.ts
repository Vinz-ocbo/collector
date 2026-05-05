import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const TEST_EMAIL = 'e2e@test.local';
const TEST_PASSWORD = 'Strong123';

// Reset IndexedDB before any app script runs so each test starts as a
// first-time visitor (no onboarding flag, no users, no session).
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    try {
      indexedDB.deleteDatabase('tcg-collector');
      indexedDB.deleteDatabase('tcg-collector-mock-auth');
      sessionStorage.clear();
    } catch {
      // ignore
    }
  });
});

test('a first-time visitor lands on the onboarding flow', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /partout avec vous/i })).toBeVisible();
});

test('full first-launch flow: onboarding → signup → collection', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Continuer' }).click();
  await page.getByRole('button', { name: 'Continuer' }).click();
  await page.getByRole('button', { name: 'Commencer' }).click();

  await expect(page.getByRole('heading', { name: 'Bon retour' })).toBeVisible();
  await page.getByRole('link', { name: 'Inscription' }).click();

  await page.getByRole('textbox', { name: 'Email' }).fill(TEST_EMAIL);
  await page.getByLabel('Mot de passe').fill(TEST_PASSWORD);
  await page.getByLabel(/CGU/i).check();
  await page.getByRole('button', { name: 'Créer mon compte' }).click();

  await expect(page.getByRole('heading', { name: 'Ma collection' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Navigation principale' })).toBeVisible();
});

test('navigation between tabs works after sign-in', async ({ page }) => {
  await page.goto('/');
  await page
    .getByRole('button', { name: 'Commencer' })
    .click()
    .catch(async () => {
      // Skip onboarding via the "Passer →" link if the visible button is "Continuer"
      await page.getByRole('button', { name: /Passer/i }).click();
    });
  await page.getByRole('link', { name: 'Inscription' }).click();
  await page.getByRole('textbox', { name: 'Email' }).fill(TEST_EMAIL);
  await page.getByLabel('Mot de passe').fill(TEST_PASSWORD);
  await page.getByLabel(/CGU/i).check();
  await page.getByRole('button', { name: 'Créer mon compte' }).click();
  await expect(page.getByRole('heading', { name: 'Ma collection' })).toBeVisible();

  await page.getByRole('link', { name: 'Recherche' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Recherche' })).toBeVisible();
  await page.getByRole('link', { name: 'Profil' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Profil' })).toBeVisible();
});

test('login page has no critical accessibility violations', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Passer/i }).click();
  await expect(page.getByRole('heading', { name: 'Bon retour' })).toBeVisible();

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  expect(results.violations).toEqual([]);
});
