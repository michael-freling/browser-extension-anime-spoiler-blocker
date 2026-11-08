// Video cards on YouTube. Some layouts nest one card inside another,
// e.g. yt-lockup-view-model inside ytd-rich-item-renderer, and the outermost one is used.
export const CARD_SELECTORS = [
  // Home and subscriptions grid
  "ytd-rich-item-renderer",
  // Search results
  "ytd-video-renderer",
  // Watch page recommendations (legacy layout)
  "ytd-compact-video-renderer",
  // Channel videos (legacy layout)
  "ytd-grid-video-renderer",
  // Playlist page and the playlist panel on a watch page
  "ytd-playlist-video-renderer",
  "ytd-playlist-panel-video-renderer",
  // Shorts shelves
  "ytd-reel-item-renderer",
  "ytm-shorts-lockup-view-model",
  // Newer layout used by recommendations and the home feed
  "yt-lockup-view-model",
];
export const CARD_SELECTOR = CARD_SELECTORS.join(",");

const TITLE_SELECTOR = [
  "#video-title",
  ".yt-lockup-metadata-view-model__title",
  ".yt-lockup-metadata-view-model-wiz__title",
  ".shortsLockupViewModelHostMetadataTitle",
  "h3",
].join(",");

const VIDEO_LINK_SELECTOR = 'a[href*="/watch?"], a[href*="/shorts/"]';

export interface CardInfo {
  videoId: string;
  title: string;
}

/**
 * Find the outermost video card that contains a node.
 */
export function findCard(node: Node): Element | null {
  const element = node instanceof Element ? node : node.parentElement;
  let card = element?.closest(CARD_SELECTOR) ?? null;
  while (card?.parentElement != null) {
    const outer = card.parentElement.closest(CARD_SELECTOR);
    if (outer == null) {
      break;
    }
    card = outer;
  }
  return card;
}

/**
 * Find all outermost video cards inside a node, including the node itself.
 */
export function findCardsIn(node: Node): Element[] {
  if (!(node instanceof Element)) {
    return [];
  }
  const cards = new Set<Element>();
  if (node.matches(CARD_SELECTOR)) {
    cards.add(findCard(node)!);
  }
  node.querySelectorAll(CARD_SELECTOR).forEach((element) => {
    cards.add(findCard(element)!);
  });
  return Array.from(cards);
}

export function parseVideoId(href: string | null | undefined): string | null {
  if (!href) {
    return null;
  }
  const url = new URL(href, "https://www.youtube.com");
  if (url.pathname.startsWith("/shorts/")) {
    return url.pathname.split("/")[2] || null;
  }
  return url.searchParams.get("v");
}

/**
 * Read the video ID and title of a card.
 * textContent is used instead of innerText because innerText forces a layout.
 */
export function readCard(card: Element): CardInfo | null {
  const titleElement = card.querySelector(TITLE_SELECTOR);
  if (titleElement == null) {
    return null;
  }
  const title =
    titleElement.textContent?.trim() ||
    titleElement.getAttribute("title") ||
    titleElement.getAttribute("aria-label") ||
    "";
  if (title == "") {
    return null;
  }

  const link = card.querySelector(VIDEO_LINK_SELECTOR);
  const videoId = parseVideoId(link?.getAttribute("href")) ?? title;
  return { videoId, title };
}
