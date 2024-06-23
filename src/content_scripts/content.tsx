import { useState } from "react";
import { Spoiler } from "../spoiler";

interface BlockedContentProps {
  spoiler: Spoiler;
  originalContent: HTMLElement;
}

export function BlockedContent({
  spoiler,
  originalContent,
}: BlockedContentProps) {
  const [isBlocked, setBlocked] = useState(true);

  if (!isBlocked) {
    // Workaround to insert an HTMLElement, but it doesn't work at all
    // https://stackoverflow.com/questions/49297334/react-how-to-add-htmlelement
    return (
      <div
        key="non blocked"
        dangerouslySetInnerHTML={{ __html: originalContent.innerHTML }}
      />
    );
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
      }}
    >
      <div>Blocked by an spoiler blocker extension</div>
      <div>This is a content for a {details}</div>
      {/*
      <button onClick={() => setBlocked(false)} disabled={true}>
        Show the original content. (Doesn't work)
      </button>
      */}
    </div>
  );
}
