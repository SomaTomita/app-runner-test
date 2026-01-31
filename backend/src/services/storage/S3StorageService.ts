import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { StorageService, ImageMeta } from "./StorageService";
import { AppError } from "../../lib/errors";

export class S3StorageService extends StorageService {
  private readonly client: S3Client;

  constructor(
    private readonly bucket: string,
    region: string,
  ) {
    super();
    this.client = new S3Client({ region });
  }

  async listImages(): Promise<ImageMeta[]> {
    const command = new ListObjectsV2Command({ Bucket: this.bucket });
    const response = await this.client.send(command);

    return (response.Contents ?? []).map((obj) => ({
      key: obj.Key!,
      name: obj.Key!.split("/").pop()!,
      size: obj.Size,
      lastModified: obj.LastModified,
    }));
  }

  async getImageUrl(key: string): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });
      return await getSignedUrl(this.client, command, { expiresIn: 3600 });
    } catch {
      throw new AppError(404, `Image not found: ${key}`);
    }
  }
}
