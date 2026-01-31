import fs from "fs/promises";
import path from "path";
import { StorageService, ImageMeta } from "./StorageService";
import { AppError } from "../../lib/errors";

const IMAGE_EXTENSIONS = /\.(png|jpe?g|gif|webp)$/i;

export class LocalStorageService extends StorageService {
  constructor(
    private readonly imageDir: string,
    private readonly baseUrl: string,
  ) {
    super();
  }

  async listImages(): Promise<ImageMeta[]> {
    try {
      const files = await fs.readdir(this.imageDir);
      const images: ImageMeta[] = [];

      for (const file of files) {
        if (!IMAGE_EXTENSIONS.test(file)) continue;
        const stat = await fs.stat(path.join(this.imageDir, file));
        images.push({
          key: file,
          name: file,
          size: stat.size,
          lastModified: stat.mtime,
        });
      }

      return images;
    } catch {
      return [];
    }
  }

  async getImageUrl(key: string): Promise<string> {
    const filePath = path.join(this.imageDir, key);
    try {
      await fs.access(filePath);
    } catch {
      throw new AppError(404, `Image not found: ${key}`);
    }
    return `${this.baseUrl}/static/images/${encodeURIComponent(key)}`;
  }
}
