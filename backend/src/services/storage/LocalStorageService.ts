import fs from "fs/promises";
import path from "path";
import { StorageService, ImageMeta, ImageWithUrl } from "./StorageService";
import { AppError } from "../../lib/errors";

const IMAGE_EXTENSIONS = /\.(png|jpe?g|gif|webp)$/i;

export class LocalStorageService extends StorageService {
  constructor(
    private readonly imageDir: string,
    private readonly baseUrl: string,
  ) {
    super();
  }

  private validateKey(key: string): string {
    const resolved = path.resolve(this.imageDir, key);
    const base = path.resolve(this.imageDir);
    if (!resolved.startsWith(base + path.sep) && resolved !== base) {
      throw new AppError(400, "Invalid image key");
    }
    return resolved;
  }

  async listImages(): Promise<ImageMeta[]> {
    try {
      const files = await fs.readdir(this.imageDir);
      const imageFiles = files.filter((f) => IMAGE_EXTENSIONS.test(f));

      const images = await Promise.all(
        imageFiles.map(async (file) => {
          const stat = await fs.stat(path.join(this.imageDir, file));
          return {
            key: file,
            name: file,
            size: stat.size,
            lastModified: stat.mtime,
          };
        }),
      );

      return images;
    } catch {
      return [];
    }
  }

  async listImagesWithUrls(): Promise<ImageWithUrl[]> {
    const metas = await this.listImages();
    return metas.map((meta) => ({
      ...meta,
      url: `${this.baseUrl}/static/images/${encodeURIComponent(meta.key)}`,
    }));
  }

  async getImageUrl(key: string): Promise<string> {
    const filePath = this.validateKey(key);
    try {
      await fs.access(filePath);
    } catch {
      throw new AppError(404, "Image not found");
    }
    return `${this.baseUrl}/static/images/${encodeURIComponent(key)}`;
  }
}
