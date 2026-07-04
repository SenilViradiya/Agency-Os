import { test, expect } from '@playwright/test';
import { expectModalVisible, confirmModal } from '../../helpers/antd';

test.describe('Auth Module - Login Flow', () => {

  test.describe('Happy Path', () => {
    test('should log in successfully as admin and redirect to dashboard', async ({ page }) => {
      await page.goto('/login');
      await page.getByPlaceholder('Email Address').fill('admin@agencyos.com');
      await page.getByPlaceholder('Password').fill('Admin@123');
      await page.getByRole('button', { name: 'Sign In' }).click();
      await expect(page).toHaveURL(/\/dashboard|dashboard/);
    });

    test('should log in successfully as manager and redirect to dashboard', async ({ page }) => {
      await page.goto('/login');
      await page.getByPlaceholder('Email Address').fill('manager@agencyos.com');
      await page.getByPlaceholder('Password').fill('Admin@123');
      await page.getByRole('button', { name: 'Sign In' }).click();
      await expect(page).toHaveURL(/\/dashboard|dashboard/);
    });

    test('should log in successfully as editor and redirect to dashboard', async ({ page }) => {
      await page.goto('/login');
      await page.getByPlaceholder('Email Address').fill('editor@agencyos.com');
      await page.getByPlaceholder('Password').fill('Admin@123');
      await page.getByRole('button', { name: 'Sign In' }).click();
      await expect(page).toHaveURL(/\/dashboard|dashboard/);
    });

    test('should log in successfully as client and redirect to portal dashboard', async ({ page }) => {
      await page.goto('/portal-login');
      await page.getByPlaceholder('Email Address').fill('client@samplebrand.com');
      await page.getByPlaceholder('Password').fill('Client@123');
      await page.getByRole('button', { name: 'Sign In' }).click();
      await expect(page).toHaveURL(/\/portal/);
    });

    test('should log out successfully from dashboard and redirect back to login', async ({ page }) => {
      await page.goto('/login');
      await page.getByPlaceholder('Email Address').fill('editor@agencyos.com');
      await page.getByPlaceholder('Password').fill('Admin@123');
      await page.getByRole('button', { name: 'Sign In' }).click();
      await page.waitForURL(/\/dashboard|dashboard/);
      
      // Look for the Logout button by its icon (.anticon-logout), text, or surrounding elements
      const logoutBtn = page.locator('.ant-btn').filter({ has: page.locator('.anticon-logout') })
        .or(page.getByRole('button', { name: /Logout|Sign Out/i }))
        .or(page.locator('a, span, li, button').filter({ hasText: /Logout|Sign Out/i }));
      
      await expect(logoutBtn.first()).toBeVisible({ timeout: 15000 });
      await logoutBtn.first().click({ force: true });
      
      // Handle Ant Design confirm modal safely by waiting for the confirm button to become visible
      const confirmBtn = page.locator('.ant-modal-confirm-btns button, .ant-modal button').filter({ hasText: /Log Out/i }).first();
      await confirmBtn.waitFor({ state: 'visible', timeout: 10000 });
      await confirmBtn.click();
      
      await page.waitForURL(/\/login/, { timeout: 15000 });
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe('Error Cases', () => {
    test('should show error for invalid email format', async ({ page }) => {
      await page.goto('/login');
      await page.getByPlaceholder('Email Address').fill('invalidemail');
      await page.getByPlaceholder('Password').fill('Admin@123');
      await page.getByRole('button', { name: 'Sign In' }).click();
      await expect(page.locator('.ant-form-item-explain-error')).toHaveText(/Invalid email address/i);
    });

    test('should show error for incorrect password', async ({ page }) => {
      await page.goto('/login');
      await page.getByPlaceholder('Email Address').fill('admin@agencyos.com');
      await page.getByPlaceholder('Password').fill('WrongPassword123');
      await page.getByRole('button', { name: 'Sign In' }).click();
      await expect(page.locator('.ant-alert').or(page.locator('.ant-message'))).toContainText(/Invalid email or password/i);
    });

    test('should show error for non-existent user email', async ({ page }) => {
      await page.goto('/login');
      await page.getByPlaceholder('Email Address').fill('nonexistent@agencyos.com');
      await page.getByPlaceholder('Password').fill('Admin@123');
      await page.getByRole('button', { name: 'Sign In' }).click();
      await expect(page.locator('.ant-alert').or(page.locator('.ant-message'))).toContainText(/Invalid email or password/i);
    });

    test('should show error for empty fields submission', async ({ page }) => {
      await page.goto('/login');
      await page.getByRole('button', { name: 'Sign In' }).click();
      await expect(page.locator('.ant-form-item-explain-error').first()).toBeVisible();
    });

    test('should show error for client login on internal login page', async ({ page }) => {
      await page.goto('/login');
      await page.getByPlaceholder('Email Address').fill('client@samplebrand.com');
      await page.getByPlaceholder('Password').fill('Client@123');
      await page.getByRole('button', { name: 'Sign In' }).click();
      await expect(page.locator('.ant-alert').or(page.locator('.ant-message'))).toContainText(/Invalid email or password/i);
    });
  });

  test.describe('Edge Cases', () => {
    test('should handle forgot password alert popup modal checks', async ({ page }) => {
      await page.goto('/login');
      await page.locator('text=Forgot password?').click();
      await expectModalVisible(page, 'Forgot your password?');
      await confirmModal(page, 'Forgot your password?');
    });

    test('should allow toggling password field visibility', async ({ page }) => {
      await page.goto('/login');
      const passwordInput = page.getByPlaceholder('Password');
      await passwordInput.fill('Admin@123');
      await expect(passwordInput).toHaveAttribute('type', 'password');
      await page.locator('.ant-input-password-icon').first().click();
      await expect(passwordInput).toHaveAttribute('type', 'text');
    });

    test('should handle portal forgot password alert popup modal checks', async ({ page }) => {
      await page.goto('/portal-login');
      await page.locator('text=Forgot password?').click();
      await expectModalVisible(page, 'Forgot your password?');
      await confirmModal(page, 'Forgot your password?');
    });

    test('should handle email case-insensitivity on teams login', async ({ page }) => {
      await page.goto('/login');
      await page.getByPlaceholder('Email Address').fill('ADMIN@AGENCYOS.COM');
      await page.getByPlaceholder('Password').fill('Admin@123');
      await page.getByRole('button', { name: 'Sign In' }).click();
      await expect(page).toHaveURL(/\/dashboard|dashboard/);
    });

    test('should handle email case-insensitivity on portal login', async ({ page }) => {
      await page.goto('/portal-login');
      await page.getByPlaceholder('Email Address').fill('CLIENT@SAMPLEBRAND.COM');
      await page.getByPlaceholder('Password').fill('Client@123');
      await page.getByRole('button', { name: 'Sign In' }).click();
      await expect(page).toHaveURL(/\/portal/);
    });
  });

  test.describe('Permission Checks', () => {
    test('should block unauthenticated users from accessing dashboard pages', async ({ page }) => {
      await page.goto('/dashboard');
      // Should redirect to login page
      await expect(page).toHaveURL(/.*login/);
    });

    test('should block client users from accessing internal admin routes directly', async ({ page }) => {
      await page.goto('/portal-login');
      await page.getByPlaceholder('Email Address').fill('client@samplebrand.com');
      await page.getByPlaceholder('Password').fill('Client@123');
      await page.getByRole('button', { name: 'Sign In' }).click();
      await page.waitForURL(/\/portal/);
      
      await page.goto('/dashboard');
      await expect(page).not.toHaveURL(/\/dashboard/);
    });

    test('should block team members from accessing client portal base routes directly', async ({ page }) => {
      await page.goto('/login');
      await page.getByPlaceholder('Email Address').fill('admin@agencyos.com');
      await page.getByPlaceholder('Password').fill('Admin@123');
      await page.getByRole('button', { name: 'Sign In' }).click();
      await page.waitForURL(/\/dashboard|dashboard/);

      await page.goto('/portal');
      await expect(page).not.toHaveURL(/\/portal$/);
    });

    test('should enforce rate limit message handles gracefully if redis rate limit is disabled', async ({ page }) => {
      test.skip(!process.env.UPSTASH_REDIS_REST_URL, 'Rate limiting not configured');
      // Trigger multiple fast clicks or requests to api
      for (let i = 0; i < 20; i++) {
        await page.goto('/api/users');
      }
      const response = await page.goto('/api/users');
      expect(response?.status()).toBe(429);
    });

    test('should redirect unauthenticated users back to login when accessing nested dashboard routes', async ({ page }) => {
      await page.goto('/leads');
      await expect(page).toHaveURL(/.*login/);
    });
  });

});
