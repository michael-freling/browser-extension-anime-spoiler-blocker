// Some @plasmo/XXX packages cannot be used in a jest
// https://github.com/PlasmoHQ/plasmo/issues/938
import { parseTitle } from "./parser";

describe("parsedTitle", () => {
  test.each([
    {
      // Demon Slayer season 1
      title: "Demon Slayer: Kimetsu no Yaiba | E1 - Cruelty'",
      expected: {
        series: "Demon Slayer: Kimetsu no Yaiba",
        episode: 1,
        season: 1,
      },
    },
    {
      // Demon Slayer season 2
      title: "Demon Slayer: Kimetsu no Yaiba | E2 - Trainer Sakonji Urokodaki",
      expected: {
        series: "Demon Slayer: Kimetsu no Yaiba",
        episode: 2,
        // TODO: season: 2. Need to map a title to a season
        season: 1,
      },
    },
    {
      // JJK season 1
      title: "JUJUTSU KAISEN | E1 - Ryomen Sukuna",
      expected: {
        series: "JUJUTSU KAISEN",
        episode: 1,
        season: 1,
      },
    },
    {
      // JJK season 2
      title: "JUJUTSU KAISEN Season 2 | E25 - Hidden Inventory",
      expected: {
        series: "JUJUTSU KAISEN",
        episode: 25,
        season: 2,
      },
    },
    {
      // MHA season 1 (Dub)
      title: "My Hero Academia (English Dub) | E1 - Izuku Midoriya: Origin'",
      expected: {
        series: "My Hero Academia",
        episode: 1,
        season: 1,
      },
    },
    {
      // MHA season 2
      title: "My Hero Academia Season 2 | E13.5 - Hero Notebook",
      expected: {
        series: "My Hero Academia",
        episode: 13.5,
        season: 2,
      },
    },
  ])(`$title`, ({ title, expected }) => {
    expect(parseTitle(title)).toEqual(expected);
  });
});
