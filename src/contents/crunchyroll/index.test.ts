/**
 * @jest-environment jsdom
 * @jest-environment-options {"url": "https://www.crunchyroll.com/"}
 */
import { sendToBackground } from "@plasmohq/messaging";

jest.mock("@plasmohq/messaging", () => ({
  sendToBackground: jest.fn(),
}));

const mockSendToBackground = sendToBackground as jest.Mock;

function openPage(path: string, title?: string | null) {
  history.pushState({}, "", path);
  document.head.innerHTML = "";
  if (title === undefined) {
    return;
  }
  const meta = document.createElement("meta");
  meta.setAttribute("property", "og:title");
  if (title !== null) {
    meta.setAttribute("content", title);
  }
  document.head.appendChild(meta);
}

beforeAll(async () => {
  jest.useFakeTimers();
  await import(".");
  window.dispatchEvent(new Event("load"));
});

beforeEach(() => {
  mockSendToBackground.mockReset();
});

test("sends an episode of a watch page only once", async () => {
  openPage("/watch/G123/slug", "My Show Season 2 | E3 - Name");
  await jest.advanceTimersByTimeAsync(10000);
  expect(mockSendToBackground).toHaveBeenCalledWith({
    name: "updateWatchHistory",
    body: {
      title: "My Show",
      titles: ["My Show"],
      season: 2,
      episode: 3,
      type: "updateWatchHistory",
      webServiceName: "Crunchyroll",
      mediaType: "tv",
    },
  });

  await jest.advanceTimersByTimeAsync(10000);
  expect(mockSendToBackground).toHaveBeenCalledTimes(1);
});

test.each([
  ["a page other than a watch page", "/series/G123", "My Show | E3 - Name"],
  ["a page without og:title", "/watch/G124/slug", undefined],
  ["og:title without content", "/watch/G125/slug", null],
  ["a title without an episode", "/watch/G126/slug", "My Show | Trailer"],
])("ignores %s", async (_, path, title) => {
  openPage(path, title);
  await jest.advanceTimersByTimeAsync(10000);
  expect(mockSendToBackground).not.toHaveBeenCalled();
});
