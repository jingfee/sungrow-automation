import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  timeout: 1 * 60 * 1000,

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], trace: 'on' },
    },
  ],
});
