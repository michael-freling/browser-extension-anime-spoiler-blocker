import type { Config } from "jest";

// https://github.com/PlasmoHQ/examples/blob/main/with-jest/jest.config.mjs
const config: Config = {
  verbose: true,
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
};

export default config;
