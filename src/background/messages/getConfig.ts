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
  // Nothing is stored yet right after an installation
  const userHistory: StorageUserHistory = ((await storage.get(
    "userHistory",
  )) as StorageUserHistory) ?? { series: [] };

  const titles = (userHistory.series ?? []).map((series) => series.title);
  const seriesConfigs = await Promise.all(
    titles.map((title) =>
      localStorage.get<StorageSeriesConfig>(`series.${title}`),
    ),
  );
  const config: StorageAnimeConfig = {
    // A series config can be missing if fetching it from Jikan failed
    series: seriesConfigs.filter((series) => series != null),
  };

  res.send({
    config,
    userHistory,
  });
};

export default handler;
