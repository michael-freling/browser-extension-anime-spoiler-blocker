import type { StorageHidiveConfig, StorageUserHistory } from "~blocker/storage";
import { Storage } from "@plasmohq/storage";

const storage = new Storage();

// https://developer.chrome.com/docs/extensions/reference/api/runtime#event-onInstalled
// TODO: There is no install hook on Plasmo?
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === "install") {
    onInstall();
  }
});

async function setConfigK<T>(key: string, configFilePath: string) {
  const url = chrome.runtime.getURL(configFilePath);
  const response = await fetch(url);
  if (response.status != 200) {
    throw new Error("failed to fetch " + configFilePath);
  }
  const json = await response.json();
  await storage.set(key, json);
}

async function onInstall() {
  try {
    const hidiveConfig = await storage.get("hidive");
    if (hidiveConfig == null) {
      (await setConfigK)<StorageHidiveConfig>(
        "hidive",
        "assets/configs/hidive.json"
      );
    }
    const userHistoryConfig = await storage.get("userHistory");
    if (userHistoryConfig == null) {
      await setConfigK<StorageUserHistory>(
        "userHistory",
        "assets/configs/user_history_example.json"
      );
    }
  } catch (error) {
    console.error("failed to run main", error);
  }
}
