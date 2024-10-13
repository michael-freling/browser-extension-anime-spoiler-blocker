import type { PlasmoMessaging } from "@plasmohq/messaging";
import type {
  StorageHidiveConfig,
  StorageSeriesConfig,
  StorageUserHistory,
  UpdateWatchHistoryArg,
} from "~blocker/storage";
import { Storage } from "@plasmohq/storage";
import { UserHistoryManager } from "~blocker/storage";

const storage = new Storage();
const localStorage = new Storage({
  area: "local",
});

export type UpdateWatchHistoryRequest = UpdateWatchHistoryArg;

const handler: PlasmoMessaging.MessageHandler<
  UpdateWatchHistoryRequest
> = async (req, res) => {
  const message = req.body;
  // no support other than tv shows
  if (message.mediaType != "tv") {
    return;
  }

  Promise.all([storage.get("hidive"), storage.get("userHistory")]).then(
    async (promises) => {
      const [hidiveConfig, userHistory]: [
        StorageHidiveConfig,
        StorageUserHistory,
      ] = promises as any;

      let title: string = "";
      if (!("title" in message)) {
        const series = hidiveConfig.series.filter(
          (series) => series.seasonId == message.seasonId
        );
        if (series.length > 0) {
          title = series[0].title;
        }
      } else {
        title = message.title;
      }

      let seriesConfig: StorageSeriesConfig | null = null;
      if (title != null) {
        seriesConfig = await localStorage.get(`series.${title}`);
      }

      const userHistoryManager = new UserHistoryManager(
        hidiveConfig ?? { series: [] },
        userHistory ?? { series: [] }
      );
      const updatedConfigs = await userHistoryManager.updateWatchHistory(
        seriesConfig,
        message
      );
      if (updatedConfigs == null) {
        return;
      }

      if (updatedConfigs.series != null) {
        const title = updatedConfigs.series.title;
        await localStorage.set(`series.${title}`, updatedConfigs.series);
      }
      if (updatedConfigs.hidiveConfig != null) {
        await storage.set("hidive", updatedConfigs.hidiveConfig);
      }
      if (updatedConfigs.userHistory != null) {
        await storage.set("userHistory", updatedConfigs.userHistory);
      }
    }
  );
};

export default handler;
