/**
 * @jest-environment jsdom
 */
import * as React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { useStorage } from "@plasmohq/storage/hook";
import { areas, resetStorage } from "~test/plasmoStorage";
import IndexOptions from ".";

jest.mock("@plasmohq/storage", () => require("~test/plasmoStorage"));
jest.mock("@plasmohq/storage/hook", () => ({
  useStorage: jest.fn(),
}));

const mockUseStorage = useStorage as jest.Mock;
let values: { [key: string]: any };
let setters: { [key: string]: jest.Mock };

beforeEach(() => {
  resetStorage();
  values = {};
  setters = {};
  mockUseStorage.mockImplementation((options) => {
    const key = typeof options == "string" ? options : options.key;
    setters[key] = setters[key] ?? jest.fn();
    return [values[key], setters[key]];
  });
});

afterEach(() => {
  jest.useRealTimers();
});

test("shows loading until configurations are loaded", () => {
  render(<IndexOptions />);
  expect(screen.getByText("Loading...")).toBeTruthy();
});

describe("with configurations", () => {
  beforeEach(() => {
    values.userHistory = {
      series: [{ title: "A", tv: { season: 1, episode: 2 } }],
    };
    values.hidive = { series: [{ seasonId: "1", season: 1, title: "B" }] };
    values["series.A"] = { title: "A", keywords: ["A"] };
  });

  test("shows each configuration", () => {
    render(<IndexOptions />);
    expect(screen.getByText("Settings")).toBeTruthy();
    expect(screen.getByText(/A configuration/)).toBeTruthy();
    // B has no series configuration yet
    expect(screen.getByText("Loading B...")).toBeTruthy();
  });

  test("saves a watch history edited as JSON", () => {
    jest.useFakeTimers();
    render(<IndexOptions />);
    const textarea = screen.getAllByRole("textbox")[0];

    fireEvent.change(textarea, { target: { value: '{"series": []}' } });
    expect(screen.getByText(/Editing\.\.\./)).toBeTruthy();

    fireEvent.blur(textarea);
    expect(setters.userHistory).toHaveBeenCalledWith({ series: [] });
    expect(screen.getByText(/Saved/)).toBeTruthy();

    act(() => {
      jest.advanceTimersByTime(2000);
    });
    expect(screen.queryByText(/Saved/)).toBeNull();
  });

  test("saves a HIDIVE configuration and a series configuration", () => {
    render(<IndexOptions />);
    const [, hidive, series] = screen.getAllByRole("textbox");

    fireEvent.change(hidive, { target: { value: '{"series": []}' } });
    fireEvent.blur(hidive);
    expect(setters.hidive).toHaveBeenCalledWith({ series: [] });

    fireEvent.blur(series);
    expect(setters["series.A"]).toHaveBeenCalledWith(values["series.A"]);
  });

  test("does not save invalid JSON", () => {
    render(<IndexOptions />);
    const textarea = screen.getAllByRole("textbox")[0];

    fireEvent.change(textarea, { target: { value: "{" } });
    fireEvent.blur(textarea);
    expect(setters.userHistory).not.toHaveBeenCalled();
    expect(screen.getByText(/Invalid JSON/)).toBeTruthy();
  });

  test("deletes all configurations", () => {
    areas.sync.set("userHistory", values.userHistory);
    areas.local.set("series.A", values["series.A"]);
    render(<IndexOptions />);

    fireEvent.click(screen.getByText("Delete all configurations"));
    expect(areas.sync.size).toBe(0);
    expect(areas.local.size).toBe(0);
    expect(setters.hidive).toHaveBeenCalledWith({ series: [] });
    expect(setters.userHistory).toHaveBeenCalledWith({ series: [] });
  });
});
