import { AnimeType, JikanAPIClient } from "../jikan";

export interface StorageAnimeConfig {
  series: StorageSeriesConfig[];
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
        meta: {
          tvs: StorageSeriesAnimeConfig[];
          movies: StorageSeriesMoviesConfig[];
        };
      };
    };
  };
  storageAnimeConfig: StorageAnimeConfig;
  storageUserHistory: StorageUserHistory;

  constructor(
    animeConfig: StorageAnimeConfig,
    userHistory: StorageUserHistory,
    private jikanAPIClient: JikanAPIClient = new JikanAPIClient()
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
            meta: {
              tvs: series.tvs,
              movies: series.movies,
            },
          };
        }
      });
    });
    this.userConfig = userConfig;
    this.storageAnimeConfig = animeConfig;
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

  async updateWatchHistory(request: {
    mediaType: string;
    titles: string[];
    season: number;
    episode: number;
  }): Promise<{
    config?: StorageAnimeConfig;
    userHistory?: StorageUserHistory;
  }> {
    const { mediaType, titles, season, episode } = request;
    if (mediaType !== MediaType.TVShows) {
      return;
    }

    const configs = titles
      .map((title) => {
        return this.userConfig.series[title.toLowerCase()];
      })
      .filter((config) => config != null);

    const mainTitle = titles[0];
    const createNewAnimeConfig = async () => {
      const [tvs, movies] = await Promise.all([
        this.searchAnime(mainTitle, AnimeType.TV),
        this.searchAnime(mainTitle, AnimeType.Movie),
      ]);

      const allKeywords = titles
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
        title: mainTitle,
        keywords,
        tvs,
        movies,
      };
    };
    if (configs.length == 0) {
      this.storageAnimeConfig.series.push(await createNewAnimeConfig());
      // new series to watch
      this.storageUserHistory.series.push({
        title: mainTitle,
        tv: {
          season,
          episode,
        },
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

    // If the main config doesn't load a MAL yet.
    // This is for a migration from an old data to a new data, and temporary solution
    if (config.meta.tvs == null && config.meta.movies == null) {
      const newCnnfig = await createNewAnimeConfig();
      const index = this.storageAnimeConfig.series.findIndex((series) => {
        return series.title.toLowerCase() == config.title.toLowerCase();
      });
      this.storageAnimeConfig.series[index] = newCnnfig;
      return {
        config: this.storageAnimeConfig,
        userHistory: this.storageUserHistory,
      };
    }

    return {
      userHistory: this.storageUserHistory,
    };
  }
}
