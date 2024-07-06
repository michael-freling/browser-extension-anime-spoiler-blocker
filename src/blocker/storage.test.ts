import { UserHistoryManager } from "./storage";

describe("UserHistoryManager", () => {
  const config = {
    series: [
      {
        title: "My Hero Academia",
        keywords: ["My Hero Academia"],
      },
    ],
  };
  const userHistory = {
    series: [
      {
        title: "My Hero Academia",
        tv: {
          season: 1,
          episode: 2,
        },
      },
    ],
  };

  test.each([
    {
      name: "Watch next episode",
      message: {
        mediaType: "tv",
        titles: ["My Hero Academia"],
        season: 1,
        episode: 3,
      },
      expected: {
        userHistory: {
          series: [
            {
              title: "My Hero Academia",
              tv: {
                season: 1,
                episode: 3,
              },
            },
          ],
        },
      },
    },
    {
      name: "Watch next season",
      message: {
        mediaType: "tv",
        titles: ["My Hero Academia"],
        season: 2,
        episode: 1,
      },
      expected: {
        userHistory: {
          series: [
            {
              title: "My Hero Academia",
              tv: {
                season: 2,
                episode: 1,
              },
            },
          ],
        },
      },
    },
    {
      name: "Watch new series",
      message: {
        mediaType: "tv",
        titles: ["Demon Slayer", "Kimetsu no Yaiba"],
        season: 1,
        episode: 2,
      },
      expected: {
        config: {
          series: [
            ...config.series,
            {
              title: "Demon Slayer",
              keywords: ["Demon Slayer", "Kimetsu no Yaiba"],
            },
          ],
        },
        userHistory: {
          series: [
            ...userHistory.series,
            {
              title: "Demon Slayer",
              tv: {
                season: 1,
                episode: 2,
              },
            },
          ],
        },
      },
    },

    {
      name: "Watch the same episode",
      message: {
        mediaType: "tv",
        titles: ["My Hero Academia"],
        season: 1,
        episode: 2,
      },
    },
  ])("$name", async ({ message, expected }) => {
    const manager = new UserHistoryManager(config, userHistory);
    const actual = manager.updateWatchHistory(message);
    expect(actual).toEqual(expected);
  });
});
