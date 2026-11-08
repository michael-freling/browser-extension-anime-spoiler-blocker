/**
 * @jest-environment jsdom
 */
import * as React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import IndexPopup from ".";

test("opens the settings page", () => {
  process.env.PLASMO_PUBLIC_EXTENSION_ID = "extension-id";
  const create = jest.fn();
  (global as any).chrome = { tabs: { create } };

  render(<IndexPopup />);
  fireEvent.click(screen.getByText("Settings"));
  expect(create).toHaveBeenCalledWith({
    url: "extension://extension-id/options.html",
  });
});
