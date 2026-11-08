import { StorageSeriesConfig, StorageUserHistory } from "./storage";

export interface Spoiler {
  title: string;
  season?: number;
  episode?: number;
}

export interface StorageAnimeConfig {
  series: StorageSeriesConfig[];
}

interface AnalyzedSeries {
  title: string;
  matcher: RegExp | null;
  watched?: {
    season: number;
    episode: number;
  };
}

// Keywords shorter than this are too generic to match safely, e.g. "ao" or "86"
const MIN_KEYWORD_LENGTH = 3;

// "S2E5" or "S2 E5"
const SEASON_EPISODE_PATTERN = /(?<![a-z0-9])s(\d+)\s*e(\d+)(?![0-9])/;
// "Season 2", "S2", but not "PS5"
const SEASON_PATTERN = /(?<![a-z0-9])(?:season\s*|s)(\d+)(?![0-9])/;
// "Episode 5", "Ep 5", "Ep.5", but not "deep 2"
const EPISODE_PATTERN = /(?<![a-z0-9])(?:episode|ep)\.?\s*(\d+)(?![0-9])/;

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalize(text: string): string {
  return text.normalize("NFKC").toLowerCase();
}

/**
 * Build a single RegExp that matches any keyword as a whole word.
 * Word boundaries are only enforced on ASCII letters and digits, so keywords
 * in languages without spaces, like Japanese, still match inside a sentence.
 */
export function buildKeywordMatcher(keywords: string[]): RegExp | null {
  const patterns = Array.from(
    new Set(
      keywords
        .map((keyword) => normalize(keyword).trim())
        .filter((keyword) => keyword.length >= MIN_KEYWORD_LENGTH),
    ),
  )
    // Prefer longer keywords when several of them overlap
    .sort((a, b) => b.length - a.length)
    .map((keyword) => {
      const prefix = /^[a-z0-9]/.test(keyword) ? "(?<![a-z0-9])" : "";
      const suffix = /[a-z0-9]$/.test(keyword) ? "(?![a-z0-9])" : "";
      return prefix + escapeRegExp(keyword) + suffix;
    });
  if (patterns.length == 0) {
    return null;
  }
  return new RegExp(patterns.join("|"));
}

export class TextSpoilerAnalyzer {
  private series: AnalyzedSeries[];
  private matcherCache = new Map<string[], RegExp | null>();

  constructor(config: StorageAnimeConfig, userHistory: StorageUserHistory) {
    const watched = new Map<string, AnalyzedSeries["watched"]>();
    (userHistory?.series ?? []).forEach((series) => {
      watched.set(series.title.toLowerCase(), series.tv);
    });

    this.series = (config?.series ?? [])
      .filter((series) => series != null)
      .map((series) => ({
        title: series.title,
        matcher: this.getMatcher(series.keywords ?? []),
        watched: watched.get(series.title.toLowerCase()),
      }));
  }

  private getMatcher(keywords: string[]): RegExp | null {
    if (!this.matcherCache.has(keywords)) {
      this.matcherCache.set(keywords, buildKeywordMatcher(keywords));
    }
    return this.matcherCache.get(keywords)!;
  }

  extractEpisodeFromText(
    text: string,
    title: string,
    keywords: string[],
  ): Spoiler | null {
    return this.extractEpisode(
      normalize(text),
      title,
      this.getMatcher(keywords),
    );
  }

  private extractEpisode(
    text: string,
    title: string,
    matcher: RegExp | null,
  ): Spoiler | null {
    if (matcher == null || !matcher.test(text)) {
      return null;
    }

    // TODO: season 2 part 2 episode X can be happening
    let season: number | undefined;
    let episode: number | undefined;
    const seasonEpisode = text.match(SEASON_EPISODE_PATTERN);
    if (seasonEpisode) {
      season = parseInt(seasonEpisode[1], 10);
      episode = parseInt(seasonEpisode[2], 10);
    } else {
      const seasonMatch = text.match(SEASON_PATTERN);
      if (seasonMatch) {
        season = parseInt(seasonMatch[1], 10);
      }
      const episodeMatch = text.match(EPISODE_PATTERN);
      if (episodeMatch) {
        episode = parseInt(episodeMatch[1], 10);
      }
    }

    if (season == undefined && episode == undefined) {
      return { title };
    }
    if (episode == undefined) {
      return { title, season };
    }
    // An episode without a season, e.g. "episode 19", means the first season
    return { title, season: season ?? 1, episode };
  }

  extractSpoiler(text: string): Spoiler {
    const normalizedText = normalize(text);
    for (const series of this.series) {
      const spoiler = this.extractEpisode(
        normalizedText,
        series.title,
        series.matcher,
      );
      if (spoiler == null) {
        continue;
      }

      // if no season, it's a spoiler
      if (spoiler.season == null) {
        return spoiler;
      }

      const watched = series.watched;
      if (watched == null) {
        // The title in the series is supposed to match with a user history
        continue;
      }
      if (spoiler.season < watched.season) {
        continue;
      }
      if (
        spoiler.season == watched.season &&
        (spoiler.episode == undefined || spoiler.episode <= watched.episode)
      ) {
        continue;
      }
      return spoiler;
    }

    return {
      title: "",
      season: 0,
      episode: 0,
    };
  }
}
