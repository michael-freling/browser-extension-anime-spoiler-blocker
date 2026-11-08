import handler from "./messages/updateWatchHistory";
import { UserHistoryManager } from "~blocker/storage";
import { areas, resetStorage } from "~test/plasmoStorage";

jest.mock("@plasmohq/storage", () => require("~test/plasmoStorage"));

const updateWatchHistory = jest.spyOn(
  UserHistoryManager.prototype,
  "updateWatchHistory",
);

async function callHandler(body: any) {
  await handler(
    { name: "updateWatchHistory", body } as any,
    {
      send: jest.fn(),
    } as any,
  );
}

beforeEach(() => {
  resetStorage();
  updateWatchHistory.mockReset();
});

test("ignores media other than TV shows", async () => {
  await callHandler({ webServiceName: "Crunchyroll", mediaType: "movie" });
  expect(updateWatchHistory).not.toHaveBeenCalled();
});

test("stores updated configurations", async () => {
  areas.local.set("series.A", { title: "A", keywords: [] });
  const series = { title: "A", keywords: ["A"] };
  const hidiveConfig = { series: [] };
  const userHistory = {
    series: [{ title: "A", tv: { season: 1, episode: 2 } }],
  };
  updateWatchHistory.mockResolvedValue({ series, hidiveConfig, userHistory });

  const body = {
    webServiceName: "Crunchyroll",
    mediaType: "tv",
    title: "A",
    season: 1,
    episode: 2,
  };
  await callHandler(body);
  expect(updateWatchHistory).toHaveBeenCalledWith(
    { title: "A", keywords: [] },
    body,
  );
  expect(areas.local.get("series.A")).toEqual(series);
  expect(areas.sync.get("hidive")).toEqual(hidiveConfig);
  expect(areas.sync.get("userHistory")).toEqual(userHistory);
});

test("finds a title of a HIDIVE season", async () => {
  areas.sync.set("hidive", {
    series: [{ seasonId: "1", season: 2, title: "B" }],
  });
  areas.local.set("series.B", { title: "B", keywords: [] });
  updateWatchHistory.mockResolvedValue({});

  await callHandler({
    webServiceName: "HIDIVE",
    mediaType: "tv",
    seasonId: "1",
    episode: 3,
  });
  expect(updateWatchHistory.mock.calls[0][0]).toEqual({
    title: "B",
    keywords: [],
  });
  expect(areas.sync.has("userHistory")).toBe(false);
});

test("does nothing for an unknown HIDIVE season without updates", async () => {
  updateWatchHistory.mockResolvedValue(undefined);
  await callHandler({
    webServiceName: "HIDIVE",
    mediaType: "tv",
    seasonId: "unknown",
    episode: 3,
  });
  expect(updateWatchHistory.mock.calls[0][0]).toBeUndefined();
  expect(areas.sync.size).toBe(0);
});
