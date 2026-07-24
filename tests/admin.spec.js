import { test, expect } from '@playwright/test';

test.describe('Admin selección de categoría y género', () => {

  test('custom selects existen con vency-select', async ({ page }) => {
    await page.goto('/admin.html');

    // Add form custom selects
    const addCatSelect = page.locator('#js-add-frag-form .vency-select[data-name="cat"]');
    const addGenderSelect = page.locator('#js-add-frag-form .vency-select[data-name="gender"]');
    await expect(addCatSelect.locator('.vency-select__btn')).toBeAttached();
    await expect(addGenderSelect.locator('.vency-select__btn')).toBeAttached();

    // Edit modal custom selects
    const editCatSelect = page.locator('#js-sol-modal .vency-select[data-name="cat"]');
    const editGenderSelect = page.locator('#js-sol-modal .vency-select[data-name="gender"]');
    await expect(editCatSelect.locator('.vency-select__btn')).toBeAttached();
    await expect(editGenderSelect.locator('.vency-select__btn')).toBeAttached();

    // Verify chevron SVG in each select
    await expect(addCatSelect.locator('.vency-select__chevron')).toBeAttached();
  });

  test('custom selects tienen min-height 44px en mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/admin.html');

    const selectBtn = page.locator('.vency-select__btn').first();
    const minH = await selectBtn.evaluate(el => getComputedStyle(el).minHeight);
    expect(parseInt(minH)).toBeGreaterThanOrEqual(44);
  });

  test('sol-add-row--2col se apila en columna en mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    await page.goto('/admin.html');

    const row = page.locator('.sol-add-row--2col').first();
    const cols = await row.evaluate(el => getComputedStyle(el).gridTemplateColumns);
    expect(cols).toBe('1fr');
  });

  test('custom select tiene estructura correcta en DOM', async ({ page }) => {
    await page.goto('/admin.html');

    // Verify add form custom select structure (inside hidden app — DOM presence only)
    const catSelect = page.locator('#js-add-frag-form .vency-select[data-name="cat"]');
    await expect(catSelect.locator('.vency-select__btn')).toHaveAttribute('aria-haspopup', 'listbox');
    await expect(catSelect.locator('.vency-select__btn')).toHaveAttribute('aria-expanded', 'false');
    await expect(catSelect.locator('.vency-select__list')).toBeAttached();
    await expect(catSelect.locator('.vency-select__input')).toBeAttached();
    await expect(catSelect.locator('.vency-select__chevron')).toBeAttached();

    // Verify options exist
    const options = catSelect.locator('.vency-select__option');
    await expect(options).toHaveCount(3);
    await expect(options.nth(0)).toHaveAttribute('data-value', 'disenador');
    await expect(options.nth(1)).toHaveAttribute('data-value', 'nicho');
    await expect(options.nth(2)).toHaveAttribute('data-value', 'ultra-nicho');
  });

});
