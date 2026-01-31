import { create } from "zustand";
import type { ImageMeta } from "../types";
import * as imageService from "../services/imageService";

interface ImageItem {
  meta: ImageMeta;
  url: string | null;
}

interface ImageState {
  images: ImageItem[];
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
      const metas = await imageService.fetchImages();
      const images = await Promise.all(
        metas.map(async (meta) => {
          const url = await imageService.getImageUrl(meta.key);
          return { meta, url };
        }),
      );
      set({ images, loading: false });
    } catch (err) {
      set({ error: "Failed to fetch images", loading: false });
    }
  },
}));
