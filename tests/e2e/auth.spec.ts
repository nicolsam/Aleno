import { test, expect } from '@playwright/test';
import { login } from './utils';

test.describe('Authentication Flow', () => {
  test('should login successfully and redirect to dashboard', async ({ page }) => {
    await login(page, 'test-regular@example.com');
    
    // Check if user's name appears in the sidebar
    await expect(page.locator('text=E2E Regular Teacher')).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    await login(page, 'test-regular@example.com');

    // The logout text changes based on locale, so we look for either
    const logoutBtn = page.locator('button', { hasText: /Logout|Sair/i });
    await expect(logoutBtn).toBeVisible();
    await logoutBtn.click();

    // Should be back at login
    await expect(page).toHaveURL(/\/login/);
  });
});
