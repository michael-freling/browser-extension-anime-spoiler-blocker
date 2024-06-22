const storage = chrome.storage.sync;

storage.set({
  words: ["Mushoku Tensei", "Classroom of the Elite"],
});

// sendResponse doesn't work within an async function
// https://developer.chrome.com/docs/extensions/develop/concepts/messaging#simple
// Use onMessageExternal from webpages like a main world
// https://developer.chrome.com/docs/extensions/develop/concepts/messaging#external-webpage
chrome.runtime.onMessageExternal.addListener(
  (message, sender, sendResponse) => {
    // TODO: verify a sender
    storage.get("words").then(sendResponse);
    return true;
  }
);
