// Listen for messages from the main world
window.addEventListener("load", async (event) => {
  try {
    // Sends a message to the service worker and receives a tip in response
    const extensionId = "abjlgogdppkdbbinpgfhakcfejamakie"
    const { words } = await chrome.runtime.sendMessage(extensionId, {
      event: event
    });
    console.log({
      words
    })
  } catch (error) {
    console.log("error", {
      error
    })
  }
});

/*
(async () => {
  try {
    // Sends a message to the service worker and receives a tip in response
    const extensionId = "abjlgogdppkdbbinpgfhakcfejamakie"
    const { words } = await chrome.runtime.sendMessage(extensionId, { greeting: 'tip' });
    console.log({
      words
    })
  } catch (error) {
    console.log("error", {
      error
    })
  }
})();
*/