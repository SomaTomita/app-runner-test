export interface ImageMeta {
  key: string;
  name: string;
  size?: number;
  lastModified?: Date;
}

export interface ImageWithUrl extends ImageMeta {
  url: string;
}

export abstract class StorageService {
  abstract listImages(): Promise<ImageMeta[]>;
  abstract listImagesWithUrls(): Promise<ImageWithUrl[]>;
  abstract getImageUrl(key: string): Promise<string>;
}
