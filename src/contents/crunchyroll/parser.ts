export interface ParsedTitle {
  series: string;
  episode: number;
  season: number;
}

export function parseTitle(title: string): ParsedTitle | null {
  const titleSubStrings = title.split(" | ");
  let match = titleSubStrings[1].match(/^E(?<episode>[\d\.]+) +\-/i);
  if (match == null) {
    return null;
  }
  // episode can be a float, e.g. 12.5
  const episode = parseFloat(match.groups!.episode);

  match = titleSubStrings[0].match(
    /(Season (?<season>\d+)|\((?<language>[^]+) Dub\))/i
  );
  let series = titleSubStrings[0];
  let season = 1;
  if (match != null) {
    const vars = match.groups!;
    if (vars.language != null) {
      series = series.replace(/ \([^]+ Dub\)/i, "");
    }
    if (vars.season != null) {
      season = parseInt(vars.season);
      series = series.replace(/ Season \d+/i, "");
    }
  }

  return {
    series,
    episode,
    season,
  };
}
