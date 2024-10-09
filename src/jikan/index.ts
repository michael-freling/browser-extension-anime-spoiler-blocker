export enum AnimeType {
  TV = "tv",
  Movie = "movie",
  OVA = "ova",
  Special = "special",
  ONA = "ona",
  Music = "music",
  CM = "cm",
  PV = "pv",
  TVSpecial = "tv_special",
}

export interface SearchAnimeResponse {
  data: {
    malId: number;
    url: string;
    titles: {
      type: string;
      title: string;
    }[];
    title: string;
    type: AnimeType;
    approved: boolean;
  }[];
}

export interface SearchAnimeRequest {
  query: string;
  type: AnimeType.TV | AnimeType.Movie;
}

const snakeToCamel = (str) =>
  str
    .toLowerCase()
    .replace(/([-_][a-z])/g, (group) =>
      group.toUpperCase().replace("-", "").replace("_", "")
    );

export function keysToCamel(object) {
  if (Array.isArray(object)) {
    return object.map((element) => {
      return keysToCamel(element);
    });
  }
  if (typeof object === "object" && object !== null) {
    const result = {};
    Object.keys(object).forEach((key) => {
      result[snakeToCamel(key)] = keysToCamel(object[key]);
    });
    return result;
  }
  return object;
}

export class JikanAPIClient {
  baseURL = "https://api.jikan.moe/v4";

  /**
   *
   * @param {string} query a query to search anime
   * @returns {Promise<SearchAnimeResponse>} a response from the Jikan API
   * @see https://docs.api.jikan.moe/#tag/anime/operation/getAnimeSearch
   */
  async searchAnime({
    query,
    type,
  }: SearchAnimeRequest): Promise<SearchAnimeResponse> {
    // https://stackoverflow.com/a/35039198/24068435
    const url = new URL(this.baseURL + "/anime");
    url.search = new URLSearchParams({
      q: query,
      type: type,
    }).toString();

    const response = await fetch(url);
    const json = keysToCamel(await response.json());
    // console.log({ json });
    return json;
  }
}
