interface ParsedTitle {
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

// Listen for messages
// TODO: Refactor to get a title only when the page is updated from a background: https://medium.com/@softvar/making-chrome-extension-smart-by-supporting-spa-websites-1f76593637e8
const caches: { [key: string]: boolean } = {};

async function onLoad() {
  const url = window.location;
  console.log({ url });
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
  if (caches[titleContent] != null) {
    return;
  }
  caches[titleContent] = true;

  const episode = parseTitle(titleContent);
  // TODO Overwrite a data on a storage
  console.log(episode);
}

window.addEventListener("load", async () => {
  setInterval(onLoad, 10000);
});
