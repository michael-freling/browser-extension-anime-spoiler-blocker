import * as React from "react";
import { useEffect, useState } from "react";
import { Spoiler } from "../blocker";

interface BlockedContentProps {
  spoiler: Spoiler;
  originalContent: HTMLElement;
  originalContentDisplayStyle: string;
}

export function BlockedContent({
  spoiler,
  originalContent,
  originalContentDisplayStyle,
}: BlockedContentProps) {
  const [isBlocked, setBlocked] = useState(true);

  useEffect(() => {
    if (isBlocked) {
      originalContent.style.display = "none";
    } else {
      originalContent.style.display = originalContentDisplayStyle;
    }
  }, [isBlocked]);

  if (!isBlocked) {
    // Hide the react content but show the original content
    return <></>;
  }

  let details = spoiler.title;
  if (spoiler.season) {
    details += ` Season ${spoiler.season}`;
  }
  if (spoiler.episode) {
    details += ` Episode ${spoiler.episode}`;
  }

  return (
    <div
      key="blocked"
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        height: "100%",
        fontSize: "1.5rem",
        padding: "8px",

        color: "#fff",
        backgroundColor: "#cc4400",
      }}
    >
      <div>Blocked by an Anime Spoiler Blocker</div>
      <div>This is the video for {details}</div>
      <button
        onClick={() => setBlocked(false)}
        style={{
          margin: "8px",
          padding: "8px",
          backgroundColor: "#cccc00",
          color: "#222",
          borderRadius: "8px",
        }}
      >
        Unblock
      </button>
    </div>
  );
}
