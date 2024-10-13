import * as React from "react";
import { Storage } from "@plasmohq/storage";
import { useStorage } from "@plasmohq/storage/hook";
import {
  type StorageUserHistory,
  type StorageSeriesConfig,
  StorageHidiveConfig,
} from "~blocker/storage";

interface InputJSONFieldProps {
  label: string;
  initialValue: Object;
  disabled?: boolean;
  setValue: (object: Object) => void;
}

type InputJSONFieldStatus = "no" | "editing" | "saved";

function InputJSONField({
  label,
  initialValue,
  disabled,
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
        disabled={disabled ?? false}
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

function SeriesConfig(props: { title: string }) {
  const { title } = props;
  const [initialSeriesConfigValue, setSeriesConfigValue] =
    useStorage<StorageSeriesConfig>({
      key: `series.${title}`,
      instance: new Storage({ area: "local" }),
    });
  if (initialSeriesConfigValue == null) {
    return <h1>Loading {title}...</h1>;
  }
  return (
    <InputJSONField
      disabled={true}
      label={`${title} configuration`}
      initialValue={initialSeriesConfigValue}
      setValue={(value: Object) => {
        setSeriesConfigValue(value as StorageSeriesConfig);
      }}
    />
  );
}

export default function IndexOptions() {
  let [initialHidiveConfigValue, setHidiveConfig] =
    useStorage<StorageHidiveConfig>("hidive");
  let [initialUserHistoryValue, setUserHistory] =
    useStorage<StorageUserHistory>("userHistory");

  if (initialHidiveConfigValue == null || initialUserHistoryValue == null) {
    return <h1>Loading...</h1>;
  }
  let titles: { [key: string]: string } = {};

  for (const series of initialUserHistoryValue.series) {
    titles[series.title] = series.title;
  }
  for (const series of initialHidiveConfigValue.series) {
    titles[series.title] = series.title;
  }
  const seriesTitles = Object.keys(titles).sort();

  return (
    <>
      <h1>Settings</h1>
      <InputJSONField
        label={"Your watch history"}
        initialValue={initialUserHistoryValue}
        setValue={(value: Object) => {
          setUserHistory(value as StorageUserHistory);
        }}
      />
      <InputJSONField
        label={"Hidive configuration"}
        initialValue={initialHidiveConfigValue}
        setValue={(value: Object) => {
          setHidiveConfig(value as StorageHidiveConfig);
        }}
      />

      {seriesTitles.map((title) => (
        <SeriesConfig key={title} title={title} />
      ))}

      <div
        style={{
          display: "flex",
          flexDirection: "row",
        }}
      >
        <button
          style={{
            margin: "8px",
            marginLeft: "auto",
            padding: "4px",

            color: "white",
            backgroundColor: "red",
            border: "1px solid red",
            borderRadius: "8px",
          }}
          onClick={() => {
            new Storage().clear();
            new Storage({ area: "local" }).clear();
            setHidiveConfig({ series: [] });
            setUserHistory({ series: [] });
          }}
        >
          Delete all configurations
        </button>
      </div>
    </>
  );
}
