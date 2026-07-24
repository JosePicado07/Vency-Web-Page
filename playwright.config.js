import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 15000,
  use: {
    baseURL: 'http://localhost:8080',
    viewport: { width: 390, height: 844 }, // iPhone 14
  },
  webServer: {
    command: 'npx http-server src -p 8080 -c-1 --cors',
    url: 'http://localhost:8080',
    reuseExistingServer: !process.env.CI,
    timeout: 10000,
  },
});
