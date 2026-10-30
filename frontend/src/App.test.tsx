import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "./App";

vi.mock("./services/userService", () => ({
  fetchUsers: vi.fn().mockResolvedValue([]),
}));

describe("App", () => {
  it("renders the app title", () => {
    render(<App />);

    expect(screen.getByText("Deploy Comparison App")).toBeInTheDocument();
  });

  it("renders Users section", () => {
    render(<App />);

    expect(screen.getByText("Users")).toBeInTheDocument();
  });

  it("renders Images section", async () => {
    render(<App />);

    expect(await screen.findByText("Images")).toBeInTheDocument();
  });
});
