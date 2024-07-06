export interface StorageAnimeConfig {
  series: StorageSeriesConfig[];
}

export interface StorageSeriesConfig {
  title: string;
  keywords: string[];
}

enum MediaType {
  TVShows = "tv",
}

export interface StorageUserHistory {
  series: {
    title: string;
    [MediaType.TVShows]: {
      season: number;
      episode: number;
    };
  }[];
}

export class UserHistoryManager {
  userConfig: {
    series: {
      [seriesTitle: string]: {
        keywords: string[];
        title: string;
        [MediaType.TVShows]: {
          season: number;
          episode: number;
        };
      };
    };
  };
  storageAnimeConfig: StorageAnimeConfig;
  storageUserHistory: StorageUserHistory;

  constructor(
    animeConfig: StorageAnimeConfig,
    userHistory: StorageUserHistory
  ) {
    const userConfig = { series: {} };
    animeConfig.series.forEach((series) => {
      userHistory.series.forEach((userSeries) => {
        if (series.title.toLowerCase() == userSeries.title.toLowerCase()) {
          userConfig.series[series.title.toLowerCase()] = {
            title: series.title,
            keywords: series.keywords,
            [MediaType.TVShows]: {
              season: userSeries.tv.season,
              episode: userSeries.tv.episode,
            },
          };
        }
      });
    });
    this.userConfig = userConfig;
    this.storageAnimeConfig = animeConfig;
    this.storageUserHistory = userHistory;
  }

  updateWatchHistory(request: {
    mediaType: string;
    titles: string[];
    season: number;
    episode: number;
  }): { config?: StorageAnimeConfig; userHistory?: StorageUserHistory } {
    const { mediaType, titles, season, episode } = request;
    if (mediaType !== MediaType.TVShows) {
      return;
    }

    const configs = titles
      .map((title) => {
        return this.userConfig.series[title.toLowerCase()];
      })
      .filter((config) => config != null);
    if (configs.length == 0) {
      // new series to watch
      this.storageUserHistory.series.push({
        title: titles[0],
        tv: {
          season,
          episode,
        },
      });
      // TODO: update config master as well
      this.storageAnimeConfig.series.push({
        title: titles[0],
        keywords: titles,
      });
      return {
        config: this.storageAnimeConfig,
        userHistory: this.storageUserHistory,
      };
    }

    const config = configs[0];
    if (season < config.tv.season) {
      return;
    }
    if (season == config.tv.season && episode <= config.tv.episode) {
      return;
    }

    this.storageUserHistory.series.forEach((thisSeries, index) => {
      if (thisSeries.title.toLowerCase() == config.title.toLowerCase()) {
        this.storageUserHistory.series[index].tv.season = season;
        this.storageUserHistory.series[index].tv.episode = episode;
      }
    });

    console.info("Updated a watch history", {
      series: titles,
      season,
      episode,
    });
    return {
      userHistory: this.storageUserHistory,
    };
  }
}
