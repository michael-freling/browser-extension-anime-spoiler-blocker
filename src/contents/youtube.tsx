import "react";
import React, { useEffect, useState } from "react";
import { TextSpoilerAnalyzer, Spoiler } from "../blocker";
import { StorageUserHistory, StorageSeriesConfig } from "~blocker/storage";
import type {
  PlasmoCSConfig,
  PlasmoCSUIProps,
  PlasmoGetInlineAnchorList,
} from "plasmo";
import { sendToBackground } from "@plasmohq/messaging";
import { getXPathFromElement } from "~dom/xpath";

export const config: PlasmoCSConfig = {
  matches: ["https://www.youtube.com/*"],
};

export interface StorageAnimeConfig {
  series: StorageSeriesConfig[];
}

class VideoSpoilerFilter {
  textAnalyzer: TextSpoilerAnalyzer;

  constructor(analyzer: TextSpoilerAnalyzer) {
    this.textAnalyzer = analyzer;
  }

  readContents(): Element[] {
    // There are multiple #content elements in a different level,
    // So, instead of just getting #content, filter contents by #contents > #content
    const pageContents = document.querySelectorAll("#contents");
    const contents: {
      [id: string]: Element;
    } = {};
    pageContents.forEach((pageContent) => {
      // Top page
      // pageContent.querySelectorAll("#content").forEach((content) => {
      //   contents.push(content);
      // });
      // Search page
      pageContent.querySelectorAll("#dismissible").forEach((content) => {
        const path = getXPathFromElement(content);
        if (contents[path] != null) {
          return;
        }
        contents[path] = content;
      });
    });
    return Object.values(contents);
  }

  filter(contents: Element[]): HTMLElement[] {
    const result: HTMLElement[] = [];

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

      result.push(content as HTMLElement);
    });
    return result;
  }
}

let blockerConfig: StorageAnimeConfig;
let userHistory: StorageUserHistory;

window.addEventListener("load", async (event) => {
  const result = await sendToBackground({
    name: "getConfig",
  });
  blockerConfig = result.config;
  userHistory = result.userHistory;
});

// Block contents every 5 seconds. This is because
// 1. Some contents are not available when a page is loaded
// 2. When scrolling a page, new contents also need to be blocked
export const getInlineAnchorList: PlasmoGetInlineAnchorList = async () => {
  if (blockerConfig == null || userHistory == null) {
    return;
  }

  const blocker = new VideoSpoilerFilter(
    new TextSpoilerAnalyzer(blockerConfig, userHistory)
  );

  const contents = blocker.readContents();
  if (contents.length == 0) {
    // At first, YouTube contents are not loaded when a window was loaded
    // Reload the contents when a content isn't available
    return;
  }

  const blockedContents = blocker.filter(contents);
  return blockedContents
    .filter((contentHTMLElement) => {
      return contentHTMLElement.dataset.animeSpoilerBlockerBlocked == null;
    })
    .map((contentHTMLElement) => {
      contentHTMLElement.dataset.animeSpoilerBlockerBlocked = "true";

      return {
        element: contentHTMLElement,
        insertPosition: "afterend",
      };
    });
};

interface BlockedContentProps {
  spoiler: Spoiler;
  onUnblock: () => void;
}

const BlockedContent: React.FunctionComponent<BlockedContentProps> = ({
  spoiler,
  onUnblock,
}) => {
  let details = spoiler.title;
  if (spoiler.season) {
    details += ` Season ${spoiler.season}`;
  }
  if (spoiler.episode) {
    details += ` Episode ${spoiler.episode}`;
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        fontSize: "1.5rem",
        padding: "8px",

        color: "#fff",
        backgroundColor: "#cc4400",
      }}
    >
      <div>Blocked by an Anime Spoiler Blocker</div>
      <div>This is the video for {details}</div>
      <button
        onClick={onUnblock}
        style={{
          margin: "8px",
          padding: "8px",
          backgroundColor: "#cccc00",
          color: "#222",
          borderRadius: "8px",
        }}
      >
        Unblock
      </button>
    </div>
  );
};

const InlineComponent: React.FC<PlasmoCSUIProps> = ({ anchor }) => {
  const element = anchor.element as HTMLElement;
  const [originalStyle] = useState<string>(element.style.display);

  const videoTitleElement = element.querySelector(
    "#video-title"
  ) as HTMLElement;
  if (videoTitleElement == null) {
    return;
  }

  useEffect(() => {
    if (originalStyle == "none") {
      return;
    }

    element.style.display = "none";
  }, [originalStyle]);

  // TODO: remove duplicated text analysis
  const textAnalyzer = new TextSpoilerAnalyzer(blockerConfig, userHistory);
  const videoSpoiler = textAnalyzer.extractSpoiler(videoTitleElement.innerText);
  if (videoSpoiler.title == "") {
    return;
  }

  return (
    <div>
      <BlockedContent
        spoiler={videoSpoiler}
        onUnblock={() => {
          // unmount this react component
          element.style.display = originalStyle;
          delete element.dataset.animeSpoilerBlockerBlocked;
          anchor.root.unmount();
        }}
      />
    </div>
  );
};

export default InlineComponent;
