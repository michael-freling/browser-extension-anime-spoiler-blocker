/**
 * @jest-environment jsdom
 */
import { sendToBackground } from "@plasmohq/messaging";
import { isConfigChange, main } from "./main";
import { STATE_ATTRIBUTE } from "./overlay";

jest.mock("@plasmohq/messaging", () => ({
  sendToBackground: jest.fn(),
}));

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

const mockSendToBackground = sendToBackground as jest.Mock;
let storageListeners: ((changes: object) => void)[];

beforeEach(() => {
  storageListeners = [];
  (global as any).chrome = {
    storage: {
      onChanged: {
        addListener: (listener) => storageListeners.push(listener),
      },
    },
  };
  mockSendToBackground.mockReset();
});

const response = (episode: number) => ({
  config: { series: [{ title: "Test", keywords: ["Test Anime"] }] },
  userHistory: { series: [{ title: "Test", tv: { season: 1, episode } }] },
});

describe("isConfigChange", () => {
  test.each([
    [{ userHistory: {} }, true],
    [{ "series.Test": {} }, true],
    [{ hidive: {} }, false],
    [{}, false],
  ])("%j", (changes, expected) => {
    expect(isConfigChange(changes)).toBe(expected);
  });
});

describe("main", () => {
  test("loads a configuration and reloads it when a watch history changes", async () => {
    mockSendToBackground.mockResolvedValueOnce(response(2));
    document.body.innerHTML = `
      <ytd-video-renderer id="a">
        <a id="video-title" href="/watch?v=v1">Test Anime Season 1 Episode 3</a>
      </ytd-video-renderer>`;
    const blocker = main(document);
    await flush();
    expect(mockSendToBackground).toHaveBeenCalledWith({ name: "getConfig" });
    const card = document.getElementById("a")!;
    expect(card.getAttribute(STATE_ATTRIBUTE)).toBe("blocked");

    // An unrelated change is ignored
    storageListeners.forEach((listener) => listener({ hidive: {} }));
    expect(mockSendToBackground).toHaveBeenCalledTimes(1);

    mockSendToBackground.mockResolvedValueOnce(response(3));
    storageListeners.forEach((listener) => listener({ userHistory: {} }));
    await flush();
    expect(card.hasAttribute(STATE_ATTRIBUTE)).toBe(false);
    blocker.stop();
  });

  test("shows videos when a configuration cannot be loaded", async () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation();
    mockSendToBackground.mockRejectedValueOnce(new Error("failed"));
    const blocker = main();
    await flush();
    expect(document.documentElement.className).not.toContain("asb-pending");
    expect(consoleError).toHaveBeenCalled();
    blocker.stop();
  });
});
