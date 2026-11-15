/**
 * @jest-environment jsdom
 */
import * as React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import IndexPopup from ".";

test("opens the settings page of this extension", () => {
  const openOptionsPage = jest.fn();
  (global as any).chrome = { runtime: { openOptionsPage } };

  render(<IndexPopup />);
  fireEvent.click(screen.getByText("Settings"));
  expect(openOptionsPage).toHaveBeenCalledTimes(1);
});
