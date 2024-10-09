import { PlasmoCSConfig } from "plasmo";
import { MediaType } from "~blocker/storage";
import { parse } from "./parser";
import { sendToBackground } from "@plasmohq/messaging";
import { UpdateWatchHistoryRequest } from "~background/messages/updateWatchHistory";

export const config: PlasmoCSConfig = {
  matches: ["https://www.hidive.com/*"],
};

interface Cache {
  data: {
    [key: string]: boolean;
  };
  set: (key: string) => void;
}

const cache: Cache = {
  data: {},
  set: function (key: string) {
    cache.data[key] = true;
  },
};

const domParser = new DOMParser();

// Listen for messages
// TODO: Refactor to get a title only when the page is updated from a background: https://medium.com/@softvar/making-chrome-extension-smart-by-supporting-spa-websites-1f76593637e8
async function onLoad() {
  const url = new URL(window.location.toString());

  // In order to reduce the same messaging again and again
  // Cache the previous result
  const fullUrl = window.location.toString();
  if (cache.data[fullUrl] != null) {
    return;
  }
  cache.set(fullUrl);

  // The title should be fetched on the current page because it cannot be fetched
  //
  const title = window.document.querySelector("title")?.textContent;

  // HTML Doms for this page isn't updated on real time for headers.
  // So, we need to get the latest title and name
  // Use DOMParser to parse and find DOMs by querySelector
  // See https://stackoverflow.com/a/47809709/24068435 for more details.
  const response = (await fetch(fullUrl)).text();
  const htmlDoc = domParser.parseFromString(await response, "text/html");

  const name = htmlDoc.documentElement.querySelector(
    "meta[property='og:title']"
  );
  const parsedResult = parse({
    path: url.pathname,
    seasonId: url.searchParams.get("seasonId"),
    title: title,
    name: name.getAttribute("content") ?? "",
  });
  if (parsedResult == null) {
    return;
  }

  const body: UpdateWatchHistoryRequest = {
    ...parsedResult,
    webServiceName: "HIDIVE",
    mediaType: MediaType.TVShows,
  };
  console.log({
    htmlDoc,
    title,
    name,
    parsedResult,
    body,
  });

  sendToBackground({
    name: "updateWatchHistory",
    body,
  });
}

window.addEventListener("load", async () => {
  setInterval(onLoad, 10000);
});
