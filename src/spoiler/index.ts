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
  season: number;
  episode: number;
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
  ): Spoiler {
    text = text.toLowerCase();
    let isTextFound = false;
    keywords.forEach((configKeyword) => {
      if (text.includes(configKeyword)) {
        isTextFound = true;
      }
    });
    if (!isTextFound) {
      return;
    }

    // TODO: Currently, both of season and episode are required to be matched
    // TODO: season 2 part 2 episode X can be happening
    // TODO: episode 19 (meaning season 1) can be happening
    const matches = text.match(/(season\s|S)([0-9]+).*(episode|Ep)\s([0-9]+)/i);
    if (!matches) {
      return;
    }

    return {
      title: title,
      season: parseInt(matches[2], 10),
      episode: parseInt(matches[4], 10),
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

      if (episodeFromText.season < config.history.season) {
        return;
      }
      if (
        episodeFromText.season == config.history.season &&
        episodeFromText.episode <= config.history.episode
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
