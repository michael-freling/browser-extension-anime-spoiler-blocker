const extensionId = "elifmnfcgkjlbclbglicfkbcdomkibdb";

class SpoilerFilter {
  forbiddenWords: string[];

  constructor(forbiddenWords) {
    this.forbiddenWords = forbiddenWords.map((word) => {
      return word.toLowerCase();
    });
  }

  readContents(): Array<HTMLElement> {
    // There are multiple #content elements in a different level,
    // So, instead of just getting #content, filter contents by #contents > #content
    const pageContents = document.querySelectorAll("#contents");
    const contents = [];
    pageContents.forEach((pageContent) => {
      pageContent.querySelectorAll("#content").forEach((content) => {
        contents.push(content);
      });
    });
    return contents;
  }

  filter(contents: Array<HTMLElement>): Array<HTMLElement> {
    const result = [];
    contents.forEach((content) => {
      const videoTitleElement: HTMLElement =
        content.querySelector("#video-title");
      if (videoTitleElement == null) {
        return;
      }

      this.forbiddenWords.forEach((forbiddenWord) => {
        const title: string = videoTitleElement.innerText;
        if (title.toLowerCase().includes(forbiddenWord)) {
          result.push(content);
          return;
        }
      });
    });
    return result;
  }
}

// Listen for messages from the main world
window.addEventListener("load", async (event) => {
  try {
    // Sends a message to the service worker and receives a tip in response
    const { words } = await chrome.runtime.sendMessage(extensionId, {
      event: event,
    });
    console.log({
      words,
    });

    const filter = new SpoilerFilter(words);

    // Filter contents every 5 seconds. This is because
    // 1. Some contents are not available when a page is loaded
    // 2. When scrolling a page, new contents also need to be filtered
    setInterval(() => {
      const contents = filter.readContents();
      if (contents.length == 0) {
        // At first, YouTube contents are not loaded when a window was loaded
        // Reload the contents when a content isn't available
        return;
      }

      const filteredContents = filter.filter(contents);
      filteredContents.forEach((content) => {
        content.innerHTML = "Removed by a spoiler filter";
      });
      console.debug("Completed to filter contents");
    }, 5000);
  } catch (error) {
    console.log("error", {
      error,
    });
  }
});
