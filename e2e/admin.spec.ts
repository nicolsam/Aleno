import { test, expect } from '@playwright/test';
import { login } from './utils';

test.describe('Admin Access Control', () => {
  test('regular user cannot access admin dashboard', async ({ page }) => {
    await login(page, 'test-regular@example.com');

    // Verify "Admin Panel" link is not present
    await expect(page.getByRole('link', { name: 'Admin Panel' })).not.toBeVisible();

    // Try to force access via URL
    await page.goto('/dashboard/admin');
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator('text=System Administration')).not.toBeVisible();
  });

  test('admin user can access admin dashboard', async ({ page }) => {
    await login(page, 'test-admin@example.com');

    // Verify "Admin Panel" link IS present
    const adminLink = page.getByRole('link', { name: 'Admin Panel' });
    await expect(adminLink).toBeVisible();

    // Click it and verify navigation
    await adminLink.click();
    await expect(page).toHaveURL(/\/dashboard\/admin/);
    
    // Verify the admin content actually loads
    await expect(page.locator('text=System Administration')).toBeVisible();
    await expect(page.locator('text=Session Monitor')).toBeVisible();
  });
});
