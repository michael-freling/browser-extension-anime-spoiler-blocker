import { useState } from "react";

interface FilteredContentProps {
  metadata: {
    title: string;
    season: number;
    episode: number;
  };
  originalContent: HTMLElement;
}

export function FilteredContent({
  metadata,
  originalContent,
}: FilteredContentProps) {
  const [isFiltered, setFiltered] = useState(true);

  if (!isFiltered) {
    // Workaround to insert an HTMLElement, but it doesn't work at all
    // https://stackoverflow.com/questions/49297334/react-how-to-add-htmlelement
    return (
      <div
        key="non filtered"
        dangerouslySetInnerHTML={{ __html: originalContent.innerHTML }}
      />
    );
  }

  return (
    <div
      key="filtered"
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        height: "100%",
        fontSize: "1.5rem",
      }}
    >
      <div>Filtered by an spoiler filter extension</div>
      <div>
        This is a content for a {metadata.title} Season {metadata.season}{" "}
        Episode {metadata.episode}{" "}
      </div>
      <button onClick={() => setFiltered(false)} disabled={true}>
        Show the original content. (Doesn't work)
      </button>
    </div>
  );
}
