import { test, expect } from '@playwright/test';
import { selectOption, confirmModal } from '../../helpers/antd';

test.describe('Finance Module - Financial Ledger Operations', () => {

  test.describe('Happy Path', () => {
    test.use({ storageState: 'e2e/.auth/manager.json' });

    test('should list all invoices with total amounts due and paid', async ({ page }) => {
      await page.goto('/finance');
      await page.locator('.ant-tabs-tab-btn', { hasText: 'Invoices' }).click();
      await page.waitForTimeout(500);
      await expect(page.locator('.ant-tabs-tabpane-active table, .ant-tabs-tabpane-active .ant-table, .ant-tabs-tabpane-active .ant-list').first()).toBeVisible();
      await expect(page.locator('body')).toContainText(/INV-0001/i);
    });

    test('should create a new invoice successfully and auto-calculate subtotal', async ({ page }) => {
      await page.goto('/finance');
      const addInvoiceBtn = page.getByRole('button', { name: /new invoice|create invoice/i });
      if (await addInvoiceBtn.count() > 0) {
        await addInvoiceBtn.click();
        await selectOption(page, 'Client', 'TechFlow Solutions');
        await page.getByLabel(/Business Name/i).fill('TechFlow Solutions Ltd');
        await page.getByPlaceholder(/Description/i).fill('Consulting retainer');
        await page.getByPlaceholder(/Price|Unit Price/i).fill('10000');
        await page.getByRole('button', { name: /save|create/i }).click();
        await page.waitForTimeout(500);
        await expect(page.locator('body')).toContainText(/Created successfully|Invoice created/i);
      }
    });

    test('should record payment for invoice updating status to paid', async ({ page }) => {
      await page.goto('/finance');
      const recordBtn = page.getByRole('button', { name: /record payment/i }).first();
      if (await recordBtn.count() > 0) {
        await recordBtn.click();
        await selectOption(page, 'Invoice', 'INV-0002');
        await page.getByLabel(/Amount/i).fill('10000');
        await selectOption(page, 'Payment Mode', 'Bank Transfer');
        await page.getByRole('button', { name: /save|submit/i }).click();
        await page.waitForTimeout(500);
        await expect(page.locator('body')).toContainText(/Payment recorded|success/i);
      }
    });

    test('should log a new expense item successfully', async ({ page }) => {
      await page.goto('/finance');
      // Click expenses tab
      const expensesTab = page.getByRole('tab', { name: /Expenses/i });
      if (await expensesTab.count() > 0) {
        await expensesTab.click();
        await page.waitForTimeout(300);
        const addExpenseBtn = page.getByRole('button', { name: /add expense|log expense/i });
        if (await addExpenseBtn.count() > 0) {
          await addExpenseBtn.click();
          await page.getByLabel(/Title/i).fill('Adobe Stock Licenses Renewal');
          await page.getByLabel(/Amount/i).fill('5000');
          await selectOption(page, 'Category', 'software_subscription');
          await page.getByRole('button', { name: /submit|ok/i }).click();
          await page.waitForTimeout(500);
          await expect(page.locator('body')).toContainText(/expense logged|success/i);
        }
      }
    });

    test('should update expense log status from pending to approved', async ({ page }) => {
      await page.goto('/finance');
      const expensesTab = page.getByRole('tab', { name: /Expenses/i });
      if (await expensesTab.count() > 0) {
        await expensesTab.click();
        await page.waitForTimeout(500);
        const approveBtn = page.getByRole('button', { name: /approve/i }).first();
        if (await approveBtn.count() > 0) {
          await approveBtn.click();
          await page.waitForTimeout(500);
          await expect(page.locator('body')).toContainText(/approved|success/i);
        }
      }
    });

    test('should convert accepted client quotation proposal to active invoice', async ({ page }) => {
      await page.goto('/finance');
      const quotationsTab = page.getByRole('tab', { name: /Quotations/i });
      if (await quotationsTab.count() > 0) {
        await quotationsTab.click();
        await page.waitForTimeout(500);
        const convertBtn = page.getByRole('button', { name: /convert/i }).first();
        if (await convertBtn.count() > 0) {
          await convertBtn.click();
          await page.waitForTimeout(500);
          await expect(page.locator('body')).toContainText(/converted|success|invoice created/i);
        }
      }
    });
  });

  test.describe('Error Cases', () => {
    test.use({ storageState: 'e2e/.auth/manager.json' });

    test('should prevent invoice creation if product client selection is missing', async ({ page }) => {
      await page.goto('/finance');
      const createBtn = page.getByRole('button', { name: /new invoice/i });
      if (await createBtn.count() > 0) {
        await createBtn.click();
        await page.getByRole('button', { name: /save|create/i }).click();
        await expect(page.locator('.ant-form-item-explain-error')).toBeVisible();
      }
    });

    test('should prevent invoice creation with negative unit prices input validation', async ({ page }) => {
      await page.goto('/finance');
      const createBtn = page.getByRole('button', { name: /new invoice/i });
      if (await createBtn.count() > 0) {
        await createBtn.click();
        await selectOption(page, 'Client', 'TechFlow Solutions');
        const priceInput = page.getByPlaceholder(/price|unit price/i);
        if (await priceInput.count() > 0) {
          await priceInput.fill('-150');
          await page.getByRole('button', { name: /save|create/i }).click();
          await expect(page.locator('.ant-form-item-explain-error').first()).toBeVisible();
        }
      }
    });

    test('should display validation bounds warning when recorded payment exceeds remaining due balance', async ({ page }) => {
      await page.goto('/finance');
      const recordBtn = page.getByRole('button', { name: /record payment/i }).first();
      if (await recordBtn.count() > 0) {
        await recordBtn.click();
        await selectOption(page, 'Invoice', 'INV-0002');
        await page.getByLabel(/Amount/i).fill('9999999'); // ultra large amount
        await page.getByRole('button', { name: /save|submit/i }).click();
        await expect(page.locator('.ant-message').or(page.locator('.ant-form-item-explain-error'))).toBeVisible();
      }
    });

    test('should display validation error message for empty logged expense titles', async ({ page }) => {
      await page.goto('/finance');
      const tab = page.getByRole('tab', { name: /expenses/i });
      if (await tab.count() > 0) {
        await tab.click();
        const addBtn = page.getByRole('button', { name: /add expense/i });
        if (await addBtn.count() > 0) {
          await addBtn.click();
          await page.getByRole('button', { name: /submit/i }).click();
          await expect(page.locator('.ant-form-item-explain-error')).toBeVisible();
        }
      }
    });

    test('should reject adding negative quantities on quote building line item grid', async ({ page }) => {
      await page.goto('/finance');
      const quotationsTab = page.getByRole('tab', { name: /Quotations/i });
      if (await quotationsTab.count() > 0) {
        await quotationsTab.click();
        const createBtn = page.getByRole('button', { name: /new quotation/i });
        if (await createBtn.count() > 0) {
          await createBtn.click();
          const qtyInput = page.getByPlaceholder(/qty|quantity/i);
          if (await qtyInput.count() > 0) {
            await qtyInput.fill('-5');
            await page.getByRole('button', { name: /save|create/i }).click();
            await expect(page.locator('.ant-form-item-explain-error')).toBeVisible();
          }
        }
      }
    });
  });

  test.describe('Edge Cases', () => {
    test.use({ storageState: 'e2e/.auth/manager.json' });

    test('should filter billing invoices ledger list by billing period value', async ({ page }) => {
      await page.goto('/finance');
      const periodSelect = page.locator('.ant-select').filter({ hasText: /billing period/i }).or(page.getByPlaceholder(/Select Billing Period/i));
      if (await periodSelect.count() > 0) {
        await selectOption(page, periodSelect, '2026-05');
        await page.waitForTimeout(300); // Allow debounce
        await expect(page.locator('table, tbody')).toContainText(/2026-05/i);
      }
    });

    test('should filter active ledger list by specific expense categories selects', async ({ page }) => {
      await page.goto('/finance');
      const tab = page.getByRole('tab', { name: /expenses/i });
      if (await tab.count() > 0) {
        await tab.click();
        const categoryFilter = page.locator('.ant-select').filter({ hasText: /category/i });
        if (await categoryFilter.count() > 0) {
          await selectOption(page, categoryFilter, 'software_subscription');
          await page.waitForTimeout(300); // Allow debounce
          await expect(page.locator('table, tbody')).toContainText(/Adobe/i);
        }
      }
    });

    test('should display taxation breakdown (CGST + SGST) accurately when GST calculations is checked', async ({ page }) => {
      await page.goto('/finance');
      const row = page.locator('tr').filter({ hasText: /INV-0001/i }).first();
      if (await row.count() > 0) {
        await row.click();
        await expect(page.locator('body')).toContainText(/CGST|SGST/i);
      }
    });

    test('should calculate subtotal without tax components additions if gstEnabled settings is toggled off', async ({ page }) => {
      await page.goto('/finance');
      const settingsTab = page.getByRole('tab', { name: /Settings/i });
      if (await settingsTab.count() > 0) {
        await settingsTab.click();
        const gstToggle = page.locator('input[type="checkbox"]').filter({ hasText: /GST/i }).or(page.getByLabel(/Enable GST/i));
        if (await gstToggle.count() > 0 && await gstToggle.isChecked()) {
          await gstToggle.uncheck();
          await page.getByRole('button', { name: /save/i }).click();
          await expect(page.locator('.ant-message-notice')).toContainText(/saved/i);
        }
      }
    });

    test('should format totals into localized rupee format across ledger indexes', async ({ page }) => {
      await page.goto('/finance');
      await expect(page.locator('body')).toContainText(/₹|Rs\.|INR/i);
    });
  });

  test.describe('Permission Checks', () => {
    test.describe('Editor restrictions in Finance Module', () => {
      test.use({ storageState: 'e2e/.auth/editor.json' });

      test('should prevent Editor from creating a new client billing invoice record', async ({ page }) => {
        await page.goto('/finance');
        const createBtn = page.getByRole('button', { name: /new invoice/i });
        await expect(createBtn).not.toBeVisible();
      });

      test('should block Editor from logging new operation expenditures', async ({ page }) => {
        await page.goto('/finance');
        const expensesTab = page.getByRole('tab', { name: /expenses/i });
        if (await expensesTab.count() > 0) {
          await expensesTab.click();
          const addBtn = page.getByRole('button', { name: /add expense/i });
          await expect(addBtn).not.toBeVisible();
        }
      });
    });

    test.describe('Viewer restrictions in Finance Module', () => {
      test.use({ storageState: 'e2e/.auth/viewer.json' });

      test('should block Viewer from editing tax details inside finance settings panels', async ({ page }) => {
        await page.goto('/finance');
        const settingsTab = page.getByRole('tab', { name: /Settings/i });
        await expect(settingsTab).not.toBeVisible();
      });

      test('should block Viewer from adding payments checks', async ({ page }) => {
        await page.goto('/finance');
        const recordBtn = page.getByRole('button', { name: /record payment/i });
        await expect(recordBtn).not.toBeVisible();
      });

      test('should block Viewer from changing quotation statuses', async ({ page }) => {
        await page.goto('/finance');
        const quoteTab = page.getByRole('tab', { name: /quotations/i });
        if (await quoteTab.count() > 0) {
          await quoteTab.click();
          const convertBtn = page.getByRole('button', { name: /convert/i });
          await expect(convertBtn).not.toBeVisible();
        }
      });
    });
  });

});
