import { AnimeType, JikanAPIClient } from "../jikan";

export interface StorageHidiveConfig {
  series: {
    seasonId: string;
    season: number;
    title: string;
  }[];
}

export interface StorageSeriesConfig {
  title: string;
  keywords: string[];
  tvs?: StorageSeriesAnimeConfig[];
  movies?: StorageSeriesMoviesConfig[];
}

export interface StorageSeriesAnimeConfig {
  title: string;
  keywords: string[];
  season?: number;
  malId: number;
}

export interface StorageSeriesMoviesConfig {
  title: string;
  keywords: string[];
  malId: number;
}

export enum MediaType {
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

export type UpdateWatchHistoryArg =
  | {
      webServiceName: "Crunchyroll";
      mediaType: string;
      title: string;
      season: number;
      episode: number;
    }
  | {
      webServiceName: "HIDIVE";
      mediaType: string;
      title: string;
      season: number;
      seasonId: string;
    }
  | {
      webServiceName: "HIDIVE";
      mediaType: string;
      episode: number;
      seasonId: string;
    };

export class UserHistoryManager {
  indexes: {
    hidive: {
      [hidiveSeasonId: string]: number;
    };
    userHistory: {
      [seriesTitle: string]: number;
    };
  };
  hidiveConfig: StorageHidiveConfig;
  storageUserHistory: StorageUserHistory;

  constructor(
    hidiveConfig: StorageHidiveConfig,
    userHistory: StorageUserHistory,
    private jikanAPIClient: JikanAPIClient = new JikanAPIClient()
  ) {
    const indexes = { series: {}, userHistory: {}, hidive: {} };
    userHistory.series.forEach((series, index) => {
      indexes.userHistory[series.title.toLowerCase()] = index;
    });
    hidiveConfig.series.forEach((season, index) => {
      indexes.hidive[season.seasonId] = index;
    });

    this.indexes = indexes;
    this.hidiveConfig = hidiveConfig;
    this.storageUserHistory = userHistory;
  }

  async searchAnime(
    mainTitle: string,
    type: AnimeType.TV | AnimeType.Movie
  ): Promise<
    {
      malId: number;
      title: string;
      keywords: string[];
    }[]
  > {
    const response = await this.jikanAPIClient.searchAnime({
      query: mainTitle,
      type,
    });

    const result = [];
    response.data.forEach((anime) => {
      // API includes anime which is not related to a specific title
      // So, filter out the anime which doesn't include the title
      const titles = anime.titles.filter((title) => {
        return title.title.toLowerCase().includes(mainTitle.toLowerCase());
      });
      if (titles.length == 0) {
        return;
      }

      result.push({
        malId: anime.malId,
        title: anime.title,
        keywords: anime.titles.map((title) => title.title),
      });
    });
    return result;
  }

  async createNewAnimeConfig(args: { title: string }) {
    const { title } = args;
    const [tvs, movies] = await Promise.all([
      this.searchAnime(title, AnimeType.TV),
      this.searchAnime(title, AnimeType.Movie),
    ]);

    const allKeywords = [title]
      .concat(tvs.map((tv) => tv.keywords).flat())
      .concat(movies.map((movie) => movie.keywords).flat())
      .sort();
    const keywords = [];
    for (let keyword of allKeywords) {
      if (keywords.includes(keyword)) {
        continue;
      }
      keywords.push(keyword.trim());
    }

    return {
      title,
      keywords,
      tvs,
      movies,
    };
  }

  async updateWatchHistory(
    seriesConfig: StorageSeriesConfig | null,
    request: UpdateWatchHistoryArg
  ): Promise<{
    series?: StorageSeriesConfig;
    hidiveConfig?: StorageHidiveConfig;
    userHistory?: StorageUserHistory;
  }> {
    let season: number;
    let title: string;

    if (request.webServiceName === "HIDIVE") {
      if ("season" in request) {
        season = request.season;
        const { seasonId, title } = request;
        if (this.indexes.hidive[seasonId] != null) {
          // this anime was already added
          return;
        }

        this.hidiveConfig.series.push({
          seasonId,
          title,
          season,
        });

        const result: {
          series?: StorageSeriesConfig;
          hidiveConfig: StorageHidiveConfig;
        } = {
          hidiveConfig: this.hidiveConfig,
        };
        if (seriesConfig == null) {
          result.series = await this.createNewAnimeConfig({ title });
        }

        return result;
      }

      // todo: when an episode was found
      const index = this.indexes.hidive[request.seasonId];
      if (index == null) {
        return;
      }

      season = this.hidiveConfig.series[index].season;
      title = this.hidiveConfig.series[index].title;
    } else if (request.webServiceName === "Crunchyroll") {
      season = request.season;
      title = request.title;
    } else {
      // @ts-ignore webServiceName becomes never type
      // but this value comes from an input and can be any string
      throw new Error("Unsupported web service: " + request.webServiceName);
    }

    const { mediaType, episode } = request;
    if (mediaType !== MediaType.TVShows) {
      return;
    }

    if (seriesConfig == null) {
      const series = await this.createNewAnimeConfig({ title });
      // new series to watch
      this.storageUserHistory.series.push({
        title,
        tv: {
          season,
          episode,
        },
      });

      return {
        series,
        userHistory: this.storageUserHistory,
      };
    }
    const userHistoryIndex = this.indexes.userHistory[title.toLowerCase()];
    if (userHistoryIndex == null) {
      this.storageUserHistory.series.push({
        title,
        tv: {
          season,
          episode,
        },
      });
      return {
        userHistory: this.storageUserHistory,
      };
    }

    const userHistory = this.storageUserHistory.series[userHistoryIndex];
    if (season < userHistory.tv.season) {
      return;
    }
    if (season == userHistory.tv.season && episode <= userHistory.tv.episode) {
      return;
    }

    this.storageUserHistory.series[userHistoryIndex].tv.season = season;
    this.storageUserHistory.series[userHistoryIndex].tv.episode = episode;

    console.info("Updated a watch history", {
      series: title,
      season,
      episode,
    });

    return {
      userHistory: this.storageUserHistory,
    };
  }
}
