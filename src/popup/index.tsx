import * as React from "react";

export default function IndexPopup() {
  return (
    <div
      style={{
        width: "160px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          padding: "8px",
          color: "#eee",
          backgroundColor: "#0088cc",
          display: "flex",
          flexDirection: "row",
          justifyContent: "center",
        }}
      >
        <img
          src="/assets/icon.png"
          style={{
            width: "auto",
            height: "16px",
            marginRight: "4px",
          }}
        />
        Anime Spoiler Blocker
      </div>
      <ul>
        <li
          onClick={() => {
            const extensionID = process.env.PLASMO_PUBLIC_EXTENSION_ID;
            const url = `extension://${extensionID}/options.html`;
            chrome.tabs.create({ url });
          }}
        >
          Settings
        </li>
      </ul>
    </div>
  );
}
