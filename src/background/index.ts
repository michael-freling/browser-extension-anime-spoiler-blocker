import { Config, UserHistory } from "../spoiler";

const storage = chrome.storage.sync;

// sendResponse doesn't work within an async function
// https://developer.chrome.com/docs/extensions/develop/concepts/messaging#simple
// Use onMessageExternal from webpages like a main world
// https://developer.chrome.com/docs/extensions/develop/concepts/messaging#external-webpage
chrome.runtime.onMessageExternal.addListener(
  (message, sender, sendResponse) => {
    // TODO: verify a sender
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
