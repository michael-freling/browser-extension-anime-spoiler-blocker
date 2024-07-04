import type { PlasmoMessaging } from "@plasmohq/messaging";
import type { Config, UserHistory } from "~blocker";
import { Storage } from "@plasmohq/storage";

const storage = new Storage();

const handler: PlasmoMessaging.MessageHandler<
  {},
  {
    config: Config;
    userHistory: UserHistory;
  }
> = async (req, res) => {
  Promise.all([storage.get("config"), storage.get("userHistory")]).then(
    (result) => {
      const [config, userHistory]: [Config, UserHistory] = result as any;
      res.send({
        config,
        userHistory,
      });
    }
  );
};

export default handler;
