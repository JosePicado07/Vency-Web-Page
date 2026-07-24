import { test, expect } from '@playwright/test';

test.describe('Admin selección de categoría y género', () => {

  test('selects existen y tienen wrapper .sol-select-wrap', async ({ page }) => {
    await page.goto('/admin.html');

    // Add form selects
    const addCatWrap = page.locator('#js-add-frag-form .sol-select-wrap').nth(0);
    const addGenderWrap = page.locator('#js-add-frag-form .sol-select-wrap').nth(1);
    await expect(addCatWrap.locator('select#add-cat')).toBeAttached();
    await expect(addGenderWrap.locator('select#add-gender')).toBeAttached();

    // Edit modal selects
    const editCatWrap = page.locator('#js-sol-modal .sol-select-wrap').nth(0);
    const editGenderWrap = page.locator('#js-sol-modal .sol-select-wrap').nth(1);
    await expect(editCatWrap.locator('select#sol-edit-cat')).toBeAttached();
    await expect(editGenderWrap.locator('select#sol-edit-gender')).toBeAttached();

    // Verify wrappers render the ::after arrow (check computed style)
    const arrow = editCatWrap;
    const display = await arrow.evaluate(el => getComputedStyle(el, '::after').content);
    expect(display).not.toBe('none');
  });

  test('selects tienen min-height 44px en mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/admin.html');

    const select = page.locator('#add-cat');
    const minH = await select.evaluate(el => getComputedStyle(el).minHeight);
    expect(parseInt(minH)).toBeGreaterThanOrEqual(44);
  });

  test('sol-add-row--2col se apila en columna en mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    await page.goto('/admin.html');

    const row = page.locator('.sol-add-row--2col').first();
    const cols = await row.evaluate(el => getComputedStyle(el).gridTemplateColumns);
    expect(cols).toBe('1fr');
  });

});
