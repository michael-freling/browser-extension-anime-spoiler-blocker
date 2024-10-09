import { keysToCamel } from ".";

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
