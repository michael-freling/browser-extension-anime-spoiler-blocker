export interface Config {
  contents: {
    [contentId: string]: ConfigContent;
  };
}

export interface ConfigContent {
  title: string;
  keywords: string[];
  history: {
    season: number;
    episode: number;
  };
}

export interface Spoiler {
  title: string;
  season?: number;
  episode?: number;
}

export class TextSpoilerAnalyzer {
  config: Config;

  constructor(config: Config) {
    Object.keys(config.contents).forEach((contentId) => {
      config.contents[contentId].keywords = config.contents[
        contentId
      ].keywords.map((keyword) => {
        return keyword.toLowerCase();
      });
    });

    this.config = config;
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
    Object.entries(this.config.contents).forEach(([_, config]) => {
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

      if (episodeFromText.season < config.history.season) {
        return;
      }
      if (
        episodeFromText.season == config.history.season &&
        (episodeFromText.episode == undefined ||
          episodeFromText.episode <= config.history.episode)
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
