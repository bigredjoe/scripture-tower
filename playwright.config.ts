import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  retries: 0,
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // In CI, let Playwright use the browser it installs via
        // `npx playwright install chromium`.  Locally we reuse the
        // pre-installed binary to avoid a separate download.
        ...(!process.env.CI && {
          launchOptions: {
            executablePath: '/root/.cache/ms-playwright/chromium-1194/chrome-linux/chrome',
          },
        }),
      },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env['CI'],
    timeout: 30_000,
  },
});
