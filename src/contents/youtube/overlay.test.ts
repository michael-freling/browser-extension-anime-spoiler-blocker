/**
 * @jest-environment jsdom
 */
import {
  applyBlock,
  createOverlay,
  describeSpoiler,
  injectStyles,
  removeBlock,
  OVERLAY_CLASS,
  STATE_ATTRIBUTE,
  STYLE_ID,
} from "./overlay";

describe("injectStyles", () => {
  afterEach(() => {
    document.getElementById(STYLE_ID)?.remove();
  });

  test("injects a style only once", () => {
    injectStyles(document);
    injectStyles(document);
    expect(document.querySelectorAll(`#${STYLE_ID}`)).toHaveLength(1);
    expect(document.head.contains(document.getElementById(STYLE_ID))).toBe(
      true,
    );
  });

  test("falls back to the document element without a head", () => {
    document.head.remove();
    injectStyles(document);
    expect(document.getElementById(STYLE_ID)!.parentElement).toBe(
      document.documentElement,
    );
  });
});

describe("describeSpoiler", () => {
  test.each([
    [{ title: "A" }, "A"],
    [{ title: "A", season: 2 }, "A Season 2"],
    [{ title: "A", season: 2, episode: 5 }, "A Season 2 Episode 5"],
  ])("%j", (spoiler, expected) => {
    expect(describeSpoiler(spoiler)).toBe(expected);
  });
});

describe("createOverlay", () => {
  test("renders an accessible overlay and calls onShow on click", () => {
    const onShow = jest.fn();
    const parentClick = jest.fn();
    const overlay = createOverlay(
      document,
      { title: "A", season: 1, episode: 2 },
      onShow,
    );
    const parent = document.createElement("a");
    parent.addEventListener("click", parentClick);
    parent.appendChild(overlay);
    document.body.appendChild(parent);

    expect(overlay.getAttribute("role")).toBe("group");
    expect(overlay.getAttribute("aria-label")).toBe(
      "Possible spoiler hidden: A Season 1 Episode 2",
    );
    const button = overlay.querySelector("button")!;
    expect(button.getAttribute("aria-label")).toBe(
      "Show video for A Season 1 Episode 2",
    );

    const event = new MouseEvent("click", { bubbles: true, cancelable: true });
    button.dispatchEvent(event);
    expect(onShow).toHaveBeenCalledTimes(1);
    expect(event.defaultPrevented).toBe(true);
    expect(parentClick).not.toHaveBeenCalled();
  });
});

describe("applyBlock and removeBlock", () => {
  test("blocks and unblocks a card without touching inert set by others", () => {
    document.body.innerHTML = `
      <div id="card"><div id="content"></div><div id="other" inert></div></div>`;
    const card = document.getElementById("card")!;
    const overlay = createOverlay(document, { title: "A" }, () => {});

    applyBlock(card, overlay);
    expect(card.getAttribute(STATE_ATTRIBUTE)).toBe("blocked");
    expect(document.getElementById("content")!.hasAttribute("inert")).toBe(
      true,
    );
    expect(card.querySelector(`.${OVERLAY_CLASS}`)).toBe(overlay);

    removeBlock(card);
    expect(card.hasAttribute(STATE_ATTRIBUTE)).toBe(false);
    expect(document.getElementById("content")!.hasAttribute("inert")).toBe(
      false,
    );
    expect(document.getElementById("other")!.hasAttribute("inert")).toBe(true);
    expect(card.querySelector(`.${OVERLAY_CLASS}`)).toBeNull();
  });
});
