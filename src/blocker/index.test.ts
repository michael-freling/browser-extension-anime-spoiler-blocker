import { TextSpoilerAnalyzer, buildKeywordMatcher } from ".";

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
          series: [
            {
              keywords,
              title: "test",
            },
          ],
        },
        {
          series: [
            {
              title: "test",
              tv: {
                season: 0,
                episode: 0,
              },
            },
          ],
        },
      );
      const actual = textParser.extractEpisodeFromText(text, "Test", keywords);
      expect(actual).toEqual(expected);
    });
  });

  describe("extractSpoiler", () => {
    const defaultTestCase = {
      config: {
        series: [
          {
            title: "Test",
            keywords: ["test1", "keyword1"],
          },
          {
            title: "Test2",
            keywords: ["test2"],
          },
        ],
      },
      userHistory: {
        series: [
          {
            title: "Test",
            tv: {
              season: 1,
              episode: 2,
            },
          },
          {
            title: "Test2",
            tv: {
              season: 2,
              episode: 1,
            },
          },
        ],
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

describe("TextSpoilerAnalyzer edge cases", () => {
  const history = {
    series: [{ title: "Test", tv: { season: 1, episode: 2 } }],
  };
  const analyzer = (keywords: string[] = ["test1"]) =>
    new TextSpoilerAnalyzer({ series: [{ title: "Test", keywords }] }, history);

  test.each([
    {
      name: "SNEN format",
      text: "Test1 S2E5 reaction",
      expected: { title: "Test", season: 2, episode: 5 },
    },
    {
      name: "Ep. with a dot",
      text: "Test1 Ep.5",
      expected: { title: "Test", season: 1, episode: 5 },
    },
    {
      name: "PS5 is not a season",
      text: "Test1 on PS5",
      expected: { title: "Test" },
    },
    {
      name: "deep 2 is not an episode",
      text: "Test1 deep 2 dive",
      expected: { title: "Test" },
    },
    {
      name: "A keyword inside another word is not matched",
      text: "Mytest1s season 2",
      expected: null,
    },
    {
      name: "Full-width characters are normalized",
      text: "ＴＥＳＴ１ Season 2",
      expected: { title: "Test", season: 2 },
    },
  ])("$name", ({ text, expected }) => {
    expect(analyzer().extractEpisodeFromText(text, "Test", ["test1"])).toEqual(
      expected,
    );
  });

  test("Japanese keywords match inside a sentence", () => {
    expect(
      analyzer(["鬼滅の刃"]).extractEpisodeFromText(
        "アニメ鬼滅の刃 Season 3",
        "Test",
        ["鬼滅の刃"],
      ),
    ).toEqual({ title: "Test", season: 3 });
  });

  test("Too short keywords are ignored", () => {
    expect(buildKeywordMatcher(["ao", " ", "86"])).toBeNull();
    expect(analyzer(["ao"]).extractSpoiler("ao season 9").title).toBe("");
  });

  test("Keywords that start or end with symbols are matched", () => {
    expect(buildKeywordMatcher(["!test!"])!.test("x!test!y")).toBe(true);
  });

  test("The first matched spoiler is returned", () => {
    const multiple = new TextSpoilerAnalyzer(
      {
        series: [
          { title: "A", keywords: ["alpha"] },
          { title: "B", keywords: ["beta"] },
        ],
      },
      {
        series: [
          { title: "A", tv: { season: 1, episode: 1 } },
          { title: "B", tv: { season: 1, episode: 1 } },
        ],
      },
    );
    expect(multiple.extractSpoiler("alpha beta season 2 episode 1")).toEqual({
      title: "A",
      season: 2,
      episode: 1,
    });
  });

  test("A series which is not in a watch history is not a spoiler", () => {
    const noHistory = new TextSpoilerAnalyzer(
      { series: [{ title: "Test", keywords: ["test1"] }] },
      { series: [] },
    );
    expect(noHistory.extractSpoiler("test1 season 2 episode 1").title).toBe("");
  });

  test("Missing configurations do not throw", () => {
    const empty = new TextSpoilerAnalyzer(
      { series: [null as any, { title: "Test" } as any] },
      undefined as any,
    );
    expect(empty.extractSpoiler("Test season 2").title).toBe("");
    expect(
      new TextSpoilerAnalyzer(undefined as any, { series: [] }).extractSpoiler(
        "x",
      ).title,
    ).toBe("");
  });

  test("The configuration is not mutated", () => {
    const config = { series: [{ title: "Test", keywords: ["TEST1"] }] };
    new TextSpoilerAnalyzer(config, history);
    expect(config.series[0].keywords).toEqual(["TEST1"]);
  });
});
