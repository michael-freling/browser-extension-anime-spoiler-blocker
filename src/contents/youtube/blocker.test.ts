/**
 * @jest-environment jsdom
 */
import { TextSpoilerAnalyzer } from "~blocker";
import { YouTubeSpoilerBlocker } from "./blocker";
import { OVERLAY_CLASS, PENDING_CLASS, STATE_ATTRIBUTE } from "./overlay";

// MutationObserver callbacks run in a microtask
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

const analyzer = (episode: number = 2) =>
  new TextSpoilerAnalyzer(
    { series: [{ title: "Test", keywords: ["Test Anime"] }] },
    { series: [{ title: "Test", tv: { season: 1, episode } }] },
  );

function card(id: string, videoId: string, title: string): string {
  return `
    <ytd-rich-item-renderer id="${id}">
      <div id="content">
        <a id="video-title" href="/watch?v=${videoId}">${title}</a>
      </div>
    </ytd-rich-item-renderer>`;
}

const isBlocked = (id: string) =>
  document.getElementById(id)!.getAttribute(STATE_ATTRIBUTE) == "blocked";

describe("YouTubeSpoilerBlocker", () => {
  let blocker: YouTubeSpoilerBlocker;

  beforeEach(() => {
    document.body.innerHTML = "";
    blocker = new YouTubeSpoilerBlocker();
    blocker.start();
  });

  afterEach(() => {
    blocker.stop();
  });

  test("hides cards until an analyzer is set", async () => {
    expect(document.documentElement.classList.contains(PENDING_CLASS)).toBe(
      true,
    );
    document.body.innerHTML = card("a", "v1", "Test Anime Season 1 Episode 3");
    await flush();
    // Nothing is analyzed without an analyzer
    expect(isBlocked("a")).toBe(false);

    blocker.setAnalyzer(analyzer());
    expect(document.documentElement.classList.contains(PENDING_CLASS)).toBe(
      false,
    );
    expect(isBlocked("a")).toBe(true);
  });

  test("blocks only spoilers among added cards", async () => {
    blocker.setAnalyzer(analyzer());
    document.body.innerHTML =
      card("spoiler", "v1", "Test Anime Season 1 Episode 3") +
      card("watched", "v2", "Test Anime Season 1 Episode 2") +
      card("other", "v3", "Another video");
    await flush();

    expect(isBlocked("spoiler")).toBe(true);
    expect(isBlocked("watched")).toBe(false);
    expect(isBlocked("other")).toBe(false);
    expect(
      document.getElementById("spoiler")!.querySelector(`.${OVERLAY_CLASS}`)!
        .textContent,
    ).toContain("Test Season 1 Episode 3");
  });

  test("re-analyzes a card when YouTube reuses it for another video", async () => {
    blocker.setAnalyzer(analyzer());
    document.body.innerHTML = card("a", "v1", "Test Anime Season 1 Episode 3");
    await flush();
    expect(isBlocked("a")).toBe(true);

    const title = document.getElementById("video-title")!;
    title.setAttribute("href", "/watch?v=v2");
    title.textContent = "Cooking video";
    await flush();
    expect(isBlocked("a")).toBe(false);
    expect(document.querySelector(`.${OVERLAY_CLASS}`)).toBeNull();

    title.textContent = "Test Anime Season 2";
    await flush();
    expect(isBlocked("a")).toBe(true);
  });

  test("keeps a shown video visible", async () => {
    blocker.setAnalyzer(analyzer());
    document.body.innerHTML = card("a", "v1", "Test Anime Season 1 Episode 3");
    await flush();

    document
      .querySelector<HTMLButtonElement>(`.${OVERLAY_CLASS} button`)!
      .click();
    expect(isBlocked("a")).toBe(false);
    expect(document.activeElement).toBe(document.getElementById("video-title"));
    await flush();
    expect(isBlocked("a")).toBe(false);

    // Even after a configuration is reloaded
    blocker.setAnalyzer(analyzer());
    expect(isBlocked("a")).toBe(false);
  });

  test("does not re-render a blocked card for unrelated mutations", async () => {
    blocker.setAnalyzer(analyzer());
    document.body.innerHTML = card("a", "v1", "Test Anime Season 1 Episode 3");
    await flush();
    const overlay = document.querySelector(`.${OVERLAY_CLASS}`);

    document
      .getElementById("content")!
      .appendChild(document.createElement("span"));
    await flush();
    expect(document.querySelector(`.${OVERLAY_CLASS}`)).toBe(overlay);
  });

  test("applies an updated watch history to existing cards", async () => {
    blocker.setAnalyzer(analyzer());
    document.body.innerHTML = card("a", "v1", "Test Anime Season 1 Episode 3");
    await flush();
    expect(isBlocked("a")).toBe(true);

    blocker.setAnalyzer(analyzer(3));
    expect(isBlocked("a")).toBe(false);
  });

  test("blocks nothing with a null analyzer", async () => {
    blocker.setAnalyzer(null);
    document.body.innerHTML = card("a", "v1", "Test Anime Season 1 Episode 3");
    await flush();
    expect(isBlocked("a")).toBe(false);
  });

  test("ignores a card without a title and a card removed from a page", async () => {
    blocker.setAnalyzer(analyzer());
    document.body.innerHTML = `<ytd-video-renderer id="a"></ytd-video-renderer>`;
    await flush();
    expect(isBlocked("a")).toBe(false);

    const detached = document.createElement("div");
    detached.innerHTML = card("b", "v1", "Test Anime Season 1 Episode 3");
    document.body.appendChild(detached);
    detached.remove();
    await flush();
    expect(detached.querySelector(`[${STATE_ATTRIBUTE}]`)).toBeNull();
  });
});
