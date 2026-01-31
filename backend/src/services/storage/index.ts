import { config } from "../../config";
import { StorageService } from "./StorageService";
import { LocalStorageService } from "./LocalStorageService";
import { S3StorageService } from "./S3StorageService";

export function createStorageService(): StorageService {
  if (config.storageType === "local") {
    return new LocalStorageService(config.localImageDir, config.baseUrl);
  }
  return new S3StorageService(config.s3ImagesBucket, config.awsRegion);
}

export { StorageService, LocalStorageService, S3StorageService };
export type { ImageMeta } from "./StorageService";
