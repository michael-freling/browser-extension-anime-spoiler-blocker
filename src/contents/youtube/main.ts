import { sendToBackground } from "@plasmohq/messaging";
import { TextSpoilerAnalyzer } from "~blocker";
import { YouTubeSpoilerBlocker } from "./blocker";

export async function loadAnalyzer(): Promise<TextSpoilerAnalyzer> {
  const result = await sendToBackground({
    name: "getConfig",
  });
  return new TextSpoilerAnalyzer(result.config, result.userHistory);
}

/**
 * Whether a storage change can change which videos are spoilers.
 */
export function isConfigChange(changes: {
  [key: string]: chrome.storage.StorageChange;
}): boolean {
  return Object.keys(changes).some(
    (key) => key == "userHistory" || key.startsWith("series."),
  );
}

export function main(doc: Document = document): YouTubeSpoilerBlocker {
  const blocker = new YouTubeSpoilerBlocker(doc);
  blocker.start();

  const refresh = async () => {
    try {
      blocker.setAnalyzer(await loadAnalyzer());
    } catch (error) {
      console.error("failed to load a spoiler configuration", error);
      // Show the page instead of hiding every video
      blocker.setAnalyzer(null);
    }
  };
  refresh();

  // Apply a new watch history without reloading YouTube, which is a single page app
  chrome.storage.onChanged.addListener((changes) => {
    if (isConfigChange(changes)) {
      refresh();
    }
  });
  return blocker;
}
