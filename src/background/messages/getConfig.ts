import type { PlasmoMessaging } from "@plasmohq/messaging";
import type { StorageSeriesConfig, StorageUserHistory } from "~blocker/storage";
import { Storage } from "@plasmohq/storage";
import { StorageAnimeConfig } from "~blocker";

const storage = new Storage();
const localStorage = new Storage({
  area: "local",
});

const handler: PlasmoMessaging.MessageHandler<
  {},
  {
    config: StorageAnimeConfig;
    userHistory: StorageUserHistory;
  }
> = async (req, res) => {
  const userHistory: StorageUserHistory = (await storage.get(
    "userHistory"
  )) as StorageUserHistory;

  const titles = userHistory.series.map((series) => series.title);
  let config: StorageAnimeConfig = {
    series: await Promise.all(
      titles.map((title) =>
        localStorage.get<StorageSeriesConfig>(`series.${title}`)
      )
    ),
  };

  res.send({
    config,
    userHistory,
  });
};

export default handler;
