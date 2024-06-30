import { StrictMode } from "react";
import ReactDOM from "react-dom/client";

function Popup() {
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
        Spoiler Blocker
      </div>
      <ul>
        <li
          onClick={() => {
            const extensionID = process.env.EXTENSION_ID;
            const url = `extension://${extensionID}/assets/options.html`;
            chrome.tabs.create({ url });
          }}
        >
          Settings
        </li>
      </ul>
    </div>
  );
}

const root = document.querySelector("#main");
ReactDOM.createRoot(root!).render(
  <StrictMode>
    <Popup />
  </StrictMode>
);
