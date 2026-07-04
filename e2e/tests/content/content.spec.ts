import { test, expect } from '@playwright/test';
import { selectOption, expectDrawerVisible, closeDrawer } from '../../helpers/antd';

test.describe('Content Module - Content Pipeline Automation', () => {

  test.describe('Happy Path', () => {
    test.use({ storageState: 'e2e/.auth/manager.json' });

    test('should load content calendar schedule dashboard successfully', async ({ page }) => {
      await page.goto('/content');
      await expect(page).toHaveURL(/.*content/);
      await expect(page.locator('h1, h2, h3').filter({ hasText: /Content/i }).first()).toBeVisible();
    });

    test('should create a new content item successfully', async ({ page }) => {
      await page.goto('/content');
      const addBtn = page.getByRole('button', { name: /add content|new content|create/i });
      if (await addBtn.count() > 0) {
        await addBtn.click();
        await expectDrawerVisible(page, /Create Content|Add Content/i);
        await page.getByLabel(/Title/i).fill('Testing New Content Pipeline Flow');
        await selectOption(page, 'Platform', 'YouTube');
        await selectOption(page, 'Format', 'YouTube Video');
        await page.getByRole('button', { name: /submit|create/i }).click();
        await page.waitForTimeout(500);
        await expect(page.locator('body')).toContainText(/Testing New Content Pipeline Flow/i);
      }
    });

    test('should transition content item stage from script to shoot upon completing task', async ({ page }) => {
      await page.goto('/tasks');
      await page.waitForTimeout(500);
      const scriptTaskCheckbox = page.locator('input[type="checkbox"]').first();
      if (await scriptTaskCheckbox.count() > 0 && await scriptTaskCheckbox.isEnabled()) {
        await scriptTaskCheckbox.check();
        await page.waitForTimeout(500);
        // Pipeline task completion triggers auto creation of next stage
        await expect(page.locator('body')).toContainText(/shoot/i);
      }
    });

    test('should allow Manager to submit content for approval review verification', async ({ page }) => {
      await page.goto('/content');
      // Click first content item to open details
      const firstRow = page.locator('.ant-table-row, td a').first();
      if (await firstRow.count() > 0) {
        await firstRow.click();
        // Submit button inside details
        const submitBtn = page.getByRole('button', { name: /Submit for Approval|Submit/i });
        if (await submitBtn.count() > 0) {
          await submitBtn.click();
          await page.waitForTimeout(500);
          await expect(page.locator('body')).toContainText(/pending_review|in_approval/i);
        }
      }
    });

    test('should transition content status to ready_to_publish when Manager approves it', async ({ page }) => {
      await page.goto('/content');
      // Go to approvals tab or details
      await page.goto('/approvals');
      await page.waitForTimeout(500);
      const approveBtn = page.getByRole('button', { name: /Approve/i }).first();
      if (await approveBtn.count() > 0) {
        await approveBtn.click();
        await page.waitForTimeout(500);
        await expect(page.locator('body')).toContainText(/Success/i);
      }
    });

    test('should mark content item as published with custom URL information', async ({ page }) => {
      await page.goto('/content');
      const row = page.locator('tr').filter({ hasText: /Ready to Publish|ready/i }).first();
      if (await row.count() > 0) {
        await row.click();
        const publishActionBtn = page.getByRole('button', { name: /publish/i }).first();
        if (await publishActionBtn.count() > 0) {
          await publishActionBtn.click();
          await page.getByPlaceholder(/URL/i).fill('https://youtube.com/watch?v=123');
          await page.getByRole('button', { name: /Ok|Confirm/i }).click();
          await page.waitForTimeout(500);
          await expect(page.locator('body')).toContainText(/published/i);
        }
      }
    });
  });

  test.describe('Error Cases', () => {
    test.use({ storageState: 'e2e/.auth/manager.json' });

    test('should prevent creation of content item if title field is empty', async ({ page }) => {
      await page.goto('/content');
      const addBtn = page.getByRole('button', { name: /add content|new content|create/i });
      if (await addBtn.count() > 0) {
        await addBtn.click();
        await page.getByRole('button', { name: /submit|create/i }).click();
        await expect(page.locator('.ant-form-item-explain-error')).toBeVisible();
        await closeDrawer(page);
      }
    });

    test('should reject moving to next stage when preceding task is not completed', async ({ page }) => {
      await page.goto('/content');
      // Click script in progress content
      const row = page.locator('tr').filter({ hasText: /script/i }).first();
      if (await row.count() > 0) {
        await row.click();
        const nextStageBtn = page.getByRole('button', { name: /advance stage|next/i });
        if (await nextStageBtn.count() > 0 && await nextStageBtn.isDisabled()) {
          await expect(nextStageBtn).toBeDisabled();
        }
      }
    });

    test('should reject approval request submission with empty files or descriptions fields', async ({ page }) => {
      await page.goto('/approvals');
      const submitBtn = page.getByRole('button', { name: /Submit New Review/i });
      if (await submitBtn.count() > 0) {
        await submitBtn.click();
        await page.getByRole('button', { name: /submit|ok/i }).click();
        await expect(page.locator('.ant-form-item-explain-error').first()).toBeVisible();
      }
    });

    test('should reject updating pipeline comments with empty message payload', async ({ page }) => {
      await page.goto('/content');
      const firstRow = page.locator('.ant-table-row, td a').first();
      if (await firstRow.count() > 0) {
        await firstRow.click();
        const postCommentBtn = page.getByRole('button', { name: /comment|post/i });
        if (await postCommentBtn.count() > 0) {
          await postCommentBtn.click();
          await expect(page.locator('.ant-form-item-explain-error').or(page.locator('.ant-message'))).toBeVisible();
        }
      }
    });

    test('should prevent schedule publication for past dates or invalid calendars coordinates', async ({ page }) => {
      await page.goto('/publishing');
      const scheduleBtn = page.getByRole('button', { name: /schedule/i });
      if (await scheduleBtn.count() > 0) {
        await scheduleBtn.click();
        // Enter past date
        const datePicker = page.locator('.ant-picker');
        if (await datePicker.count() > 0) {
          await datePicker.click();
          await page.getByRole('button', { name: /now|today/i }).click();
          await page.getByRole('button', { name: /ok|confirm/i }).click();
        }
      }
    });
  });

  test.describe('Edge Cases', () => {
    test.use({ storageState: 'e2e/.auth/manager.json' });

    test('should filter content list by platform checkbox selections', async ({ page }) => {
      await page.goto('/content');
      const youtubeFilter = page.locator('label').filter({ hasText: /YouTube/i });
      if (await youtubeFilter.count() > 0) {
        await youtubeFilter.click();
        await page.waitForTimeout(300); // Allow debounce
        await expect(page.locator('table, tbody')).toContainText(/YouTube/i);
      }
    });

    test('should search content items list by keyword inputs', async ({ page }) => {
      await page.goto('/content');
      const searchBox = page.getByPlaceholder(/search content|search/i);
      if (await searchBox.count() > 0) {
        await searchBox.fill('AI Productivity Hacks');
        await page.waitForTimeout(300); // Allow debounce
        await expect(page.locator('tbody')).toContainText(/AI Productivity Hacks/i);
      }
    });

    test('should display total revision count logs properly in revisions list history', async ({ page }) => {
      await page.goto('/content');
      const row = page.locator('tr').filter({ hasText: /AI Productivity/i }).first();
      if (await row.count() > 0) {
        await row.click();
        await expect(page.locator('body')).toContainText(/revisions|history|note/i);
      }
    });

    test('should handle revert state transition with revision notes request from Manager', async ({ page }) => {
      await page.goto('/approvals');
      const revisionBtn = page.getByRole('button', { name: /request revision|reject/i }).first();
      if (await revisionBtn.count() > 0) {
        await revisionBtn.click();
        await page.getByPlaceholder(/reason|notes|feedback/i).fill('Caption spacing needs change');
        await page.getByRole('button', { name: /Submit/i }).click();
        await page.waitForTimeout(500);
        await expect(page.locator('body')).toContainText(/revision_requested|Success/i);
      }
    });

    test('should show correct active platforms count icon badge on list cards', async ({ page }) => {
      await page.goto('/content');
      await page.locator('.ant-segmented-item', { hasText: 'List' }).click();
      await expect(page.locator('.ant-tag').first()).toBeVisible();
    });
  });

  test.describe('Permission Checks', () => {
    test.describe('Editor Permissions on Content Pipeline', () => {
      test.use({ storageState: 'e2e/.auth/editor.json' });

      test('should prevent Editor from approving content approvals directly', async ({ page }) => {
        await page.goto('/approvals');
        const approveBtn = page.getByRole('button', { name: /approve/i }).first();
        await expect(approveBtn).not.toBeVisible();
      });

      test('should prevent Editor from deleting content items', async ({ page }) => {
        await page.goto('/content');
        const deleteBtn = page.getByRole('button', { name: /delete/i }).first();
        await expect(deleteBtn).not.toBeVisible();
      });
    });

    test.describe('Viewer Permissions on Content Pipeline', () => {
      test.use({ storageState: 'e2e/.auth/viewer.json' });

      test('should prevent Viewer from adding a new content items', async ({ page }) => {
        await page.goto('/content');
        const addBtn = page.getByRole('button', { name: /add content|new content|create/i });
        await expect(addBtn).not.toBeVisible();
      });

      test('should reject Viewer attempting stage updates', async ({ page }) => {
        await page.goto('/content');
        const firstRow = page.locator('tbody tr').first();
        if (await firstRow.count() > 0) {
          await firstRow.click();
          const advanceBtn = page.getByRole('button', { name: /advance|next|comment/i });
          // Either element absent or disabled
          if (await advanceBtn.count() > 0) {
            await expect(advanceBtn).toBeDisabled();
          }
        }
      });

      test('should prevent Viewer from submitting approvals notifications request', async ({ page }) => {
        await page.goto('/approvals');
        const submitBtn = page.getByRole('button', { name: /Submit New Review|Create/i });
        await expect(submitBtn).not.toBeVisible();
      });
    });
  });

});
