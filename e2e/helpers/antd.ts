import { Page, expect, Locator } from '@playwright/test';

/**
 * Helper to select an option in an Ant Design Select component.
 * @param page The Playwright Page instance.
 * @param labelOrLocator The label text, placeholder text, CSS selector, or Locator pointing to/near the select component.
 * @param optionText The text of the option to select from the dropdown.
 */
export async function selectOption(page: Page, labelOrLocator: string | Locator, optionText: string) {
  let select: Locator;
  if (typeof labelOrLocator === 'string') {
    if (labelOrLocator.startsWith('.') || labelOrLocator.startsWith('#')) {
      select = page.locator(labelOrLocator).locator('.ant-select-selector');
    } else {
      // Try finding by page label
      const label = page.getByLabel(labelOrLocator);
      if (await label.count() > 0) {
        // Antd wraps input inside select, which is adjacent to selector
        select = label.locator('xpath=..').locator('.ant-select-selector').first();
      } else {
        // Fallback: search for select containing selector text
        select = page.locator(`.ant-select:has-text("${labelOrLocator}")`).locator('.ant-select-selector');
        if (await select.count() === 0) {
          // Fallback: search by placeholder
          select = page.locator(`.ant-select:has(.ant-select-selection-placeholder:has-text("${labelOrLocator}"))`).locator('.ant-select-selector');
        }
      }
    }
  } else {
    // If it's already a Locator, check if it's the selector or the wrapper
    if (await labelOrLocator.locator('.ant-select-selector').count() > 0) {
      select = labelOrLocator.locator('.ant-select-selector').first();
    } else {
      select = labelOrLocator;
    }
  }

  // Click the select to open the dropdown
  await select.scrollIntoViewIfNeeded();
  await select.click();

  // Wait for the dropdown options to appear in the DOM and click the exact option
  // Ant Design renders options in a global overlay dropdown (usually at the tail of the body)
  const option = page.locator(`.ant-select-item-option-content`).filter({ hasText: optionText }).first();
  await expect(option).toBeVisible();
  await option.click();
}

/**
 * Helper to verify and handle Ant Design Message components.
 * @param page The Playwright Page instance.
 * @param messageText The expected message text or a RegExp pattern.
 */
export async function expectMessage(page: Page, messageText: string | RegExp) {
  const messageLocator = page.locator('.ant-message-notice').filter({ hasText: messageText });
  await expect(messageLocator.first()).toBeVisible();
}

/**
 * Helper to verify an Ant Design Drawer is visible.
 * @param page The Playwright page.
 * @param titleText The expected drawer title text.
 */
export async function expectDrawerVisible(page: Page, titleText: string) {
  const drawer = page.locator('.ant-drawer').filter({ hasText: titleText });
  await expect(drawer).toBeVisible();
}

/**
 * Helper to close an active Ant Design Drawer.
 * @param page The Playwright page.
 * @param titleText Optional title text to target a specific drawer.
 */
export async function closeDrawer(page: Page, titleText?: string) {
  let drawer = page.locator('.ant-drawer');
  if (titleText) {
    drawer = drawer.filter({ hasText: titleText });
  }
  const closeBtn = drawer.locator('.ant-drawer-close');
  await closeBtn.click();
  await expect(drawer).not.toBeVisible();
}

/**
 * Helper to verify an Ant Design Modal is visible.
 * @param page The Playwright page.
 * @param titleText The expected modal title text.
 */
export async function expectModalVisible(page: Page, titleText: string) {
  const modal = page.locator('.ant-modal').filter({ hasText: titleText });
  await expect(modal).toBeVisible();
}

/**
 * Helper to close an active Ant Design Modal.
 * @param page The Playwright page.
 * @param titleText Optional title text to target a specific modal.
 */
export async function closeModal(page: Page, titleText?: string) {
  let modal = page.locator('.ant-modal');
  if (titleText) {
    modal = modal.filter({ hasText: titleText });
  }
  const closeBtn = modal.locator('.ant-modal-close');
  await closeBtn.click();
  await expect(modal).not.toBeVisible();
}

/**
 * Helper to click the confirm/submit/OK option in an Ant Design Modal footer.
 * @param page The Playwright page.
 * @param titleText Optional title text to target a specific modal.
 */
export async function confirmModal(page: Page, titleText?: string) {
  let modal = page.locator('.ant-modal');
  if (titleText) {
    modal = modal.filter({ hasText: titleText });
  }
  const okBtn = modal.locator('.ant-modal-footer button').filter({ hasText: /OK|Yes|Confirm|Submit/i });
  await okBtn.click();
}
