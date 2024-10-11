export type ParseResult =
  | {
      seasonId: string;
      episode: number;
    }
  | {
      seasonId: string;
      season: number;
      title: string;
    };

const episodeRegex = /\/video\/[a-zA-Z0-9]*/;
const seasonRegex = /\/season\/[0-9]*/;

export function parse(args: {
  path: string;
  seasonId?: string;
  title: string;
  name: string;
}): ParseResult {
  if (args.path.match(episodeRegex) && args.seasonId != null) {
    return parseEpisode(args.title, args.seasonId);
  }
  if (args.path.match(seasonRegex)) {
    return parseSeason(args.path, args.title, args.name);
  }

  return;
}

function parseEpisode(title: string, seasonId: string): ParseResult {
  let match = title.match(/^E(?<episode>[\d\.]+) +\-/i);
  if (match == null) {
    return;
  }
  // episode can be a float, e.g. 12.5
  const episode = parseFloat(match.groups!.episode);

  return {
    episode,
    seasonId,
  };
}

function parseSeason(path: string, title: string, name: string): ParseResult {
  const pathMatch = path.match(/\/season\/(?<season>\d+)/);
  if (pathMatch == null) {
    return;
  }
  const seasonId = pathMatch.groups!.season;

  let match = name.match(/Season (?<season>\d+)/i);
  let season = 1;
  if (match != null) {
    const vars = match.groups!;
    season = parseInt(vars.season);
  }

  const titleSubstrings = title.split(" - ");
  if (titleSubstrings.length > 1) {
    title = titleSubstrings[0];
  }

  return {
    title,
    seasonId,
    season,
  };
}
