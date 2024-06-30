import { BlockedContent } from "./content";
import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { Config, TextSpoilerAnalyzer, Spoiler } from "../blocker";
import { getXPathFromElement } from "../dom/xpath";

class VideoSpoilerFilter {
  textAnalyzer: TextSpoilerAnalyzer;

  constructor(analyzer: TextSpoilerAnalyzer) {
    this.textAnalyzer = analyzer;
  }

  readContents(): Element[] {
    // There are multiple #content elements in a different level,
    // So, instead of just getting #content, filter contents by #contents > #content
    const pageContents = document.querySelectorAll("#contents");
    const contents: Element[] = [];
    pageContents.forEach((pageContent) => {
      // Top page
      // pageContent.querySelectorAll("#content").forEach((content) => {
      //   contents.push(content);
      // });
      // Search page
      pageContent.querySelectorAll("#dismissible").forEach((content) => {
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

      const videoSpoiler = this.textAnalyzer.extractSpoiler(
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
    const { config, userHistory } = await chrome.runtime.sendMessage({
      type: "getConfig",
    });
    // console.debug({
    //   config,
    //   userHistory,
    // });

    const blocker = new VideoSpoilerFilter(
      new TextSpoilerAnalyzer(config, userHistory)
    );
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
        const cacheKey = getXPathFromElement(contentHTMLElement);
        // contentHTMLElement.id is not unique and cannot be used as a cache key
        if (caches[cacheKey]) {
          // do not mount a react component if it's already mounted
          return;
        }
        const root = document.createElement("div");
        contentHTMLElement.parentElement!.appendChild(root);

        caches[cacheKey] = contentHTMLElement;
        ReactDOM.createRoot(root).render(
          <StrictMode>
            <BlockedContent
              spoiler={spoiler}
              originalContent={contentHTMLElement as HTMLElement}
              originalContentDisplayStyle={
                (contentHTMLElement as HTMLElement).style.display
              }
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
