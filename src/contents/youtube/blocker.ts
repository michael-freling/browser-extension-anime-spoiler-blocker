import type { TextSpoilerAnalyzer } from "~blocker";
import { findCard, findCardsIn, readCard, CARD_SELECTOR } from "./cards";
import {
  applyBlock,
  createOverlay,
  injectStyles,
  removeBlock,
  PENDING_CLASS,
} from "./overlay";

interface CardState {
  // The video ID and title that were analyzed last time
  key: string;
}

/**
 * Blocks spoilers in YouTube video cards.
 *
 * Instead of scanning the whole page periodically, it only analyzes cards that
 * were added or changed, using a MutationObserver. Its callback runs before the
 * browser paints, so a spoiler is blocked before it is shown.
 * YouTube reuses card elements for other videos, so each card is re-analyzed
 * whenever its video ID or title changes.
 */
export class YouTubeSpoilerBlocker {
  private analyzer: TextSpoilerAnalyzer | null = null;
  private states = new WeakMap<Element, CardState>();
  // Videos the user chose to show, which stay visible until the tab is closed
  private shownVideoIds = new Set<string>();
  private observer: MutationObserver;

  constructor(private doc: Document = document) {
    this.observer = new MutationObserver((records) =>
      this.onMutations(records),
    );
  }

  start() {
    injectStyles(this.doc);
    // Hide cards until the configuration is loaded, so that spoilers do not flash
    this.doc.documentElement.classList.add(PENDING_CLASS);
    this.observer.observe(this.doc.documentElement, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["href", "title"],
    });
  }

  stop() {
    this.observer.disconnect();
  }

  /**
   * Set an analyzer and analyze all cards again, e.g. after a watch history is updated.
   * When it's null, nothing is blocked.
   */
  setAnalyzer(analyzer: TextSpoilerAnalyzer | null) {
    this.analyzer = analyzer;
    this.doc.documentElement.classList.remove(PENDING_CLASS);
    findCardsIn(this.doc.documentElement).forEach((card) =>
      this.evaluate(card, true),
    );
  }

  private onMutations(records: MutationRecord[]) {
    if (this.analyzer == null) {
      return;
    }

    const cards = new Set<Element>();
    records.forEach((record) => {
      const card = findCard(record.target);
      if (card != null) {
        cards.add(card);
      }
      record.addedNodes.forEach((node) => {
        findCardsIn(node).forEach((card) => cards.add(card));
      });
    });
    cards.forEach((card) => this.evaluate(card, false));
  }

  private evaluate(card: Element, force: boolean) {
    if (!card.isConnected || !card.matches(CARD_SELECTOR)) {
      return;
    }

    const info = readCard(card);
    const key = info == null ? "" : `${info.videoId}\n${info.title}`;
    if (!force && this.states.get(card)?.key === key) {
      return;
    }
    this.states.set(card, { key });
    removeBlock(card);

    if (
      info == null ||
      this.analyzer == null ||
      this.shownVideoIds.has(info.videoId)
    ) {
      return;
    }
    const spoiler = this.analyzer.extractSpoiler(info.title);
    if (spoiler.title == "") {
      return;
    }

    const overlay = createOverlay(this.doc, spoiler, () => {
      this.shownVideoIds.add(info.videoId);
      removeBlock(card);
      // Keep the keyboard focus on the card that was just shown
      (card.querySelector("a[href]") as HTMLElement | null)?.focus();
    });
    applyBlock(card, overlay);
  }
}
