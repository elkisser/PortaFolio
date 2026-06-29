import { defineConfig, devices } from '@playwright/test';

const PORT = 4321;
const baseURL = `http://localhost:${PORT}`;

// E2E del slice 1 (flujo Home→Work→Case study) se construirá en la tarea 16.
// Aquí solo dejamos el tooling cableado y verificable.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
