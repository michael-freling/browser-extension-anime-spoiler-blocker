import { sendToBackground } from "@plasmohq/messaging";
import { PlasmoCSConfig } from "plasmo";

interface ParsedTitle {
  series: string;
  episode: number;
  season: number;
}

export const config: PlasmoCSConfig = {
  matches: ["https://www.crunchyroll.com/*"],
};

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

interface Cache {
  data: {
    [key: string]: boolean;
  };
  set: (key: string, callback: () => void) => void;
}

const cache: Cache = {
  data: {},
  set: function (key: string, callback: () => void) {
    if (cache.data[key] == null) {
      callback();
      cache.data[key] = true;
    }
  },
};

// Listen for messages
// TODO: Refactor to get a title only when the page is updated from a background: https://medium.com/@softvar/making-chrome-extension-smart-by-supporting-spa-websites-1f76593637e8
async function onLoad() {
  const url = window.location;
  const episodeRegex = /\/watch\/[a-zA-Z0-9]*\/[\?\/]*/;
  if (!url.pathname.match(episodeRegex)) {
    return;
  }

  // TODO: Some pages do not have og:title
  const title = document.querySelector("meta[property='og:title']");
  if (title == null) {
    return;
  }

  const titleContent = title.getAttribute("content");
  if (titleContent == null) {
    return;
  }
  if (cache.data[titleContent] != null) {
    return;
  }
  cache.set(titleContent, () => {
    const episode = parseTitle(titleContent);
    console.log("", {
      episode,
    });
    sendToBackground({
      name: "updateWatchHistory",
      body: {
        ...episode,
        type: "updateWatchHistory",
        webServiceName: "crunchyroll",
        mediaType: "tv",
      },
    });
  });
}

window.addEventListener("load", async () => {
  setInterval(onLoad, 10000);
});
