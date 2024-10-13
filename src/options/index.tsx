import * as React from "react";
import { useStorage } from "@plasmohq/storage/hook";
import { type StorageUserHistory, type StorageAnimeConfig, type StorageSeriesConfig } from "~blocker/storage";

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
    const [initialSeriesConfigValue, setSeriesConfigValue] = useStorage<StorageSeriesConfig>(`series.${title}`);
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
  const [initialConfigValue, setConfig] =
    useStorage<StorageAnimeConfig>("config");
  const [initialUserHistoryValue, setUserHistory] =
    useStorage<StorageUserHistory>("userHistory");

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
          setConfig(value as StorageAnimeConfig);
        }}
      />
      <InputJSONField
        label={"Your watch history"}
        initialValue={initialUserHistoryValue}
        setValue={(value: Object) => {
          setUserHistory(value as StorageUserHistory);
        }}
      />

      {initialUserHistoryValue.series.map((series) => <SeriesConfig key={series.title} title={series.title} />)}
    </>
  );
}
