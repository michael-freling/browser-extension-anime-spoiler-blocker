const storage = chrome.storage.sync;

// sendResponse doesn't work within an async function
// https://developer.chrome.com/docs/extensions/develop/concepts/messaging#simple
// Use onMessageExternal from webpages like a main world
// https://developer.chrome.com/docs/extensions/develop/concepts/messaging#external-webpage
chrome.runtime.onMessageExternal.addListener(
  (message, sender, sendResponse) => {
    // TODO: verify a sender
    storage.get("config").then(sendResponse);
    return true;
  }
);

// TODO: Set a default configuration only when it's the first time
async function main() {
  try {
    const url = chrome.runtime.getURL("data/default.json");
    const response = await fetch(url);
    if (response.status != 200) {
      throw new Error("failed to fetch default.json");
    }
    const body = await response.json();

    storage.set({
      config: body,
    });
  } catch (error) {
    console.error("failed to run main", {
      error: error,
    });
  }
}

main();
