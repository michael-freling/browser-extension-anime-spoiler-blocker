import handler from "./messages/getConfig";
import { areas, resetStorage } from "~test/plasmoStorage";

jest.mock("@plasmohq/storage", () => require("~test/plasmoStorage"));

async function callHandler() {
  const res = { send: jest.fn() };
  await handler({ name: "getConfig" } as any, res as any);
  return res.send.mock.calls[0][0];
}

beforeEach(resetStorage);

test("returns an empty configuration right after an installation", async () => {
  expect(await callHandler()).toEqual({
    config: { series: [] },
    userHistory: { series: [] },
  });
});

test("returns series configurations of a watch history", async () => {
  const userHistory = {
    series: [
      { title: "A", tv: { season: 1, episode: 1 } },
      { title: "B", tv: { season: 1, episode: 1 } },
    ],
  };
  areas.sync.set("userHistory", userHistory);
  areas.local.set("series.A", { title: "A", keywords: ["A"] });

  expect(await callHandler()).toEqual({
    // B is skipped because its configuration is missing
    config: { series: [{ title: "A", keywords: ["A"] }] },
    userHistory,
  });
});

test("handles a watch history without series", async () => {
  areas.sync.set("userHistory", {});
  expect((await callHandler()).config).toEqual({ series: [] });
});
