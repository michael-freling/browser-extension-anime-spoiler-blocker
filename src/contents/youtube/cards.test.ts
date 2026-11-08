/**
 * @jest-environment jsdom
 */
import { findCard, findCardsIn, parseVideoId, readCard } from "./cards";

function render(html: string): HTMLElement {
  document.body.innerHTML = html;
  return document.body;
}

describe("parseVideoId", () => {
  test.each([
    ["/watch?v=abc123&t=10s", "abc123"],
    ["https://www.youtube.com/watch?v=xyz", "xyz"],
    ["/shorts/short1", "short1"],
    ["/shorts/", null],
    ["/channel/foo", null],
    ["", null],
    [null, null],
    [undefined, null],
  ])("%s", (href, expected) => {
    expect(parseVideoId(href)).toBe(expected);
  });
});

describe("findCard", () => {
  test("returns the outermost card of a nested card", () => {
    render(`
      <ytd-rich-item-renderer id="outer">
        <yt-lockup-view-model id="inner"><span id="text">title</span></yt-lockup-view-model>
      </ytd-rich-item-renderer>`);
    const text = document.getElementById("text")!;
    expect(findCard(text)!.id).toBe("outer");
    expect(findCard(text.firstChild!)!.id).toBe("outer");
  });

  test("returns null outside of cards", () => {
    render(`<div id="x">text</div>`);
    expect(findCard(document.getElementById("x")!)).toBeNull();
    expect(findCard(document)).toBeNull();
  });
});

describe("findCardsIn", () => {
  test("finds cards including the node itself without duplicates", () => {
    const root = render(`
      <ytd-video-renderer id="a">
        <yt-lockup-view-model></yt-lockup-view-model>
      </ytd-video-renderer>
      <ytd-compact-video-renderer id="b"></ytd-compact-video-renderer>`);
    expect(findCardsIn(root).map((card) => card.id)).toEqual(["a", "b"]);
    expect(
      findCardsIn(document.getElementById("a")!).map((card) => card.id),
    ).toEqual(["a"]);
  });

  test("returns nothing for non-element nodes", () => {
    expect(findCardsIn(document.createTextNode("x"))).toEqual([]);
  });
});

describe("readCard", () => {
  test.each([
    {
      name: "a title in #video-title",
      html: `<a id="video-title" href="/watch?v=v1"> Title 1 </a>`,
      expected: { videoId: "v1", title: "Title 1" },
    },
    {
      name: "a title attribute",
      html: `<h3 title="Title 2"></h3><a href="/shorts/s2">x</a>`,
      expected: { videoId: "s2", title: "Title 2" },
    },
    {
      name: "an aria-label",
      html: `<h3 aria-label="Title 3"></h3>`,
      expected: { videoId: "Title 3", title: "Title 3" },
    },
    {
      name: "an empty title",
      html: `<h3></h3>`,
      expected: null,
    },
    {
      name: "no title element",
      html: `<a href="/watch?v=v4">x</a>`,
      expected: null,
    },
  ])("$name", ({ html, expected }) => {
    render(`<ytd-video-renderer id="card">${html}</ytd-video-renderer>`);
    expect(readCard(document.getElementById("card")!)).toEqual(expected);
  });
});
