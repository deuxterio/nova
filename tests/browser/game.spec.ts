import { expect, test, type Page } from '@playwright/test';

async function startTutorial(page: Page) {
  await page.getByRole('button', { name: 'Iniciar expedición' }).click();
  await page.getByRole('button', { name: 'Omitir introducción' }).click();
  await expect(page.getByRole('heading', { name: 'Leviatán de los Mil Archivos' })).toBeVisible();
}
async function select(page: Page, size: string, effort: string) {
  await page.locator(`#size-${size}`).click(); await page.locator(`#effort-${effort}`).click();
  await page.locator('#execute-button').click();
  await expect(page.locator('#result-next')).toBeEnabled();
}
async function noOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
}

test('plays the tutorial, scans, restores a result and earns three stars', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Tu criterio. Toda una galaxia.' })).toBeVisible();
  await expect(page.locator('#space-slot canvas')).toHaveCount(1);
  await expect(page.locator('#space-slot canvas')).toHaveAttribute('data-ready', 'true');
  await page.screenshot({ path: 'test-results/home-desktop.png', fullPage: true });
  await startTutorial(page);
  await expect(page.locator('#execute-button')).toBeDisabled();
  await select(page, 'light', 'low');
  await expect(page.locator('#energy-value')).toContainText('97');
  await expect(page.getByRole('heading', { name: 'Sistema recuperado' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Sistema recuperado' })).toBeVisible();
  await expect(page.locator('#energy-value')).toContainText('97');
  await page.getByRole('button', { name: 'Siguiente encuentro' }).click();
  await select(page, 'medium', 'low');
  await page.getByRole('button', { name: 'Siguiente encuentro' }).click();
  await page.getByRole('button', { name: 'Escanear / pedir datos' }).click();
  await expect(page.getByText('La nave llega al punto de partida a las 15:00. La ruta A ya habrá salido.')).toBeVisible();
  await select(page, 'medium', 'medium');
  await page.getByRole('button', { name: 'Siguiente encuentro' }).click();
  await page.screenshot({ path: 'test-results/battle-desktop.png', fullPage: true });
  await select(page, 'ultra', 'high');
  await page.getByRole('button', { name: 'Ver mi expedición' }).click();
  await expect(page.getByLabel('3 de 3 estrellas')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Fragmento del portal' })).toBeVisible();
  await page.screenshot({ path: 'test-results/summary-desktop.png', fullPage: true });
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('nova-arena:progress:v1')!));
  expect(saved.active.energy).toBe(52); expect(saved.completed).toBe(1); expect(saved.tutorialCompleted).toBe(true);
  await page.getByRole('button', { name: 'Volver a la nave' }).click();
  await expect(page.getByText('1 expedición · Mejor resultado: 3/3 estrellas')).toBeVisible();
  await noOverflow(page);
  expect(errors).toEqual([]);
});

test('retains choices after failure and charges missing data exactly once', async ({ page }) => {
  await page.goto('/'); await startTutorial(page);
  await select(page, 'light', 'low'); await page.locator('#result-next').click();
  await select(page, 'light', 'high');
  await expect(page.getByRole('heading', { name: 'Resultado incompleto' })).toBeVisible();
  await page.getByRole('button', { name: 'Ajustar y reintentar' }).click();
  await expect(page.locator('#size-light')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#effort-high')).toHaveAttribute('aria-pressed', 'true');
  await select(page, 'medium', 'low'); await page.locator('#result-next').click();
  await select(page, 'ultra', 'high');
  await expect(page.getByRole('heading', { name: 'Faltan datos' })).toBeVisible();
  await expect(page.locator('#energy-value')).toContainText('55');
  await page.getByRole('button', { name: 'Volver y pedir datos' }).click();
  await page.getByRole('button', { name: 'Escanear / pedir datos' }).click();
  await expect(page.locator('#energy-value')).toContainText('55');
  await select(page, 'medium', 'medium'); await page.locator('#result-next').click();
  await select(page, 'ultra', 'high'); await page.locator('#result-next').click();
  await expect(page.getByLabel('1 de 3 estrellas')).toBeVisible();
});

test('finishes with only the keyboard at 320px and reduced motion', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/'); await noOverflow(page);
  await page.screenshot({ path: 'test-results/home-mobile.png', fullPage: true });
  async function activate(selector: string) {
    for (let i = 0; i < 55; i++) {
      const focused = await page.evaluate(s => document.activeElement?.matches(s) ?? false, selector);
      if (focused) { await page.keyboard.press('Enter'); return; }
      await page.keyboard.press('Tab');
    }
    throw new Error(`Cannot reach ${selector} with Tab`);
  }
  await activate('[data-action="play"]'); await activate('[data-action="intro-skip"]');
  for (const [index, [size, effort]] of [['light', 'low'], ['medium', 'low'], ['medium', 'medium'], ['ultra', 'high']].entries()) {
    await noOverflow(page);
    if (index === 2) await activate('#scan-button');
    await activate(`#size-${size}`); await activate(`#effort-${effort}`);
    if (index === 2) await page.screenshot({ path: 'test-results/battle-mobile.png', fullPage: true });
    await activate('#execute-button'); await expect(page.locator('#result-next')).toBeEnabled();
    await noOverflow(page); await activate('#result-next');
  }
  await expect(page.getByLabel('3 de 3 estrellas')).toBeVisible(); await noOverflow(page);
});

test('reconstructs challenges, rejects incompatible versions and confirms deletion', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '¿Tienes un código de desafío?' }).click();
  await page.getByLabel('Código de desafío').fill('NOVA2-P-1234ABCD');
  await page.getByRole('button', { name: 'Abrir desafío' }).click();
  await expect(page.getByRole('alert')).toContainText('otra versión');
  await page.getByLabel('Código de desafío').fill('NOVA1-P-1234ABCD');
  await page.getByRole('button', { name: 'Abrir desafío' }).click();
  const first = await page.evaluate(() => JSON.parse(localStorage.getItem('nova-arena:progress:v1')!).active.encounters);
  await page.getByRole('button', { name: 'Reiniciar' }).click();
  await page.getByRole('button', { name: 'Cancelar' }).click();
  await page.getByRole('button', { name: 'Ajustes', exact: true }).click();
  await page.getByLabel('Movimiento reducido', { exact: false }).check();
  await page.getByRole('button', { name: 'Borrar todo el progreso' }).click();
  await expect(page.getByRole('dialog')).toContainText('Esta acción no se puede deshacer');
  await page.getByRole('button', { name: 'Cancelar' }).click();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('nova-arena:progress:v1')!).active.encounters)).toEqual(first);
  await page.getByRole('button', { name: 'Ajustes', exact: true }).click();
  await page.getByRole('button', { name: 'Borrar todo el progreso' }).click();
  await page.getByRole('button', { name: 'Sí, borrar todo' }).click();
  await expect(page.getByRole('heading', { name: 'Tu criterio. Toda una galaxia.' })).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('nova-arena:progress:v1')!).active)).toBeNull();
});

test('works without local storage and never sends gameplay data to a backend', async ({ page }) => {
  const requests: string[] = [];
  await page.addInitScript(() => Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('Blocked', 'SecurityError'); } }));
  page.on('request', request => requests.push(request.url()));
  await page.goto('/');
  await expect(page.getByText('El progreso se conserva solo en esta sesión: el almacenamiento local no está disponible.')).toBeVisible();
  await startTutorial(page); await select(page, 'light', 'low');
  await expect(page.getByRole('heading', { name: 'Sistema recuperado' })).toBeVisible();
  expect(requests.every(url => url.startsWith('http://127.0.0.1:5173/') || url.startsWith('data:'))).toBe(true);
});
