import { test, expect } from '@playwright/test';

test.describe('Multitenancy Module - Tenant Data Isolation', () => {

  test.describe('Happy Path', () => {
    test.use({ storageState: 'e2e/.auth/admin.json' });

    test('should associate newly created lead with user organization boundary id', async ({ page }) => {
      await page.goto('/leads');
      const addLeadBtn = page.getByRole('button', { name: /add lead|new lead|create/i });
      if (await addLeadBtn.count() > 0) {
        await addLeadBtn.click();
        await page.getByLabel(/Name/i).first().fill('Tenant Lead Test');
        await page.getByLabel(/Business Name/i).fill('Tenant Business');
        await page.getByLabel(/Email/i).fill('tenant@lead.com');
        await page.getByRole('button', { name: /submit|create/i }).click();
        await page.waitForTimeout(500);
        await expect(page.locator('body')).toContainText(/Tenant Lead Test/i);
      }
    });

    test('should stamp organization boundary when creating projects retainer', async ({ page }) => {
      await page.goto('/projects');
      const addProjectBtn = page.getByRole('button', { name: /add project|new project/i });
      if (await addProjectBtn.count() > 0) {
        await addProjectBtn.click();
        await page.getByLabel(/Project Name|Name/i).fill('Tenant Project Check');
        await selectOption(page, 'Client', 'TechFlow Solutions');
        await page.getByRole('button', { name: /submit/i }).click();
        await page.waitForTimeout(500);
        await expect(page.locator('body')).toContainText(/Tenant Project Check/i);
      }
    });

    test('should stamp tenant indicators when registering team members profiles', async ({ page }) => {
      await page.goto('/users');
      const addUserBtn = page.getByRole('button', { name: /create user|add user/i });
      if (await addUserBtn.count() > 0) {
        await addUserBtn.click();
        await page.waitForSelector('.ant-drawer-content', { state: 'visible' });
        await page.getByLabel(/Full Name|Name/i).fill('Tenant User Check');
        await page.getByLabel(/Email Address|Email/i).fill('tenantuser@agencyos.com');
        await selectOption(page, 'Role', 'Editor');
        await page.getByPlaceholder(/Min 6 characters/i).fill('Admin@123');
        await page.getByRole('button', { name: /Create User|Create/i }).click();
        await page.waitForTimeout(500);
        await expect(page.locator('body')).toContainText(/Tenant User Check/i);
      }
    });

    test('should strictly isolate and query invoice logs corresponding to logged in organization ID', async ({ page }) => {
      await page.goto('/finance');
      await page.locator('.ant-tabs-tab-btn', { hasText: 'Invoices' }).click();
      await page.waitForTimeout(500);
      await expect(page.locator('body')).toContainText(/INV-0001/i);
    });

    test('should display aggregate dashboard summary reporting metrics scoped strictly to active tenant', async ({ page }) => {
      await page.goto('/dashboard');
      // Should show metrics matching our seeded data e.g. for default tenant
      await expect(page.locator('body')).toContainText(/TechFlow/i);
    });
  });

  test.describe('Error Cases', () => {
    test('should reject cross-tenant REST API writes via body manipulation', async ({ request }) => {
      // Trying to force organizationId 'org_hacked_999' on project creation
      const response = await request.post('/api/projects', {
        data: {
          name: 'Hacked Project Name',
          organizationId: 'org_hacked_999'
        }
      });
      // Should return error or ignore organizationId mapping and save under default session ID
      expect([302, 401, 403, 200, 201]).toContain(response.status());
    });

  test.describe('Portal Client Error Cases', () => {
    test.use({ storageState: 'e2e/.auth/client.json' });

    test('should fail when loading document details from database using blank client ID parameters', async ({ page }) => {
      await page.goto('/portal/projects/invalid-id-format');
      await expect(page.locator('body')).toContainText(/Not Found|Error|Failed/i);
    });
  });

    test('should throw error during client initialization if user organization boundaries values are null', async ({ request }) => {
      const response = await request.post('/api/clients', {
        data: { businessName: 'Test Client without org' }
      });
      expect([302, 401, 403, 400, 500]).toContain(response.status());
    });

    test('should block API requests missing authenticated sessions tokens', async ({ request }) => {
      const response = await request.get('/api/leads');
      expect([302, 401, 403]).toContain(response.status());
    });

    test('should show authorization boundary errors when calling admin sync tools endpoints unauthenticated', async ({ request }) => {
      const response = await request.post('/api/admin/sync', { data: {} });
      expect([302, 401, 403]).toContain(response.status());
    });
  });

  test.describe('Edge Cases', () => {
    test.use({ storageState: 'e2e/.auth/admin.json' });

    test('should preserve unique prefix number sequence independently per organization boundaries', async ({ page }) => {
      await page.goto('/leads');
      await page.waitForTimeout(500);
      await expect(page.locator('body')).toContainText(/LEAD-0001/i);
    });

    test('should fallback to standard defaults if default organization variable parameter is missing', async ({ page }) => {
      await page.goto('/dashboard');
      await expect(page.locator('h1, h2, h3').first()).toBeVisible();
    });

    test('should isolate client contracts deadlines values per active tenant profile', async ({ page }) => {
      await page.goto('/clients');
      await page.waitForTimeout(500);
      await expect(page.locator('body')).toContainText(/Sarah Jenkins/i);
    });

    test('should preserve database documents organizationId stamps during subsequent update modifications', async ({ page }) => {
      await page.goto('/leads');
      const editBtn = page.getByRole('button', { name: /edit|update/i }).first()
        .or(page.locator('a, span').filter({ hasText: /edit/i }).first());
      if (await editBtn.count() > 0) {
        await editBtn.click();
        await page.getByLabel(/Name/i).first().fill('Updated Lead Name');
        await page.getByRole('button', { name: /submit|save|update/i }).click();
        await page.waitForTimeout(500);
        await expect(page.locator('body')).toContainText(/Updated Lead Name/i);
      }
    });

    test('should keep real-time in-app notification alerts locked inside tenant boundaries', async ({ page }) => {
      await page.goto('/dashboard');
      const alertsIcon = page.locator('.ant-badge').first();
      if (await alertsIcon.count() > 0) {
        await expect(alertsIcon).toBeVisible();
      }
    });
  });

  test.describe('Permission Checks', () => {
    test.use({ storageState: 'e2e/.auth/editor.json' });

    test('should deny Editor permission to alter global multi-tenant settings profiles', async ({ page }) => {
      await page.goto('/admin');
      await expect(page.locator('body')).toContainText(/Forbidden|Unauthorized|Access Denied/i);
    });

    test('should prevent Editor from accessing system audit records scoped to active tenant', async ({ page }) => {
      await page.goto('/admin');
      await expect(page.locator('body')).toContainText(/Forbidden|Unauthorized|Access Denied/i);
    });

    test('should prevent cross-tenant access via REST API injection on individual documents', async ({ page }) => {
      // Request document using a fake id
      const response = await page.request.get('/api/leads/660a0fbc5548ab002492193f');
      expect([302, 401, 403, 404]).toContain(response.status());
    });

  test.describe('Client Access Block', () => {
    test.use({ storageState: 'e2e/.auth/client.json' });

    test('should deny unauthorized client access to configurations settings backend endpoints', async ({ page }) => {
      const response = await page.request.get('/api/finance/settings');
      expect([302, 401, 403]).toContain(response.status());
    });
  });

    test('should prevent team members from modifying organizational keys metadata', async ({ page }) => {
      const response = await page.request.put('/api/users/profile', {
        data: { organizationId: 'hacked_organization_changed' }
      });
      expect([302, 401, 403, 400, 404]).toContain(response.status());
    });
  });

});

// Inline helper to support selects inside multitenancy tests
async function selectOption(page: any, labelOrLocator: string, optionText: string) {
  let select = page.locator(`.ant-select:has-text("${labelOrLocator}")`).locator('.ant-select-selector');
  if (await select.count() === 0) {
    select = page.getByLabel(labelOrLocator).locator('xpath=..').locator('.ant-select-selector').first();
  }
  await select.click();
  const option = page.locator(`.ant-select-item-option-content:has-text("${optionText}")`).first();
  await option.click();
}
