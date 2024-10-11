import type { PlasmoMessaging } from "@plasmohq/messaging";
import type {
  StorageAnimeConfig,
  StorageUserHistory,
  UpdateWatchHistoryArg,
} from "~blocker/storage";
import { Storage } from "@plasmohq/storage";
import { UserHistoryManager } from "~blocker/storage";

const storage = new Storage();

export type UpdateWatchHistoryRequest = UpdateWatchHistoryArg;

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
      const updatedConfigs =
        await userHistoryManager.updateWatchHistory(message);
      if (updatedConfigs == null) {
        return;
      }
      if (updatedConfigs.config != null) {
        await storage.set("config", updatedConfigs.config);
      }
      if (updatedConfigs.userHistory != null) {
        await storage.set("userHistory", updatedConfigs.userHistory);
      }
    }
  );
};

export default handler;
