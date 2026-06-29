import { test, expect } from '@playwright/test';

/**
 * E2E del flujo principal del slice 1 (tarea 16, Req 11.4): Home → Work →
 * Case study, navegando como un usuario real (clicks sobre enlaces, no gotos),
 * para validar el arco narrativo (design.md §4.6) end-to-end.
 *
 * Se cubre el idioma por defecto `/es` (flujo completo) y se verifica que el
 * mismo recorrido funciona en `/en`, ya que el slice 1 entrega i18n real
 * (Req 8.1) y el switch de idioma comparte slug de case study.
 */

test.describe('Flujo Home → Work → Case study (es)', () => {
  test('navega de la home al índice de Work y a un case study', async ({ page }) => {
    // 1. Home: el opening (Hero) se renderiza con su declaración (h1).
    await page.goto('/es/');
    await expect(page).toHaveURL(/\/es\/?$/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // 2. Home → Work: el CTA "Ver proyectos" lleva al índice editorial.
    await page.getByRole('link', { name: /ver proyectos/i }).first().click();
    await page.waitForURL('**/es/work');
    await expect(page).toHaveURL(/\/es\/work\/?$/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // El índice lista al menos un case study (Chromora, el del slice 1).
    const caseLink = page.getByRole('link', { name: /chromora/i }).first();
    await expect(caseLink).toBeVisible();

    // 3. Work → Case study: abre el detalle con URL propia por proyecto.
    await caseLink.click();
    await page.waitForURL('**/es/work/chromora');
    await expect(page).toHaveURL(/\/es\/work\/chromora\/?$/);

    // El detalle muestra el título del proyecto como h1 (página real, no modal).
    await expect(
      page.getByRole('heading', { level: 1, name: /chromora/i }),
    ).toBeVisible();

    // 4. Continuidad de navegación: el enlace "Volver a proyectos" regresa al índice.
    await page.getByRole('link', { name: 'Volver a proyectos' }).click();
    await page.waitForURL('**/es/work');
    await expect(page).toHaveURL(/\/es\/work\/?$/);
  });
});

test.describe('Flujo Home → Work → Case study (en)', () => {
  test('el mismo recorrido funciona en inglés', async ({ page }) => {
    await page.goto('/en/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    await page.getByRole('link', { name: 'View work' }).first().click();
    await page.waitForURL('**/en/work');
    await expect(page).toHaveURL(/\/en\/work\/?$/);

    const caseLink = page.getByRole('link', { name: /chromora/i }).first();
    await expect(caseLink).toBeVisible();
    await caseLink.click();
    await page.waitForURL('**/en/work/chromora');
    await expect(
      page.getByRole('heading', { level: 1, name: /chromora/i }),
    ).toBeVisible();
  });
});
