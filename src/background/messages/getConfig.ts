import type { PlasmoMessaging } from "@plasmohq/messaging";
import type { StorageAnimeConfig, StorageUserHistory } from "~blocker/storage";
import { Storage } from "@plasmohq/storage";

const storage = new Storage();

const handler: PlasmoMessaging.MessageHandler<
  {},
  {
    config: StorageAnimeConfig;
    userHistory: StorageUserHistory;
  }
> = async (req, res) => {
  Promise.all([storage.get("config"), storage.get("userHistory")]).then(
    (result) => {
      const [config, userHistory]: [StorageAnimeConfig, StorageUserHistory] =
        result as any;
      res.send({
        config,
        userHistory,
      });
    }
  );
};

export default handler;
