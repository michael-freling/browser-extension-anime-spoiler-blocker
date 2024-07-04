import type { Config, UserHistory } from "../blocker";
import { Storage } from "@plasmohq/storage";

const storage = new Storage();

// https://developer.chrome.com/docs/extensions/reference/api/runtime#event-onInstalled
// TODO: There is no install hook on Plasmo?
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

interface GetConfigMessage {
  type: "getConfig";
}

type Message = UpdateWatchHistoryMessage | GetConfigMessage;

chrome.runtime.onMessage.addListener(
  (message: Message, sender, sendResponse) => {
    switch (message.type) {
      case "getConfig":
        Promise.all([storage.get("config"), storage.get("userHistory")]).then(
          (result) => {
            sendResponse({
              config: result[0],
              userHistory: result[1],
            });
          }
        );
        return true;

      case "updateWatchHistory":
        // no support other than tv shows
        if (message.mediaType != "tv") {
          return;
        }

        Promise.all([storage.get("config"), storage.get("userHistory")]).then(
          async ([config, userHistory]) => {
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
            await storage.set("userHistory", userHistory);
            console.info("Updated a watch history", {
              series: message.series,
              season: userHistory.series[result].tv.season,
              episode: userHistory.series[result].tv.episode,
            });
          }
        );

        return true;
    }
  }
);

async function onInstall() {
  try {
    const configFiles = [
      "assets/configs/default_config.json",
      "assets/configs/user_history_example.json",
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

    storage.set("config", config);
    storage.set("userHistory", userHistory);
  } catch (error) {
    console.error("failed to run main", error);
  }
}
