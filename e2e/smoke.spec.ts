import { test, expect } from '@playwright/test';

/**
 * Smoke test E2E de la fundación (tarea 1): confirma que Playwright levanta
 * el dev server de Astro y carga la home. Con el i18n routing real (tarea 5),
 * la home vive en `/es`; la raíz `/` redirige allí. El flujo real
 * Home→Work→Case study se cubre en la tarea 16.
 */
test('home placeholder se renderiza', async ({ page }) => {
  await page.goto('/es/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});

test('la raíz redirige al idioma por defecto (/es)', async ({ page }) => {
  await page.goto('/');
  await page.waitForURL('**/es/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});
