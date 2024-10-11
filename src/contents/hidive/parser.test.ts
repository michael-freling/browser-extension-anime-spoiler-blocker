import { parse } from "./parser";

describe("parse", () => {
  describe("season page", () => {
    test.each([
      {
        name: "Season page",
        args: {
          title: "Oshi No Ko - HIDIVE",
          path: "/season/24567",
          name: "Season 2",
        },
        expected: {
          season: 2,
          seasonId: "24567",
          title: "Oshi No Ko",
        },
      },
      {
        name: "Episode page",
        args: {
          title: "E1 - Cruelty",
          path: "/video/1",
          seasonId: "10",
          name: "something unknown",
        },
        expected: {
          seasonId: "10",
          episode: 1,
        },
      },
      {
        name: "Episode page without a season ID",
        args: {
          title: "E1 - Cruelty",
          path: "/video/1",
          name: "something unknown",
        },
      },
    ])(`$name`, ({ args, expected }) => {
      expect(parse(args)).toEqual(expected);
    });
  });
});
