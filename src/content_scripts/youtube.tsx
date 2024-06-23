import { BlockedContent } from "./content";
import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { Config, TextSpoilerAnalyzer, Spoiler } from "../spoiler";

class VideoSpoilerFilter {
  textParser: TextSpoilerAnalyzer;

  constructor(config: Config) {
    this.textParser = new TextSpoilerAnalyzer(config);
  }

  readContents(): Element[] {
    // There are multiple #content elements in a different level,
    // So, instead of just getting #content, filter contents by #contents > #content
    const pageContents = document.querySelectorAll("#contents");
    const contents: Element[] = [];
    pageContents.forEach((pageContent) => {
      pageContent.querySelectorAll("#content").forEach((content) => {
        contents.push(content);
      });
    });
    return contents;
  }

  filter(contents: Element[]): {
    contentHTMLElement: Element;
    spoiler: Spoiler;
  }[] {
    const result: {
      contentHTMLElement: Element;
      spoiler: Spoiler;
    }[] = [];
    contents.forEach((content) => {
      const videoTitleElement = content.querySelector(
        "#video-title"
      ) as HTMLElement;
      if (videoTitleElement == null) {
        return;
      }

      const videoSpoiler = this.textParser.extractSpoiler(
        videoTitleElement.innerText
      );
      if (videoSpoiler.title == "") {
        return;
      }

      result.push({
        contentHTMLElement: content,
        spoiler: videoSpoiler,
      });
      return;
    });
    return result;
  }
}

// Listen for messages from the main world
window.addEventListener("load", async (event) => {
  try {
    // Sends a message to the service worker and receives a tip in response
    const { config } = await chrome.runtime.sendMessage(
      process.env.EXTENSION_ID,
      {
        event: event,
      }
    );
    console.debug({
      config,
    });

    const blocker = new VideoSpoilerFilter(config);
    let caches: {
      [elementId: string]: Element;
    } = {};

    // Block contents every 5 seconds. This is because
    // 1. Some contents are not available when a page is loaded
    // 2. When scrolling a page, new contents also need to be blocked
    setInterval(() => {
      const contents = blocker.readContents();
      if (contents.length == 0) {
        // At first, YouTube contents are not loaded when a window was loaded
        // Reload the contents when a content isn't available
        return;
      }

      const blockedContents = blocker.filter(contents);
      blockedContents.forEach(({ contentHTMLElement, spoiler }) => {
        if (caches[contentHTMLElement.id]) {
          // do not mount if it's already mounted
          return;
        }

        caches[contentHTMLElement.id] = contentHTMLElement;
        const originalContent = contentHTMLElement.cloneNode(
          true
        ) as HTMLElement;
        ReactDOM.createRoot(contentHTMLElement).render(
          <StrictMode>
            <BlockedContent
              spoiler={spoiler}
              originalContent={originalContent}
            />
          </StrictMode>
        );
      });
      console.debug("Completed to block contents");
    }, 5000);
  } catch (error) {
    console.log("error", {
      error,
    });
  }
});
