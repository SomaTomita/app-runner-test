import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ImageGallery } from "./ImageGallery";
import { useImageStore } from "../stores/useImageStore";

vi.mock("../stores/useImageStore");

const mockStore = {
  images: [],
  loading: false,
  error: null,
  fetchImages: vi.fn(),
};

describe("ImageGallery", () => {
  beforeEach(() => {
    vi.mocked(useImageStore).mockImplementation((selector: any) =>
      selector(mockStore),
    );
  });

  it("renders empty state", () => {
    render(<ImageGallery />);

    expect(
      screen.getByText(/No images loaded/),
    ).toBeInTheDocument();
  });

  it("calls fetchImages on button click", async () => {
    const user = userEvent.setup();
    render(<ImageGallery />);

    await user.click(screen.getByText("Load Images"));

    expect(mockStore.fetchImages).toHaveBeenCalled();
  });

  it("shows loading state", () => {
    vi.mocked(useImageStore).mockImplementation((selector: any) =>
      selector({ ...mockStore, loading: true }),
    );

    render(<ImageGallery />);

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("shows error state", () => {
    vi.mocked(useImageStore).mockImplementation((selector: any) =>
      selector({ ...mockStore, error: "Failed to fetch images" }),
    );

    render(<ImageGallery />);

    expect(screen.getByText("Failed to fetch images")).toBeInTheDocument();
  });

  it("renders images when loaded", () => {
    vi.mocked(useImageStore).mockImplementation((selector: any) =>
      selector({
        ...mockStore,
        images: [
          {
            key: "photo.jpg",
            name: "photo.jpg",
            size: 2048,
            url: "http://localhost:3000/static/images/photo.jpg",
          },
        ],
      }),
    );

    render(<ImageGallery />);

    expect(screen.getByAltText("photo.jpg")).toBeInTheDocument();
    expect(screen.getByText("photo.jpg")).toBeInTheDocument();
    expect(screen.getByText("2.0 KB")).toBeInTheDocument();
  });
});
