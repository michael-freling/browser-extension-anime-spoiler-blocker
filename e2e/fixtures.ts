import {
  test as base,
  chromium,
  type BrowserContext,
  type Worker,
} from "@playwright/test";
import path from "node:path";

const EXTENSION_PATH = path.resolve("build/chrome-mv3-prod");
const SNAPSHOTS = path.resolve("e2e/snapshots");

export const SEARCH_URL =
  "https://www.youtube.com/results?search_query=oshi+no+ko+season+3";

export interface StorageState {
  hidive?: object;
  userHistory?: object;
  series?: { [title: string]: object };
}

export const test = base.extend<{
  context: BrowserContext;
  serviceWorker: Worker;
  seedStorage: (state: StorageState) => Promise<void>;
}>({
  // Chromium with the built extension, where YouTube is served from snapshots
  // and every other request is blocked, so tests run offline
  context: async ({}, use) => {
    const context = await chromium.launchPersistentContext("", {
      channel: "chromium",
      args: [
        `--disable-extensions-except=${EXTENSION_PATH}`,
        `--load-extension=${EXTENSION_PATH}`,
      ],
    });
    await context.route("**/*", (route) => {
      const url = new URL(route.request().url());
      if (url.host == "www.youtube.com" && url.pathname == "/results") {
        return route.fulfill({
          path: path.join(SNAPSHOTS, "youtube-search.html"),
          contentType: "text/html",
        });
      }
      return route.abort();
    });
    await use(context);
    await context.close();
  },

  serviceWorker: async ({ context }, use) => {
    const [serviceWorker] = context.serviceWorkers();
    await use(serviceWorker ?? (await context.waitForEvent("serviceworker")));
  },

  // Write extension storage in the same format as @plasmohq/storage
  seedStorage: async ({ serviceWorker }, use) => {
    await use(async (state) => {
      await serviceWorker.evaluate(async (state) => {
        // Wait for the defaults written on installation, so they don't overwrite the state
        for (let i = 0; i < 50; i++) {
          const defaults = await chrome.storage.sync.get(["userHistory"]);
          if (defaults.userHistory != null) {
            break;
          }
          await new Promise((resolve) => setTimeout(resolve, 100));
        }

        const sync: { [key: string]: string } = {};
        if (state.hidive) {
          sync.hidive = JSON.stringify(state.hidive);
        }
        if (state.userHistory) {
          sync.userHistory = JSON.stringify(state.userHistory);
        }
        await chrome.storage.sync.set(sync);

        const local: { [key: string]: string } = {};
        for (const [title, config] of Object.entries(state.series ?? {})) {
          local[`series.${title}`] = JSON.stringify(config);
        }
        await chrome.storage.local.set(local);
      }, state);
    });
  },
});

export { expect } from "@playwright/test";
