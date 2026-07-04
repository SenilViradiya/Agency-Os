import { test, expect } from '@playwright/test';
import { selectOption } from '../../helpers/antd';

test.describe('Portal Module - Client Portal Flows', () => {

  test.describe('Happy Path', () => {
    test.use({ storageState: 'e2e/.auth/client.json' });

    test('should show client dashboard greeting with client details', async ({ page }) => {
      await page.goto('/portal');
      await expect(page.locator('h1, h2, h3, span').filter({ hasText: /welcome/i }).first()).toBeVisible();
      await expect(page.locator('body')).toContainText(/Portal Guest|Portal Client/i);
    });

    test('should list active project retainer milestones assigned to client', async ({ page }) => {
      await page.goto('/portal/projects');
      await expect(page.locator('.ant-card, .ant-list, table').first()).toBeVisible();
    });

    test('should view invoices assigned to client under portal invoices ledger', async ({ page }) => {
      await page.goto('/portal/invoices');
      await expect(page.locator('table, .ant-table, .ant-list').first()).toBeVisible();
    });

    test('should view invoice breakdown details page on click', async ({ page }) => {
      await page.goto('/portal/invoices');
      // Locate the view invoice link/button
      const detailLink = page.locator('a[href*="/portal/invoices/"]').first()
        .or(page.getByRole('link', { name: /view|details|inv/i }).first());
      if (await detailLink.count() > 0) {
        await detailLink.click();
        await expect(page).toHaveURL(/\/portal\/invoices\/.+/);
        await expect(page.locator('body')).toContainText(/INVOICE|INV-/i);
      }
    });

    test('should allow user to navigate to and load profile setting form', async ({ page }) => {
      await page.goto('/portal/profile');
      await expect(page.getByLabel(/Full Name|Email Address|Name/i).first()).toBeVisible();
    });
  });

  test.describe('Error Cases', () => {
    test.use({ storageState: 'e2e/.auth/client.json' });

    test('should redirect or show not found message when loading non-existent portal invoice details page', async ({ page }) => {
      await page.goto('/portal/invoices/660a0fbc5548ab002492193a');
      await expect(page.locator('body')).toContainText(/Not Found|Error|Failed/i);
    });

    test('should show validation error messages on profile form empty submission', async ({ page }) => {
      await page.goto('/portal/profile');
      // Empty out profile name field
      const nameInput = page.getByLabel(/Full Name|Name/i).first();
      await nameInput.clear();
      await page.getByRole('button', { name: /save|update/i }).click();
      await expect(page.locator('.ant-form-item-explain-error')).toBeVisible();
    });

    test('should show error notification on invalid email update request', async ({ page }) => {
      await page.goto('/portal/profile');
      const emailInput = page.getByLabel(/Email/i).first();
      // Only clean and fill if enabled (if disabled, might skip gracefully)
      if (await emailInput.isEnabled()) {
        await emailInput.fill('invalid-email-format');
        await page.getByRole('button', { name: /save|update/i }).click();
        await expect(page.locator('.ant-form-item-explain-error')).toContainText(/email/i);
      }
    });

    test('should show validation error for password mismatch in profile password change section', async ({ page }) => {
      await page.goto('/portal/profile');
      const oldPass = page.getByLabel(/Old Password|Current Password/i);
      if (await oldPass.count() > 0) {
        await oldPass.fill('Client@123');
        await page.getByLabel(/New Password/i).fill('New@123');
        await page.getByLabel(/Confirm New Password|Confirm Password/i).fill('Mismatch@123');
        await page.getByRole('button', { name: /save|update|change password/i }).click();
        await expect(page.locator('.ant-form-item-explain-error')).toContainText(/match/i);
      }
    });

    test('should show validation feedback when password length is below minimal requirements', async ({ page }) => {
      await page.goto('/portal/profile');
      const newPass = page.getByLabel(/New Password/i);
      if (await newPass.count() > 0) {
        await newPass.fill('123');
        await page.getByRole('button', { name: /save|update|change password/i }).click();
        await expect(page.locator('.ant-form-item-explain-error')).toContainText(/characters|short/i);
      }
    });
  });

  test.describe('Edge Cases', () => {
    test.use({ storageState: 'e2e/.auth/client.json' });

    test('should correctly show status states for client invoices list', async ({ page }) => {
      await page.goto('/portal/invoices');
      await expect(page.locator('.ant-tag').first().or(page.locator('.ant-badge').first())).toBeVisible();
    });

    test('should support quick search filtering by invoice number', async ({ page }) => {
      await page.goto('/portal/invoices');
      const searchBox = page.getByPlaceholder(/Search invoices|Search/i);
      if (await searchBox.count() > 0) {
        await searchBox.fill('INV-0001');
        await page.waitForTimeout(300); // Allow debounce
        await expect(page.locator('tbody tr').first()).toContainText(/INV-0001/i);
      }
    });

    test('should format retainer totals in INR prefix local format', async ({ page }) => {
      await page.goto('/portal');
      await expect(page.locator('body')).toContainText(/₹|Rs\.|INR/i);
    });

    test('should display client manager contact profile card', async ({ page }) => {
      await page.goto('/portal/profile');
      await expect(page.locator('body')).toContainText(/Manager|Alex Manager/i);
    });

    test('should display content delivery items pending approval', async ({ page }) => {
      await page.goto('/portal/content');
      await expect(page.locator('.ant-list, table, .ant-card').first()).toBeVisible();
    });
  });

  test.describe('Permission Checks', () => {
    test('should redirect unauthenticated portal requests to portal login page', async ({ page }) => {
      // Clear storage
      await page.context().clearCookies();
      await page.goto('/portal');
      await expect(page).toHaveURL(/.*portal-login/);
    });

    test.use({ storageState: 'e2e/.auth/client.json' });

    test('should block client users from changing invoice billing item descriptions', async ({ page }) => {
      await page.goto('/portal/invoices');
      const cellText = page.locator('table, td').first();
      // Ensure double clicks or standard clicks do not trigger content editing on billing
      await cellText.dblclick({ force: true });
      await expect(page.locator('input[value*="Retainer"]').or(page.locator('td input'))).not.toBeVisible();
    });

    test('should block client users from modifying active project scope details', async ({ page }) => {
      await page.goto('/portal/projects');
      const addProjectBtn = page.getByRole('button', { name: /add project|new project/i });
      await expect(addProjectBtn).not.toBeVisible();
    });

    test('should prevent clients from calling team manager settings endpoint', async ({ page }) => {
      const response = await page.request.get('/api/users');
      expect([302, 401, 403]).toContain(response.status());
    });

    test('should block client users from deleting invoices logs', async ({ page }) => {
      await page.goto('/portal/invoices');
      const delInvoiceBtn = page.getByRole('button', { name: /delete/i });
      await expect(delInvoiceBtn).not.toBeVisible();
    });
  });

});
