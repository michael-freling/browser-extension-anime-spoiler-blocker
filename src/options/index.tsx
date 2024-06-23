import React, { StrictMode, useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom/client";

const storage = chrome.storage.sync;

interface InputJSONFieldProps {
  label: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onBlur: (event: React.FocusEvent<HTMLTextAreaElement>) => void;
}

type InputJSONFieldStatus = "no" | "editing" | "saved";

function InputJSONField({
  label,
  value,
  onChange,
  onBlur,
}: InputJSONFieldProps) {
  const [status, setStatus] = useState<InputJSONFieldStatus>("no");

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
      <h2>
        {label}.
        {status == "saved" ? "Saved" : status == "editing" ? "Editing..." : ""}
      </h2>
      <textarea
        rows={20}
        cols={20}
        value={value}
        onChange={(event) => {
          console.log(event.target.value);
          setStatus("editing");
          onChange(event);
        }}
        onBlur={(event) => {
          onBlur(event);
          setStatus("saved");
          setTimeout(() => {
            setStatus("no");
          }, 5000);
        }}
      />
    </div>
  );
}

function Options() {
  const [config, setConfig] = useState<string>("");
  const [userHistory, setUserHistory] = useState<string>("");

  useEffect(() => {
    (async () => {
      const { config: storageConfig, userHistory: storageUserHistory } =
        await storage.get(["config", "userHistory"]);

      console.log({
        storageUserHistory,
      });

      setConfig(JSON.stringify(storageConfig, null, 2));
      setUserHistory(JSON.stringify(storageUserHistory, null, 2));
    })();
  }, []);

  return (
    <>
      <h1>Options</h1>
      <InputJSONField
        label={"Series data"}
        value={config}
        onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => {
          setConfig(event.target.value);
        }}
        onBlur={(event: React.FocusEvent<HTMLTextAreaElement>) => {
          storage.set({ config: JSON.parse(config) });
        }}
      />
      <InputJSONField
        label={"Your series watch history"}
        value={userHistory}
        onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => {
          setUserHistory(event.target.value);
        }}
        onBlur={(event: React.FocusEvent<HTMLTextAreaElement>) => {
          storage.set({ userHistory: JSON.parse(userHistory) });
        }}
      />
    </>
  );
}

const root = document.getElementById("root");
ReactDOM.createRoot(root!).render(
  <StrictMode>
    <Options />
  </StrictMode>
);
