import type {
  StorageAnimeConfig,
  StorageHidiveConfig,
  StorageUserHistory,
} from "~blocker/storage";
import { Storage } from "@plasmohq/storage";

const storage = new Storage();

// https://developer.chrome.com/docs/extensions/reference/api/runtime#event-onInstalled
// TODO: There is no install hook on Plasmo?
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === "install") {
    onInstall();
  }
});

async function onInstall() {
  try {
    const configFiles = [
      "assets/configs/default_config.json",
      "assets/configs/hidive.json",
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
    const config: StorageAnimeConfig = responses[0];
    const hidiveConfig: StorageHidiveConfig = responses[1];
    const userHistory: StorageUserHistory = responses[2];

    storage.set("config", config);
    storage.set("hidive", hidiveConfig);
    storage.set("userHistory", userHistory);
  } catch (error) {
    console.error("failed to run main", error);
  }
}
