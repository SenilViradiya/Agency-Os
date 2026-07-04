import { defineConfig, devices } from '@playwright/test';
import path from 'path';

export default defineConfig({
  testDir: path.join(__dirname, 'e2e', 'tests'),
  fullyParallel: true,
  forbidOnly: true, // Never use test.only() or fail build
  retries: 0,
  workers: '50%', // Allow parallel runs
  timeout: 90 * 1000, // 90 seconds timeout for compile and execution safety
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }]
  ],
  globalSetup: require.resolve('./e2e/global-setup.ts'),
  expect: {
    timeout: 20000,
  },
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'off',
  },
  projects: [
    // Auth Setup Project
    {
      name: 'setup',
      testDir: path.join(__dirname, 'e2e'),
      testMatch: /auth\.setup\.ts/,
    },
    // Desktop Chromium Testing Project
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
      },
      dependencies: ['setup'],
    },
    // Mobile Chrome Testing Project
    {
      name: 'mobile-chrome',
      use: { 
        ...devices['Pixel 5'],
      },
      dependencies: ['setup'],
    },
  ],
  webServer: {
    command: 'npm run start',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120 * 1000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
