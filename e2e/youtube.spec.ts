import type { Page } from "@playwright/test";
import { expect, SEARCH_URL, test } from "./fixtures";

const CARDS = "ytd-video-renderer";
const BLOCKED_CARDS = `${CARDS}[data-asb-state="blocked"]`;

// Every video in the snapshot is about Oshi No Ko season 3
const series = {
  "Oshi No Ko": {
    title: "Oshi No Ko",
    keywords: ["Oshi No Ko", "[Oshi no Ko]", "【推しの子】"],
  },
};
const hidive = {
  series: [{ title: "Oshi No Ko", season: 2, seasonId: "24567" }],
};
const watched = (season: number, episode: number) => ({
  series: [{ title: "Oshi No Ko", tv: { season, episode } }],
});

async function openSearch(page: Page) {
  await page.goto(SEARCH_URL);
  // The extension is running
  await expect(page.locator("#anime-spoiler-blocker-style")).toHaveCount(1);
  // Cards are hidden until the configuration is loaded
  await expect(page.locator("html")).not.toHaveClass(/asb-pending/);
  await expect(page.locator(CARDS).first()).toBeVisible();
}

// Add a copy of the first card with another title, like YouTube does on scroll
async function addCard(page: Page, title: string) {
  await page.evaluate(
    ({ selector, title }) => {
      const source = document.querySelector(selector)!;
      const card = source.cloneNode(true) as Element;
      card.removeAttribute("data-asb-state");
      card.querySelector(".asb-overlay")?.remove();
      card
        .querySelectorAll("[inert]")
        .forEach((e) => e.removeAttribute("inert"));
      const link = card.querySelector("#video-title")!;
      link.textContent = title;
      link.setAttribute("href", `/watch?v=${encodeURIComponent(title)}`);
      source.parentElement!.appendChild(card);
    },
    { selector: CARDS, title },
  );
}

test("blocks videos about a later season", async ({ page, seedStorage }) => {
  await seedStorage({ hidive, userHistory: watched(2, 13), series });
  await openSearch(page);

  const count = await page.locator(CARDS).count();
  expect(count).toBeGreaterThan(0);
  await expect(page.locator(BLOCKED_CARDS)).toHaveCount(count);
  await expect(page.locator(BLOCKED_CARDS).first()).toContainText(
    "Possible spoiler hidden",
  );
});

test("does not block anything without a watch history", async ({
  page,
  seedStorage,
}) => {
  // Only a HIDIVE season page was opened: no episode is in the watch history
  await seedStorage({ hidive, series });
  await openSearch(page);

  await expect(page.locator(BLOCKED_CARDS)).toHaveCount(0);
});

test("shows a video when Show is clicked", async ({ page, seedStorage }) => {
  await seedStorage({ userHistory: watched(2, 13), series });
  await openSearch(page);
  const count = await page.locator(BLOCKED_CARDS).count();

  const first = page.locator(CARDS).first();
  await first.getByRole("button", { name: /^Show video for/ }).click();
  await expect(first).not.toHaveAttribute("data-asb-state", "blocked");
  await expect(page.locator(BLOCKED_CARDS)).toHaveCount(count - 1);
});

test("applies a new watch history without reloading", async ({
  page,
  seedStorage,
}) => {
  await seedStorage({ userHistory: watched(2, 13), series });
  await openSearch(page);
  await expect(page.locator(BLOCKED_CARDS).first()).toBeVisible();

  await seedStorage({ userHistory: watched(3, 1) });
  await expect(page.locator(BLOCKED_CARDS)).toHaveCount(0);
});

test("checks videos added after the page is loaded", async ({
  page,
  seedStorage,
}) => {
  await seedStorage({ userHistory: watched(3, 1), series });
  await openSearch(page);

  await addCard(page, "Oshi No Ko Season 4 Episode 1 reaction");
  await addCard(page, "Cooking a quick dinner");

  await expect(
    page.locator(BLOCKED_CARDS).filter({ hasText: "Oshi No Ko Season 4" }),
  ).toHaveCount(1);
  await expect(page.locator(BLOCKED_CARDS)).toHaveCount(1);
});
