import type { PlasmoMessaging } from "@plasmohq/messaging";
import type { Config, UserHistory } from "~blocker";
import { Storage } from "@plasmohq/storage";

const storage = new Storage();

export interface UpdateWatchHistoryRequest {
  webServiceName: string;
  mediaType: string;
  series: string;
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
      const [config, userHistory]: [Config, UserHistory] = promises as any;
      if (config.services[message.webServiceName] == null) {
        return;
      }

      let result;
      Object.entries(
        (config as Config).services[message.webServiceName].series
      ).forEach(([seriesID, thisSeries]) => {
        if (
          thisSeries.title.toLocaleLowerCase() ==
          message.series.toLocaleLowerCase()
        ) {
          result = seriesID;
          return;
        }
      });

      if (result == null) {
        return;
      }
      if (userHistory.series[result] == null) {
        userHistory.series[result] = {
          tv: {
            season: 0,
            episode: 0,
          },
        };
      }
      if (message.season < userHistory.series[result].tv.season) {
        return;
      }
      if (
        message.season == userHistory.series[result].tv.season &&
        message.episode <= userHistory.series[result].tv.episode
      ) {
        return;
      }

      userHistory.series[result].tv.season = message.season;
      userHistory.series[result].tv.episode = message.episode;
      await storage.set("userHistory", userHistory);
      console.info("Updated a watch history", {
        series: message.series,
        season: userHistory.series[result].tv.season,
        episode: userHistory.series[result].tv.episode,
      });
    }
  );
};

export default handler;
