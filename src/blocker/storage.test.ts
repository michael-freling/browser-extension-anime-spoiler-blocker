import { AnimeType, JikanAPIClient } from "../jikan";
import { MediaType, UserHistoryManager } from "./storage";

describe("UserHistoryManager", () => {
  const defaultConfig = {
    series: [
      {
        title: "My Hero Academia",
        keywords: [
          "My Hero Academia",
          "My Hero Academia: Two Heroes",
          "僕のヒーローアカデミア",
          "僕のヒーローアカデミア THE MOVIE ～2人の英雄（ヒーロー）～",
        ],
        tvs: [
          {
            title: "My Hero Academia",
            keywords: ["My Hero Academia", "僕のヒーローアカデミア"],
            malId: 1,
          },
        ],
        movies: [
          {
            title: "My Hero Academia: Two Heroes",
            keywords: [
              "My Hero Academia: Two Heroes",
              "僕のヒーローアカデミア THE MOVIE ～2人の英雄（ヒーロー）～",
            ],
            malId: 2,
          },
        ],
      },
    ],
  };

  const createMyHeroAcademia = ({
    season,
    episode,
  }: {
    season: number;
    episode: number;
  }) => ({
    title: "My Hero Academia",
    tv: {
      season,
      episode,
    },
  });

  const userHistory = {
    series: [
      createMyHeroAcademia({
        season: 1,
        episode: 1,
      }),
    ],
  };

  const defaultMockJikanAPIClientResponses = {
    [AnimeType.TV]: {
      data: [
        {
          malId: 1,
          titles: [
            {
              type: "Default",
              title: "My Hero Academia",
            },
            {
              type: "Japanese",
              title: "僕のヒーローアカデミア",
            },
          ],
          title: "My Hero Academia",
          type: AnimeType.TV,
        },
        {
          malId: 99,
          titles: [
            {
              type: "English",
              // no title "My Hero Academia" is included in any title
              title: "This is excluded",
            },
          ],
          title: "This is excluded",
          type: AnimeType.TV,
        },
      ],
    },
    [AnimeType.Movie]: {
      data: [
        {
          malId: 2,
          titles: [
            {
              type: "English",
              title: "My Hero Academia: Two Heroes",
            },
            {
              type: "Japanese",
              title:
                "僕のヒーローアカデミア THE MOVIE ～2人の英雄（ヒーロー）～",
            },
          ],
          title: "My Hero Academia: Two Heroes",
          type: AnimeType.Movie,
        },
        {
          malId: 99,
          titles: [
            {
              type: "English",
              // no title "My Hero Academia" is included in any title
              title: "This is excluded",
            },
          ],
          title: "This is excluded",
          type: AnimeType.Movie,
        },
      ],
    },
  };

  test.each([
    {
      name: "Watch next episode, update the config",
      message: {
        mediaType: MediaType.TVShows,
        titles: ["My Hero Academia"],
        season: 1,
        episode: 3,
      },
      config: {
        series: [
          {
            title: "My Hero Academia",
            keywords: ["My Hero Academia", "僕のヒーローアカデミア"],
          },
        ],
      },
      mockJikanAPIClientResponses: defaultMockJikanAPIClientResponses,
      expected: {
        config: defaultConfig,
        userHistory: {
          series: [
            createMyHeroAcademia({
              season: 1,
              episode: 3,
            }),
          ],
        },
      },
    },
    {
      name: "Watch next season, no update for a config",
      message: {
        mediaType: "tv",
        titles: ["My Hero Academia"],
        season: 2,
        episode: 1,
      },
      expected: {
        userHistory: {
          series: [
            createMyHeroAcademia({
              season: 2,
              episode: 1,
            }),
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
      mockJikanAPIClientResponses: {
        [AnimeType.TV]: {
          data: [
            {
              malId: 3,
              titles: [
                {
                  type: "Default",
                  title: "Demon Slayer",
                },
                {
                  type: "Japanese",
                  title: "鬼滅の刃",
                },
              ],
              title: "Demon Slayer",
              type: "tv",
            },
          ],
        },
        [AnimeType.Movie]: {
          data: [
            {
              malId: 4,
              titles: [
                {
                  type: "Default",
                  title:
                    "Demon Slayer: Kimetsu no Yaiba - The Movie: Mugen Train",
                },
                {
                  type: "Japanese",
                  title: "劇場版 鬼滅の刃 無限列車編",
                },
              ],
              title: "Demon Slayer: Kimetsu no Yaiba - The Movie: Mugen Train",
              type: "movie",
            },
          ],
        },
      },
      expected: {
        config: {
          series: [
            ...defaultConfig.series,
            {
              title: "Demon Slayer",
              keywords: [
                "Demon Slayer",
                "Demon Slayer: Kimetsu no Yaiba - The Movie: Mugen Train",
                "Kimetsu no Yaiba",
                "劇場版 鬼滅の刃 無限列車編",
                "鬼滅の刃",
              ],
              tvs: [
                {
                  title: "Demon Slayer",
                  keywords: ["Demon Slayer", "鬼滅の刃"],
                  malId: 3,
                },
              ],
              movies: [
                {
                  title:
                    "Demon Slayer: Kimetsu no Yaiba - The Movie: Mugen Train",
                  keywords: [
                    "Demon Slayer: Kimetsu no Yaiba - The Movie: Mugen Train",
                    "劇場版 鬼滅の刃 無限列車編",
                  ],
                  malId: 4,
                },
              ],
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
  ])(
    "$name",
    async ({ message, config, mockJikanAPIClientResponses, expected }) => {
      const mockJikanAPIClient: jest.Mocked<JikanAPIClient> = {
        baseURL: "mock url",
        searchAnime: jest.fn().mockImplementation(({ type }) => {
          const response =
            mockJikanAPIClientResponses == null
              ? defaultMockJikanAPIClientResponses[type]
              : mockJikanAPIClientResponses[type];
          return response;
        }),
      };

      const manager = new UserHistoryManager(
        config == null ? defaultConfig : config,
        userHistory,
        mockJikanAPIClient
      );
      const actual = manager.updateWatchHistory(message);
      expect(actual).resolves.toEqual(expected);
    }
  );
});
