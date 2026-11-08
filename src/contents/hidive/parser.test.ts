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
        name: "Episode page with an unknown title",
        args: {
          title: "Cruelty",
          path: "/video/1",
          seasonId: "10",
          name: "something unknown",
        },
      },
      {
        name: "Season page of the first season",
        args: {
          title: "Oshi No Ko",
          path: "/season/123",
          name: "Oshi No Ko",
        },
        expected: {
          seasonId: "123",
          season: 1,
          title: "Oshi No Ko",
        },
      },
      {
        name: "Season page without a numeric season ID",
        args: {
          title: "Oshi No Ko",
          path: "/season/abc",
          name: "Oshi No Ko",
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
