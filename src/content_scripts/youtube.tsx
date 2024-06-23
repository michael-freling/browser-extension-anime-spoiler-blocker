import { FilteredContent } from "./content";
import { StrictMode } from "react";
import ReactDOM from "react-dom/client";

if (exports === undefined) {
  var exports = {};
}

const extensionId = "elifmnfcgkjlbclbglicfkbcdomkibdb";

interface ConfigContent {
  titles: string[];
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

class SpoilerFilter {
  config: Config;

  constructor(config: Config) {
    Object.keys(config.contents).forEach((contentId) => {
      config.contents[contentId].titles = config.contents[contentId].titles.map(
        (title) => {
          return title.toLowerCase();
        }
      );
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

  filterVideoTitle(title: string, config: ConfigContent): boolean {
    title = title.toLowerCase();
    let isTitleMatched = false;
    config.titles.forEach((configTitle) => {
      if (title.includes(configTitle)) {
        isTitleMatched = true;
      }
    });
    if (!isTitleMatched) {
      return false;
    }

    const lastSeason = config.history.season;
    const lastEpisode = config.history.episode;

    // TODO: Currently, both of season and episode are required to be matched
    // TODO: season 2 part 2 episode X can be happening
    // TODO: episode 19 (meaning season 1) can be happening
    const matches = title.match(
      /(season\s|S)([0-9]+).*(episode|Ep)\s([0-9]+)/i
    );

    console.debug({
      title,
      isTitleMatched,
      titles: config.titles,
      matches,
      lastSeason,
      lastEpisode,
    });

    if (!matches) {
      return false;
    }
    const titleSeason = parseInt(matches[2], 10);
    if (titleSeason < lastSeason) {
      return false;
    }
    if (titleSeason > lastSeason) {
      return true;
    }
    // if the title doesn't include an episode, conservatively recognize the video as a spoiler
    // if (matches.length == 2) {
    //   return false;
    // }
    const titleEpisode = parseInt(matches[4], 10);
    if (titleEpisode <= lastEpisode) {
      return false;
    }
    return true;
  }

  filter(contents: Array<HTMLElement>): Array<HTMLElement> {
    const result = [];
    contents.forEach((content) => {
      const videoTitleElement: HTMLElement =
        content.querySelector("#video-title");
      if (videoTitleElement == null) {
        return;
      }

      Object.keys(this.config.contents).forEach((contentId) => {
        const videoTitle: string = videoTitleElement.innerText;
        if (
          this.filterVideoTitle(videoTitle, this.config.contents[contentId])
        ) {
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
    const { config } = await chrome.runtime.sendMessage(extensionId, {
      event: event,
    });
    console.debug({
      config,
    });

    const filter = new SpoilerFilter(config);
    let caches: {
      [elementId: string]: HTMLElement;
    } = {};

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
        if (caches[content.id]) {
          // do not mount if it's already mounted
          return;
        }

        caches[content.id] = content;
        ReactDOM.createRoot(content).render(
          <StrictMode>
            <FilteredContent />
          </StrictMode>
        );
      });
      console.debug("Completed to filter contents");
    }, 5000);
  } catch (error) {
    console.log("error", {
      error,
    });
  }
});
