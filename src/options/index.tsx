import * as React from "react";
import { useStorage } from "@plasmohq/storage/hook";
import type { UserHistory, Config } from "~blocker";

interface InputJSONFieldProps {
  label: string;
  initialValue: Object;
  setValue: (object: Object) => void;
}

type InputJSONFieldStatus = "no" | "editing" | "saved";

function InputJSONField({
  label,
  initialValue,
  setValue: setObject,
}: InputJSONFieldProps) {
  const [status, setStatus] = React.useState<InputJSONFieldStatus>("no");
  const [value, setValue] = React.useState<string>(
    JSON.stringify(initialValue, null, 2)
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
      <h2>
        {label}.{" "}
        {status == "saved" ? "Saved" : status == "editing" ? "Editing..." : ""}
      </h2>
      <textarea
        rows={20}
        cols={20}
        value={value}
        onChange={(event) => {
          setStatus("editing");
          setValue(event.target.value);
        }}
        onBlur={(event) => {
          setObject(JSON.parse(value));
          setStatus("saved");
          setTimeout(() => {
            setStatus("no");
          }, 2000);
        }}
      />
    </div>
  );
}

export default function IndexOptions() {
  const [initialConfigValue, setConfig] = useStorage<Config>("config");
  const [initialUserHistoryValue, setUserHistory] =
    useStorage<UserHistory>("userHistory");

  if (initialConfigValue == null || initialUserHistoryValue == null) {
    return <h1>Loading...</h1>;
  }

  return (
    <>
      <h1>Settings</h1>

      <InputJSONField
        label={"Anime configuration"}
        initialValue={initialConfigValue}
        setValue={(value: Object) => {
          setConfig(value as Config);
        }}
      />
      <InputJSONField
        label={"Your watch history"}
        initialValue={initialUserHistoryValue}
        setValue={(value: Object) => {
          setUserHistory(value as UserHistory);
        }}
      />
    </>
  );
}
