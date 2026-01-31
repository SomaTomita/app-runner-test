import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "./App";

describe("App", () => {
  it("renders the app title", () => {
    render(<App />);

    expect(screen.getByText("Deploy Comparison App")).toBeInTheDocument();
  });

  it("renders Users section", () => {
    render(<App />);

    expect(screen.getByText("Users")).toBeInTheDocument();
  });

  it("renders Images section", () => {
    render(<App />);

    expect(screen.getByText("Images")).toBeInTheDocument();
  });
});
