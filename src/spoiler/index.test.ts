import { TextSpoilerAnalyzer } from ".";

describe("TextParser", () => {
  describe("extractEpisodeFromText", () => {
    const defaultTestCase = {
      keywords: ["test1", "keyword1"],
      expected: {
        title: "Test",
        season: 12,
        episode: 34,
      },
    };

    const testCases = [
      {
        name: "A text with a season and episode",
        text: "Test1 Season 12 Episode 34",
      },
      {
        name: "Text is Season N (Ep N)",
        text: "Keyword1 Season 12 (Ep 34)",
      },
      {
        // TODO: How to handle an episode if there is a part?
        name: "Text is Season N Part M Episode L",
        text: "Test1 Season 12 Part 99 Episode 34",
      },
      {
        name: "Text is Season N (Ep N)",
        text: "Keyword1 Season 12 (Ep 34)",
      },
      {
        name: "Text is Season N Part M Episode L",
        text: "Test1 Season 12 Part 99 Episode 34",
      },
      {
        name: "Text is SN EpN",
        text: "Test1 S12 Ep34",
      },
      {
        name: "Text doesn't include a season",
        text: "Test1 Episode 34",
        expected: {
          title: "Test",
          season: 1,
          episode: 34,
        },
      },
      {
        name: "Text doesn't include an episode",
        text: "Test1 Season 12",
        expected: {
          title: "Test",
          season: 12,
        },
      },
      {
        name: "Text doesn't include a season nor an episode",
        text: "New Test1 information",
        expected: {
          title: "Test",
        },
      },

      {
        name: "text is matched with no keyword",
        text: "Unknown text",
        expected: null,
      },
    ];
    test.each(testCases)("$name", (arg) => {
      const { keywords, text, expected } = {
        ...defaultTestCase,
        ...arg,
      };
      const textParser = new TextSpoilerAnalyzer(
        {
          series: {
            test: {
              keywords,
              title: "",
            },
          },
        },
        {
          series: {
            test: {
              tv: {
                season: 0,
                episode: 0,
              },
            },
          },
        }
      );
      const actual = textParser.extractEpisodeFromText(text, "Test", keywords);
      expect(actual).toEqual(expected);
    });
  });

  describe("extractSpoilerEpisode", () => {
    const defaultTestCase = {
      config: {
        series: {
          test1: {
            title: "Test",
            keywords: ["test1", "keyword1"],
          },
          test2: {
            title: "Test2",
            keywords: ["test2"],
          },
        },
      },
      userHistory: {
        series: {
          test1: {
            tv: {
              season: 1,
              episode: 2,
            },
          },
          test2: {
            tv: {
              season: 2,
              episode: 1,
            },
          },
        },
      },
      expected: {
        title: "Test",
        season: 12,
        episode: 34,
      },
    };

    const nonSpoilerResult = {
      title: "",
      season: 0,
      episode: 0,
    };
    const testCases = [
      {
        name: "A spoiler text",
        text: "Test1 Season 1 Episode 3",
        expected: {
          title: "Test",
          season: 1,
          episode: 3,
        },
      },
      {
        name: "A non spoiler text because episode == history.episode",
        text: "Test1 Season 1 Episode 2",
        expected: nonSpoilerResult,
      },
      {
        name: "A non spoiler text because it's a previous season",
        text: "Test2 Season 1 Episode 100",
        expected: nonSpoilerResult,
      },

      {
        name: "No episode in a text",
        text: "Test1 season 2",
        expected: {
          title: "Test",
          season: 2,
        },
      },
      {
        name: "No season in a text",
        text: "Test1 episode 3",
        expected: {
          title: "Test",
          season: 1,
          episode: 3,
        },
      },
      {
        name: "No season nor episode",
        text: "Test1 released",
        expected: {
          title: "Test",
        },
      },
    ];
    test.each(testCases)("$name", (arg) => {
      const { config, userHistory, text, expected } = {
        ...defaultTestCase,
        ...arg,
      };
      const textParser = new TextSpoilerAnalyzer(config, userHistory);
      const actual = textParser.extractSpoiler(text);
      expect(actual).toEqual(expected);
    });
  });
});
