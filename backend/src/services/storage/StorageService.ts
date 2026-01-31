export interface ImageMeta {
  key: string;
  name: string;
  size?: number;
  lastModified?: Date;
}

export abstract class StorageService {
  abstract listImages(): Promise<ImageMeta[]>;
  abstract getImageUrl(key: string): Promise<string>;
}
