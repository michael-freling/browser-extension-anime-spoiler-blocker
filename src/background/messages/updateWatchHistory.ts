import type { PlasmoMessaging } from "@plasmohq/messaging";
import type { StorageAnimeConfig, StorageUserHistory } from "~blocker/storage";
import { Storage } from "@plasmohq/storage";
import { UserHistoryManager } from "~blocker/storage";

const storage = new Storage();

export interface UpdateWatchHistoryRequest {
  webServiceName: string;
  mediaType: string;

  // The title might be multiple choices. Enable to pass one of them to match a history
  titles: string[];
  season: number;
  episode: number;
}

const handler: PlasmoMessaging.MessageHandler<
  UpdateWatchHistoryRequest
> = async (req, res) => {
  const message = req.body;
  // no support other than tv shows
  if (message.mediaType != "tv") {
    return;
  }

  Promise.all([storage.get("config"), storage.get("userHistory")]).then(
    async (promises) => {
      const [config, userHistory]: [StorageAnimeConfig, StorageUserHistory] =
        promises as any;
      const userHistoryManager = new UserHistoryManager(config, userHistory);
      const updatedConfigs = userHistoryManager.updateWatchHistory(message);
      if (updatedConfigs == null || updatedConfigs.userHistory == null) {
        return;
      }
      if (updatedConfigs.config != null) {
        await storage.set("config", updatedConfigs.config);
      }
      await storage.set("userHistory", updatedConfigs.userHistory);
    }
  );
};

export default handler;
