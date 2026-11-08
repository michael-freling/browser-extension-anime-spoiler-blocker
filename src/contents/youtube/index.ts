import type { PlasmoCSConfig } from "plasmo";
import { main } from "./main";

export const config: PlasmoCSConfig = {
  matches: ["https://www.youtube.com/*"],
  // Start before YouTube renders videos, so that spoilers are never shown
  run_at: "document_start",
};

main();
