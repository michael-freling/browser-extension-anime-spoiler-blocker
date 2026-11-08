import { AnimeType, JikanAPIClient, keysToCamel } from ".";

describe("keysToCamel", () => {
  test.each([
    [{ snake_case: "value" }, { snakeCase: "value" }],
    [
      { nested_object: { snake_case: "value" } },
      { nestedObject: { snakeCase: "value" } },
    ],
    [[{ snake_case: "value" }], [{ snakeCase: "value" }]],
  ])(`should convert snake_case to camelCase`, (input, expected) => {
    expect(keysToCamel(input)).toEqual(expected);
  });
});

describe("JikanAPIClient", () => {
  test("searchAnime converts a response to camel case", async () => {
    global.fetch = jest.fn(async () => ({
      json: async () => ({ data: [{ mal_id: 1, title: "A" }] }),
    })) as any;

    const response = await new JikanAPIClient().searchAnime({
      query: "A B",
      type: AnimeType.TV,
    });
    expect(response).toEqual({ data: [{ malId: 1, title: "A" }] });
    expect((global.fetch as jest.Mock).mock.calls[0][0].toString()).toBe(
      "https://api.jikan.moe/v4/anime?q=A+B&type=tv",
    );
  });
});

test("keysToCamel keeps primitive values", () => {
  expect(keysToCamel(null)).toBeNull();
  expect(keysToCamel("a_b")).toBe("a_b");
});
