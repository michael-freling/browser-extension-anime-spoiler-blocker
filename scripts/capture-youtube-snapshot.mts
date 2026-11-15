// Saves a YouTube search results page for e2e tests, without scripts, styles and images.
// Usage: pnpm e2e:snapshot
import { chromium } from "@playwright/test";
import { writeFileSync } from "node:fs";

const SEARCH_QUERY = "oshi no ko season 3";
const OUTPUT = "e2e/snapshots/youtube-search.html";
// Attributes that the extension reads
const KEPT_ATTRIBUTES = ["id", "class", "href", "title", "aria-label", "dark"];

const browser = await chromium.launch({ channel: "chromium" });
const page = await browser.newPage({ locale: "en-US" });
await page.goto(
  "https://www.youtube.com/results?hl=en&gl=US&search_query=" +
    encodeURIComponent(SEARCH_QUERY),
);
await page.waitForSelector("ytd-video-renderer #video-title");
await page.waitForTimeout(3000);

const html = await page.evaluate((keptAttributes) => {
  const root = document.documentElement.cloneNode(true) as HTMLElement;
  root
    .querySelectorAll(
      "script, style, link, iframe, noscript, template, svg, img, yt-image",
    )
    .forEach((element) => element.remove());
  root.querySelectorAll("*").forEach((element) => {
    for (const attribute of Array.from(element.attributes)) {
      if (!keptAttributes.includes(attribute.name)) {
        element.removeAttribute(attribute.name);
      }
    }
  });
  return "<!doctype html>\n" + root.outerHTML;
}, KEPT_ATTRIBUTES);
await browser.close();

writeFileSync(OUTPUT, html);
console.log(`Saved ${OUTPUT} (${html.length} bytes)`);
