import { main } from "./main";
import { config } from ".";

jest.mock("./main", () => ({
  main: jest.fn(),
}));

test("starts the blocker at document_start on YouTube", () => {
  expect(main).toHaveBeenCalledTimes(1);
  expect(config).toEqual({
    matches: ["https://www.youtube.com/*"],
    run_at: "document_start",
  });
});
