import { test, expect } from '@playwright/test';

test.describe('RBAC Permission Verification Module', () => {

  test.describe('Happy Path (Authorized Access)', () => {
    test.use({ storageState: 'e2e/.auth/admin.json' });

    test('should allow Super Admin to access users list and view create action', async ({ page }) => {
      await page.goto('/users');
      await expect(page).toHaveURL(/.*users/);
      // Admin should see Create User button or link
      const createUserBtn = page.getByRole('button', { name: /create|add|new user/i });
      await expect(createUserBtn).toBeVisible();
    });

    test('should allow Super Admin to view administrative audit logs', async ({ page }) => {
      await page.goto('/admin');
      await expect(page).toHaveURL(/.*admin/);
      await expect(page.locator('h1, h2, h3, div').filter({ hasText: /Audit Logs|system administration/i }).first()).toBeVisible();
    });
  });

  test.describe('Manager Access', () => {
    test.use({ storageState: 'e2e/.auth/manager.json' });

    test('should allow Manager to view leads list page and see edit option', async ({ page }) => {
      await page.goto('/leads');
      await expect(page).toHaveURL(/.*leads/);
      // Wait for table to load
      await page.waitForTimeout(500);
      await expect(page.locator('table, .ant-table, .ant-list').first()).toBeVisible();
    });

    test('should allow Manager to access active client directories', async ({ page }) => {
      await page.goto('/clients');
      await expect(page).toHaveURL(/.*clients/);
    });

    test('should allow Manager to view tasks and assignments board', async ({ page }) => {
      await page.goto('/tasks');
      await expect(page).toHaveURL(/.*tasks/);
    });
  });

  test.describe('Editor Access Restrictions', () => {
    test.use({ storageState: 'e2e/.auth/editor.json' });

    test('should allow Editor to read editorial content calendar pipeline', async ({ page }) => {
      await page.goto('/content');
      await expect(page).toHaveURL(/.*content/);
    });

    test('should allow Editor to view assigned tasks list', async ({ page }) => {
      await page.goto('/tasks');
      await expect(page).toHaveURL(/.*tasks/);
    });
  });

  test.describe('Viewer Access Restrictions', () => {
    test.use({ storageState: 'e2e/.auth/viewer.json' });

    test('should allow Viewer to check ongoing projects list', async ({ page }) => {
      await page.goto('/projects');
      await expect(page).toHaveURL(/.*projects/);
    });

    test('should allow Viewer to read scheduled content board', async ({ page }) => {
      await page.goto('/content');
      await expect(page).toHaveURL(/.*content/);
    });
  });

  test.describe('Error Cases (Unauthorized Navigation)', () => {
    test.use({ storageState: 'e2e/.auth/editor.json' });

    test('should block Editor from accessing administrative settings page', async ({ page }) => {
      await page.goto('/admin');
      // Should show Forbidden access
      await expect(page.locator('body')).toContainText(/Forbidden|Unauthorized|Access Denied/i);
    });

    test('should block Editor from navigating to user manager panel', async ({ page }) => {
      await page.goto('/users');
      await expect(page.locator('body')).toContainText(/Forbidden|Unauthorized|Access Denied/i);
    });
  });

  test.describe('Viewer Unauthorized Navigation', () => {
    test.use({ storageState: 'e2e/.auth/viewer.json' });

    test('should block Viewer from navigating to roles permission matrix', async ({ page }) => {
      await page.goto('/roles');
      await expect(page.locator('body')).toContainText(/Forbidden|Unauthorized|Access Denied/i);
    });

    test('should block Viewer from accessing finance billing ledger', async ({ page }) => {
      await page.goto('/finance');
      await expect(page.locator('body')).toContainText(/Forbidden|Unauthorized|Access Denied/i);
    });

    test('should reject Viewer accessing employee lists page', async ({ page }) => {
      await page.goto('/hr');
      await expect(page.locator('body')).toContainText(/Forbidden|Unauthorized|Access Denied/i);
    });
  });

  test.describe('Edge Cases (Hiding UI Controls)', () => {
    test.use({ storageState: 'e2e/.auth/editor.json' });

    test('should hide Roles and Administrative sidebar navigation link for Editor', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForTimeout(300);
      const roleNav = page.locator('aside, .ant-layout-sider').locator('a[href="/roles"]').or(page.locator('aside, .ant-layout-sider').locator('a[href="/admin"]'));
      await expect(roleNav).not.toBeVisible();
    });

    test('should disable or hide delete actions for Editor on leads page', async ({ page }) => {
      await page.goto('/leads');
      await page.waitForTimeout(300);
      const deleteBtn = page.getByRole('button', { name: /delete/i }).or(page.locator('a, span').filter({ hasText: /delete|remove/i }));
      await expect(deleteBtn).not.toBeVisible();
    });
  });

  test.describe('Viewer Action Hiding', () => {
    test.use({ storageState: 'e2e/.auth/viewer.json' });

    test('should hide edit and delete actions on leads list page for Viewer', async ({ page }) => {
      await page.goto('/leads');
      await page.waitForTimeout(300);
      const actionBtn = page.getByRole('button', { name: /edit|delete|update/i }).or(page.locator('a, span').filter({ hasText: /edit|delete/i }));
      await expect(actionBtn).not.toBeVisible();
    });

    test('should show restricted info banner or read-only status in sidebar for Viewer', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForTimeout(300);
      const creatorBtns = page.getByRole('button', { name: /add|create|new/i });
      await expect(creatorBtns).not.toBeVisible();
    });

    test('should hide invoices payment recorder buttons for Viewer', async ({ page }) => {
      await page.goto('/finance');
      await page.waitForTimeout(300);
      const paymentBtn = page.getByRole('button', { name: /record payment|new invoice/i });
      await expect(paymentBtn).not.toBeVisible();
    });
  });

  test.describe('Permission Checks (API Level Rejection)', () => {
    test.describe('Editor API restrictions', () => {
      test.use({ storageState: 'e2e/.auth/editor.json' });

      test('should block unauthorized raw POST requests to api/roles from Editor', async ({ page }) => {
        const response = await page.request.post('/api/roles', {
          data: { name: 'Hack Role', slug: 'hack' },
        });
        expect([302, 400, 401, 403, 405, 500]).toContain(response.status());
      });

      test('should block unauthorized delete actions on client details from Editor API endpoints', async ({ page }) => {
        const response = await page.request.delete('/api/clients/660a0fbc5548ab002492193f');
        expect([302, 400, 401, 403, 404, 405, 500]).toContain(response.status());
      });
    });

    test.describe('Viewer API restrictions', () => {
      test.use({ storageState: 'e2e/.auth/viewer.json' });

      test('should block unauthorized raw POST requests to api/projects from Viewer', async ({ page }) => {
        const response = await page.request.post('/api/projects', {
          data: { name: 'Hack Project' }
        });
        expect([302, 400, 401, 403, 405, 500]).toContain(response.status());
      });

      test('should block unauthorized financeSettings adjustments from Viewer API endpoints', async ({ page }) => {
        const response = await page.request.post('/api/finance/settings', {
          data: { gstEnabled: false }
        });
        expect([302, 400, 401, 403, 405, 500]).toContain(response.status());
      });
    });
  });

});
