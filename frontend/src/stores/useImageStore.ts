import { create } from "zustand";
import type { ImageWithUrl } from "../types";
import { fetchImages } from "../services/imageService";

interface ImageState {
  images: ImageWithUrl[];
  loading: boolean;
  error: string | null;
  fetchImages: () => Promise<void>;
}

export const useImageStore = create<ImageState>((set) => ({
  images: [],
  loading: false,
  error: null,

  fetchImages: async () => {
    set({ loading: true, error: null });
    try {
      const images = await fetchImages();
      set({ images, loading: false });
    } catch {
      set({ error: "Failed to fetch images", loading: false });
    }
  },
}));
