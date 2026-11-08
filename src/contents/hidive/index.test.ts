/**
 * @jest-environment jsdom
 * @jest-environment-options {"url": "https://www.hidive.com/"}
 */
import { sendToBackground } from "@plasmohq/messaging";

jest.mock("@plasmohq/messaging", () => ({
  sendToBackground: jest.fn(),
}));

const mockSendToBackground = sendToBackground as jest.Mock;

function openPage(path: string, title: string, ogTitle?: string) {
  history.pushState({}, "", path);
  document.title = title;
  const meta =
    ogTitle == null ? "" : `<meta property="og:title" content="${ogTitle}">`;
  global.fetch = jest.fn(async () => ({
    text: async () => `<html><head>${meta}</head></html>`,
  })) as any;
}

beforeAll(async () => {
  jest.useFakeTimers();
  jest.spyOn(console, "log").mockImplementation();
  await import(".");
  window.dispatchEvent(new Event("load"));
});

beforeEach(() => {
  mockSendToBackground.mockReset();
});

test("sends a season of a season page only once", async () => {
  openPage("/season/123", "Oshi No Ko - HIDIVE", "Oshi No Ko Season 2");
  await jest.advanceTimersByTimeAsync(10000);
  expect(mockSendToBackground).toHaveBeenCalledWith({
    name: "updateWatchHistory",
    body: {
      title: "Oshi No Ko",
      seasonId: "123",
      season: 2,
      webServiceName: "HIDIVE",
      mediaType: "tv",
    },
  });

  await jest.advanceTimersByTimeAsync(10000);
  expect(mockSendToBackground).toHaveBeenCalledTimes(1);
});

test("sends an episode of a video page without og:title", async () => {
  openPage("/video/1?seasonId=123", "E2 - Name");
  await jest.advanceTimersByTimeAsync(10000);
  expect(mockSendToBackground).toHaveBeenCalledWith({
    name: "updateWatchHistory",
    body: {
      seasonId: "123",
      episode: 2,
      webServiceName: "HIDIVE",
      mediaType: "tv",
    },
  });
});

test("ignores an unsupported page", async () => {
  openPage("/home", "HIDIVE");
  await jest.advanceTimersByTimeAsync(10000);
  expect(mockSendToBackground).not.toHaveBeenCalled();
});
