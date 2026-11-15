import { defineConfig } from "@playwright/test";

// End-to-end tests load the built extension (build/chrome-mv3-prod) in Chromium
export default defineConfig({
  testDir: "e2e",
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    trace: "retain-on-failure",
  },
});
