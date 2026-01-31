import apiClient from "../api/client";
import type { ImageMeta } from "../types";

export async function fetchImages(): Promise<ImageMeta[]> {
  const { data } = await apiClient.get<ImageMeta[]>("/api/images");
  return data;
}

export async function getImageUrl(key: string): Promise<string> {
  const { data } = await apiClient.get<{ url: string }>(
    `/api/images/${encodeURIComponent(key)}`,
  );
  return data.url;
}
