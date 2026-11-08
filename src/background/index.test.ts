import { areas, resetStorage } from "~test/plasmoStorage";

jest.mock("@plasmohq/storage", () => require("~test/plasmoStorage"));

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));
let onInstalled: (details: { reason: string }) => void;

beforeAll(async () => {
  (global as any).chrome = {
    runtime: {
      onInstalled: { addListener: (listener) => (onInstalled = listener) },
      getURL: (path: string) => `chrome-extension://id/${path}`,
    },
  };
  await import(".");
});

beforeEach(resetStorage);

test("stores default configurations on installation", async () => {
  global.fetch = jest.fn(async (url: string) => ({
    status: 200,
    json: async () => ({ url }),
  })) as any;
  onInstalled({ reason: "install" });
  await flush();

  expect(areas.sync.get("hidive")).toEqual({
    url: "chrome-extension://id/assets/configs/hidive.json",
  });
  expect(areas.sync.get("userHistory")).toEqual({
    url: "chrome-extension://id/assets/configs/user_history_example.json",
  });
});

test("logs an error when a default configuration cannot be fetched", async () => {
  const consoleError = jest.spyOn(console, "error").mockImplementation();
  global.fetch = jest.fn(async () => ({ status: 404 })) as any;
  onInstalled({ reason: "install" });
  await flush();

  expect(consoleError).toHaveBeenCalled();
  expect(areas.sync.size).toBe(0);
});

test("does nothing on an update", async () => {
  global.fetch = jest.fn() as any;
  onInstalled({ reason: "update" });
  await flush();
  expect(global.fetch).not.toHaveBeenCalled();
});
