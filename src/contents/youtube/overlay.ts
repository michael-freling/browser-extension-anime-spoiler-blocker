import type { Spoiler } from "~blocker";
import { CARD_SELECTOR } from "./cards";

export const STYLE_ID = "anime-spoiler-blocker-style";
export const PENDING_CLASS = "asb-pending";
export const OVERLAY_CLASS = "asb-overlay";
export const STATE_ATTRIBUTE = "data-asb-state";
const INERT_ATTRIBUTE = "data-asb-inert";

// YouTube sets the "dark" attribute on <html> for the dark theme,
// and its root font size is 10px, so 1.4rem is 14px like YouTube's own text.
export const STYLES = `
:root {
  --asb-bg: rgba(255, 255, 255, 0.88);
  --asb-fg: #0f0f0f;
  --asb-accent: #c43c00;
  --asb-button-bg: #0f0f0f;
  --asb-button-fg: #ffffff;
}
html[dark] {
  --asb-bg: rgba(15, 15, 15, 0.88);
  --asb-fg: #f1f1f1;
  --asb-accent: #ff8a50;
  --asb-button-bg: #f1f1f1;
  --asb-button-fg: #0f0f0f;
}
html.${PENDING_CLASS} :is(${CARD_SELECTOR}) {
  visibility: hidden !important;
}
[${STATE_ATTRIBUTE}="blocked"] {
  position: relative !important;
}
[${STATE_ATTRIBUTE}="blocked"] > :not(.${OVERLAY_CLASS}) {
  filter: blur(24px) !important;
  pointer-events: none !important;
  user-select: none !important;
}
.${OVERLAY_CLASS} {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  box-sizing: border-box;
  overflow: hidden;
  border-radius: 12px;
  background: var(--asb-bg);
  color: var(--asb-fg);
  font-family: "Roboto", "Arial", sans-serif;
  font-size: 1.4rem;
  line-height: 2rem;
  text-align: center;
}
.${OVERLAY_CLASS}__label {
  font-weight: 500;
  color: var(--asb-accent);
}
.${OVERLAY_CLASS}__button {
  font: inherit;
  font-weight: 500;
  padding: 6px 16px;
  border: 0;
  border-radius: 18px;
  cursor: pointer;
  background: var(--asb-button-bg);
  color: var(--asb-button-fg);
}
.${OVERLAY_CLASS}__button:focus-visible {
  outline: 2px solid var(--asb-accent);
  outline-offset: 2px;
}
`;

export function injectStyles(doc: Document) {
  if (doc.getElementById(STYLE_ID) != null) {
    return;
  }
  const style = doc.createElement("style");
  style.id = STYLE_ID;
  style.textContent = STYLES;
  (doc.head ?? doc.documentElement).appendChild(style);
}

export function describeSpoiler(spoiler: Spoiler): string {
  let details = spoiler.title;
  if (spoiler.season) {
    details += ` Season ${spoiler.season}`;
  }
  if (spoiler.episode) {
    details += ` Episode ${spoiler.episode}`;
  }
  return details;
}

export function createOverlay(
  doc: Document,
  spoiler: Spoiler,
  onShow: () => void,
): HTMLElement {
  const details = describeSpoiler(spoiler);

  const overlay = doc.createElement("div");
  overlay.className = OVERLAY_CLASS;
  overlay.setAttribute("role", "group");
  overlay.setAttribute("aria-label", `Possible spoiler hidden: ${details}`);

  const label = doc.createElement("div");
  label.className = `${OVERLAY_CLASS}__label`;
  label.textContent = "Possible spoiler hidden";

  const description = doc.createElement("div");
  description.textContent = details;

  const button = doc.createElement("button");
  button.type = "button";
  button.className = `${OVERLAY_CLASS}__button`;
  button.textContent = "Show";
  button.setAttribute("aria-label", `Show video for ${details}`);
  button.addEventListener("click", (event) => {
    // Do not open the video behind the overlay
    event.preventDefault();
    event.stopPropagation();
    onShow();
  });

  overlay.append(label, description, button);
  return overlay;
}

/**
 * Blur a card and cover it with an overlay. Blurred contents are made inert
 * so that keyboard and screen reader users do not reach the spoiler either.
 */
export function applyBlock(card: Element, overlay: HTMLElement) {
  card.setAttribute(STATE_ATTRIBUTE, "blocked");
  Array.from(card.children).forEach((child) => {
    if (
      child.classList.contains(OVERLAY_CLASS) ||
      child.hasAttribute("inert")
    ) {
      return;
    }
    child.setAttribute("inert", "");
    child.setAttribute(INERT_ATTRIBUTE, "");
  });
  card.appendChild(overlay);
}

export function removeBlock(card: Element) {
  card.removeAttribute(STATE_ATTRIBUTE);
  Array.from(card.children).forEach((child) => {
    if (child.classList.contains(OVERLAY_CLASS)) {
      child.remove();
      return;
    }
    if (child.hasAttribute(INERT_ATTRIBUTE)) {
      child.removeAttribute("inert");
      child.removeAttribute(INERT_ATTRIBUTE);
    }
  });
}
