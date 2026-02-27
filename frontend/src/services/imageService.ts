import apiClient from "../api/client";
import type { ImageWithUrl } from "../types";

export async function fetchImages(): Promise<ImageWithUrl[]> {
  const { data } = await apiClient.get<ImageWithUrl[]>("/api/images");
  return data;
}
