export interface Config {
  series: {
    [seriesID: string]: SeriesConfig;
  };
}

export interface SeriesConfig {
  title: string;
  keywords: string[];
}

enum MediaType {
  TVShows = "tv",
}

export interface UserHistory {
  series: {
    [seriesID: string]: {
      [MediaType.TVShows]: {
        season: number;
        episode: number;
      };
    };
  };
}

export interface Spoiler {
  title: string;
  season?: number;
  episode?: number;
}

export class TextSpoilerAnalyzer {
  config: Config;
  userHistory: UserHistory;

  constructor(config: Config, userHistory: UserHistory) {
    Object.keys(config.series).forEach((contentId) => {
      config.series[contentId].keywords = config.series[contentId].keywords.map(
        (keyword) => {
          return keyword.toLowerCase();
        }
      );
    });

    this.config = config;
    this.userHistory = userHistory;
  }

  extractEpisodeFromText(
    text: string,
    title: string,
    keywords: string[]
  ): Spoiler | null {
    text = text.toLowerCase();
    let isTextFound = false;
    keywords.forEach((configKeyword) => {
      if (text.includes(configKeyword)) {
        isTextFound = true;
      }
    });
    if (!isTextFound) {
      return null;
    }

    // TODO: Currently, both of season and episode are required to be matched
    // TODO: season 2 part 2 episode X can be happening
    // TODO: episode 19 (meaning season 1) can be happening
    let season;
    let matches = text.match(/(season\s|S)(?<season>[0-9]+)/i);
    if (matches) {
      season = parseInt(matches.groups!.season, 10);
    }
    let episode;
    matches = text.match(/(episode\s|Ep\s?)(?<episode>[0-9]+)/i);
    if (matches) {
      episode = parseInt(matches.groups!.episode, 10);
    }
    if (season == undefined && episode == undefined) {
      return {
        title,
      };
    } else if (episode == undefined) {
      return {
        title,
        season,
      };
    } else if (season == undefined) {
      season = 1;
    }

    return {
      title: title,
      season,
      episode,
    };
  }

  extractSpoiler(text: string): Spoiler {
    let result: Spoiler = {
      title: "",
      season: 0,
      episode: 0,
    };
    Object.entries(this.config.series).forEach(([seriesId, config]) => {
      const episodeFromText = this.extractEpisodeFromText(
        text,
        config.title,
        config.keywords
      );
      if (episodeFromText == null) {
        return;
      }

      // if no season, it's a spoiler
      if (episodeFromText.season == null) {
        result = episodeFromText;
        return;
      }

      const allowedEpisode = this.userHistory.series[seriesId].tv;
      if (episodeFromText.season < allowedEpisode.season) {
        return;
      }
      if (
        episodeFromText.season == allowedEpisode.season &&
        (episodeFromText.episode == undefined ||
          episodeFromText.episode <= allowedEpisode.episode)
      ) {
        return;
      }
      // if the title doesn't include an episode, conservatively recognize the video as a spoiler
      // if (matches.length == 2) {
      //   return false;
      // }

      result = episodeFromText;
    });

    return result;
  }
}
