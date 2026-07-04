import { test as setup } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const authDir = path.join(process.cwd(), 'e2e', '.auth');

// Make sure auth directory exists
if (!fs.existsSync(authDir)) {
  fs.mkdirSync(authDir, { recursive: true });
}

setup.describe.configure({ mode: 'serial' });

setup.beforeEach(({}, testInfo) => {
  testInfo.setTimeout(180 * 1000);
});

setup('authenticate admin', async ({ page }) => {
  await page.context().clearCookies();
  await page.goto('/login');
  await page.getByPlaceholder('Email Address').fill('admin@agencyos.com');
  await page.getByPlaceholder('Password').fill('Admin@123');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForURL(/\/dashboard|dashboard/);
  await page.context().storageState({ path: path.join(authDir, 'admin.json') });
});

setup('authenticate manager', async ({ page }) => {
  await page.context().clearCookies();
  await page.goto('/login');
  await page.getByPlaceholder('Email Address').fill('manager@agencyos.com');
  await page.getByPlaceholder('Password').fill('Admin@123');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForURL(/\/dashboard|dashboard/);
  await page.context().storageState({ path: path.join(authDir, 'manager.json') });
});

setup('authenticate editor', async ({ page }) => {
  await page.context().clearCookies();
  await page.goto('/login');
  await page.getByPlaceholder('Email Address').fill('editor@agencyos.com');
  await page.getByPlaceholder('Password').fill('Admin@123');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForURL(/\/dashboard|dashboard/);
  await page.context().storageState({ path: path.join(authDir, 'editor.json') });
});

setup('authenticate viewer', async ({ page }) => {
  await page.context().clearCookies();
  await page.goto('/login');
  await page.getByPlaceholder('Email Address').fill('viewer@agencyos.com');
  await page.getByPlaceholder('Password').fill('Admin@123');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForURL(/\/dashboard|dashboard/);
  await page.context().storageState({ path: path.join(authDir, 'viewer.json') });
});

setup('authenticate client', async ({ page }) => {
  await page.context().clearCookies();
  await page.goto('/portal-login');
  await page.getByPlaceholder('Email Address').fill('client@samplebrand.com');
  await page.getByPlaceholder('Password').fill('Client@123');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForURL(url => url.pathname === '/portal', { timeout: 20000 });
  await page.context().storageState({ path: path.join(authDir, 'client.json') });
});
