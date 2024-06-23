import { BlockedContent } from "./content";
import { StrictMode } from "react";
import ReactDOM from "react-dom/client";

if (exports === undefined) {
  var exports = {};
}

const extensionId = "bihgndcmdfolacndjgodbfgphlbdcden";

interface ConfigContent {
  title: string;
  keywords: string[];
  history: {
    season: number;
    episode: number;
  };
}

interface Config {
  contents: {
    [contentId: string]: ConfigContent;
  };
}

interface VideoMetadata {
  title: string;
  season: number;
  episode: number;
}

class SpoilerBlocker {
  config: Config;

  constructor(config: Config) {
    Object.keys(config.contents).forEach((contentId) => {
      config.contents[contentId].keywords = config.contents[
        contentId
      ].keywords.map((keyword) => {
        return keyword.toLowerCase();
      });
    });

    this.config = config;
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

  getVideoMetadata(title: string, config: ConfigContent): VideoMetadata {
    title = title.toLowerCase();
    let titleFound = false;
    config.keywords.forEach((configKeyword) => {
      if (title.includes(configKeyword)) {
        titleFound = true;
      }
    });
    if (!titleFound) {
      return;
    }

    // TODO: Currently, both of season and episode are required to be matched
    // TODO: season 2 part 2 episode X can be happening
    // TODO: episode 19 (meaning season 1) can be happening
    const matches = title.match(
      /(season\s|S)([0-9]+).*(episode|Ep)\s([0-9]+)/i
    );

    console.debug({
      title,
      matches,
    });

    if (!matches) {
      return;
    }

    const titleSeason = parseInt(matches[2], 10);
    const titleEpisode = parseInt(matches[4], 10);

    return {
      title: config.title,
      season: titleSeason,
      episode: titleEpisode,
    };
  }

  filter(contents: Array<HTMLElement>): {
    contentHTMLElement: HTMLElement;
    metadata: VideoMetadata;
  }[] {
    const result: {
      contentHTMLElement: HTMLElement;
      metadata: VideoMetadata;
    }[] = [];
    contents.forEach((content) => {
      const videoTitleElement: HTMLElement =
        content.querySelector("#video-title");
      if (videoTitleElement == null) {
        return;
      }

      Object.keys(this.config.contents).forEach((contentId) => {
        const config = this.config.contents[contentId];
        const videoTitle: string = videoTitleElement.innerText;
        const videoMetadata = this.getVideoMetadata(videoTitle, config);
        if (videoMetadata == null) {
          return;
        }

        const lastSeason = config.history.season;
        const lastEpisode = config.history.episode;

        if (videoMetadata.season < lastSeason) {
          return;
        }
        if (
          videoMetadata.season == lastSeason &&
          videoMetadata.episode <= lastEpisode
        ) {
          return;
        }
        // if the title doesn't include an episode, conservatively recognize the video as a spoiler
        // if (matches.length == 2) {
        //   return false;
        // }

        result.push({
          contentHTMLElement: content,
          metadata: videoMetadata,
        });
        return;
      });
    });
    return result;
  }
}

// Listen for messages from the main world
window.addEventListener("load", async (event) => {
  try {
    // Sends a message to the service worker and receives a tip in response
    const { config } = await chrome.runtime.sendMessage(extensionId, {
      event: event,
    });
    console.debug({
      config,
    });

    const blocker = new SpoilerBlocker(config);
    let caches: {
      [elementId: string]: HTMLElement;
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
      blockedContents.forEach(({ contentHTMLElement, metadata }) => {
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
              metadata={metadata}
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
