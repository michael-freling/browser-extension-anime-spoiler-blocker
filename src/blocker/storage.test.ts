import { AnimeType, JikanAPIClient, SearchAnimeResponse } from "../jikan";
import {
  MediaType,
  StorageAnimeConfig,
  StorageUserHistory,
  UpdateWatchHistoryArg,
  UserHistoryManager,
} from "./storage";

export function newStorageAnimeConfig(
  args: Partial<StorageAnimeConfig>
): StorageAnimeConfig {
  return mergeObjects(
    1,
    {
      series: [],
      hidive: [
        {
          seasonId: "11",
          season: 1,
          title: "My Hero Academia",
        },
      ],
    },
    args
  );
}

function mergeObjects<T>(depth: number = 1, ...allProps: Object[]): T {
  if (depth != 1) {
    throw new Error("Invalid argument depth: " + depth);
  }
  let result = {};
  for (let props of allProps) {
    Object.keys(props).forEach((key) => {
      //   console.debug({
      //     key,
      //     value: props[key],
      //     type: typeof props[key],
      //     result: result[key],
      //   });
      if (Array.isArray(props[key])) {
        if (result[key] === undefined) {
          result[key] = [];
        }
        result[key] = [...result[key], ...props[key]];
        return;
      }
      if (typeof props[key] === "string") {
        result[key] = props[key];
        return;
      }
      if (typeof props[key] === "object") {
        result[key] = {
          ...result[key],
          ...props[key],
        };
        return;
      }
      throw new Error("Invalid type: " + typeof props[key]);
    });
  }
  return result as T;
}

describe("UserHistoryManager", () => {
  const defaultConfig = newStorageAnimeConfig({
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
  });

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

  const runTest = async (args: {
    message: UpdateWatchHistoryArg;
    config: StorageAnimeConfig;
    mockJikanAPIClientResponses?: {
      [type: string]: SearchAnimeResponse;
    };
    expected: {
      config: StorageAnimeConfig;
      userHistory: StorageUserHistory;
    };
  }) => {
    const { message, config, mockJikanAPIClientResponses, expected } = args;

    const mockJikanAPIClient: jest.Mocked<JikanAPIClient> = {
      baseURL: "mock url",
      searchAnime: jest.fn().mockImplementation(({ type }) => {
        return mockJikanAPIClientResponses[type];
      }),
    };

    const manager = new UserHistoryManager(
      structuredClone(config),
      structuredClone(userHistory),
      mockJikanAPIClient
    );
    const actual = manager.updateWatchHistory(message);
    await expect(actual).resolves.toEqual(expected);
  };

  const defaultTestCase = {
    config: defaultConfig,
    mockJikanAPIClientResponses: defaultMockJikanAPIClientResponses,
  };

  describe("Crunchyroll", () => {
    const testCases = [
      {
        name: "Watch next episode, update the config",
        message: {
          mediaType: MediaType.TVShows,
          titles: ["My Hero Academia"],
          season: 1,
          episode: 3,
        },
        config: newStorageAnimeConfig({
          series: [
            {
              title: "My Hero Academia",
              keywords: ["My Hero Academia", "僕のヒーローアカデミア"],
            },
          ],
        }),
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
                title:
                  "Demon Slayer: Kimetsu no Yaiba - The Movie: Mugen Train",
                type: "movie",
              },
            ],
          },
        },
        expected: {
          config: newStorageAnimeConfig({
            series: [
              ...defaultConfig.series,
              {
                title: "Demon Slayer",
                keywords: [
                  "Demon Slayer",
                  "Demon Slayer: Kimetsu no Yaiba - The Movie: Mugen Train",
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
          }),
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
        name: "Watch the episode already watched",
        message: {
          mediaType: "tv",
          titles: ["My Hero Academia"],
          season: 1,
          episode: 1,
        },
      },
    ].map((props) =>
      mergeObjects(
        1,
        defaultTestCase,
        {
          message: {
            webServiceName: "Crunchyroll",
          },
        },
        props
      )
    ) as any;
    test.each(testCases)("$name", runTest);
  });

  describe("HIDIVE", () => {
    describe("season page", () => {
      const testCases = [
        {
          name: "Watch new anime, no similar shows was found from Jikan API",
          message: {
            mediaType: MediaType.TVShows,
            title: "Demon Slayer",
            season: 1,
            seasonId: "20",
          },
          expected: {
            config: newStorageAnimeConfig({
              series: [
                ...defaultConfig.series,
                {
                  title: "Demon Slayer",
                  keywords: ["Demon Slayer"],
                  tvs: [],
                  movies: [],
                },
              ],
              hidive: [
                {
                  title: "Demon Slayer",
                  seasonId: "20",
                  season: 1,
                },
              ],
            }),
          },
        },
        {
          name: "Watch new anime",
          message: {
            mediaType: MediaType.TVShows,
            title: "Demon Slayer",
            season: 1,
            seasonId: "20",
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
                  title:
                    "Demon Slayer: Kimetsu no Yaiba - The Movie: Mugen Train",
                  type: "movie",
                },
              ],
            },
          },
          expected: {
            config: newStorageAnimeConfig({
              series: [
                ...defaultConfig.series,
                {
                  title: "Demon Slayer",
                  keywords: [
                    "Demon Slayer",
                    "Demon Slayer: Kimetsu no Yaiba - The Movie: Mugen Train",
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
              hidive: [
                {
                  title: "Demon Slayer",
                  seasonId: "20",
                  season: 1,
                },
              ],
            }),
          },
        },
        {
          name: "Watch new season already watched",
          message: {
            mediaType: MediaType.TVShows,
            title: "My Hero Academia",
            season: 2,
            seasonId: "12",
          },
          expected: {
            config: {
              series: defaultConfig.series,
              hidive: [
                ...defaultConfig.hidive,
                {
                  title: "My Hero Academia",
                  seasonId: "12",
                  season: 2,
                },
              ],
            },
          },
        },
        {
          name: "Watch the same season",
          message: {
            mediaType: MediaType.TVShows,
            title: "My Hero Academia",
            season: 1,
            seasonId: "11",
          },
          config: {
            series: defaultConfig.series,
            // hidive:
          },
        },
      ].map((props) =>
        mergeObjects(
          1,
          defaultTestCase,
          {
            message: {
              webServiceName: "HIDIVE",
            },
          },
          props
        )
      ) as any;
      test.each(testCases)("$name", runTest);
    });

    describe("video page", () => {
      const testCases = [
        {
          name: "Watch new episode for an anime already watched",
          message: {
            mediaType: MediaType.TVShows,
            seasonId: "11",
            episode: 2,
          },
          expected: {
            userHistory: {
              series: [
                createMyHeroAcademia({
                  season: 1,
                  episode: 2,
                }),
              ],
            },
          },
        },
        {
          name: "Watch same episode for an anime already watched",
          message: {
            mediaType: MediaType.TVShows,
            seasonId: "11",
            episode: 1,
          },
        },
        {
          name: "Watch an episode for an anime which season is unknown",
          message: {
            mediaType: MediaType.TVShows,
            seasonId: "99",
            episode: 1,
          },
        },
      ].map((props) =>
        mergeObjects(
          1,
          defaultTestCase,
          {
            message: {
              webServiceName: "HIDIVE",
            },
          },
          props
        )
      ) as any;
      test.each(testCases)("$name", runTest);
    });
  });
});
