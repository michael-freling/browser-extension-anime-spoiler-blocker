import { Config, UserHistory } from "../blocker";

const storage = chrome.storage.sync;

// sendResponse doesn't work within an async function
// https://developer.chrome.com/docs/extensions/develop/concepts/messaging#simple
// Use onMessageExternal from webpages like a main world
// https://developer.chrome.com/docs/extensions/develop/concepts/messaging#external-webpage
chrome.runtime.onMessageExternal.addListener(
  (message, sender, sendResponse) => {
    // const extensionID = chrome.runtime.id;
    // sender.id is undefined
    if (sender.origin != "https://www.youtube.com") {
      return;
    }

    storage.get(["config", "userHistory"]).then(sendResponse);
    return true;
  }
);

// https://developer.chrome.com/docs/extensions/reference/api/runtime#event-onInstalled
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === "install") {
    onInstall();
  }
});

interface UpdateWatchHistoryMessage {
  type: "updateWatchHistory";
  webServiceName: string;
  mediaType: string;
  series: string;
  season: number;
  episode: number;
}

interface Message extends UpdateWatchHistoryMessage {}

chrome.runtime.onMessage.addListener(
  (message: Message, sender, sendResponse) => {
    switch (message.type) {
      case "updateWatchHistory":
        // no support other than tv shows
        if (message.mediaType != "tv") {
          return;
        }

        storage
          .get(["config", "userHistory"])
          .then(async ({ config, userHistory }) => {
            if (config.services[message.webServiceName] == null) {
              return;
            }

            let result;
            Object.entries(
              (config as Config).services[message.webServiceName].series
            ).forEach(([seriesID, thisSeries]) => {
              if (thisSeries.title == message.series) {
                result = seriesID;
                return;
              }
            });

            if (result == null) {
              return;
            }
            if (userHistory.series[result] == null) {
              userHistory.series[result] = {
                tv: {
                  season: 0,
                  episode: 0,
                },
              };
            }
            if (message.season < userHistory.series[result].tv.season) {
              return;
            }
            if (
              message.season == userHistory.series[result].tv.season &&
              message.episode <= userHistory.series[result].tv.episode
            ) {
              return;
            }

            userHistory.series[result].tv.season = message.season;
            userHistory.series[result].tv.episode = message.episode;
            await storage.set({
              userHistory,
            });
            console.info("Updated a watch history", {
              series: message.series,
              season: userHistory.series[result].tv.season,
              episode: userHistory.series[result].tv.episode,
            });
          });

        return true;
    }
  }
);

async function onInstall() {
  try {
    const configFiles = [
      "assets/data/default_config.json",
      "assets/data/user_history_example.json",
    ];
    const responses = await Promise.all(
      configFiles.map(async (configFile) => {
        const url = chrome.runtime.getURL(configFile);
        const response = await fetch(url);
        if (response.status != 200) {
          throw new Error("failed to fetch default.json");
        }
        return await response.json();
      })
    );
    const config: Config = responses[0];
    const userHistory: UserHistory = responses[1];

    storage.set({
      config,
      userHistory,
    });
  } catch (error) {
    console.error("failed to run main", error);
  }
}
