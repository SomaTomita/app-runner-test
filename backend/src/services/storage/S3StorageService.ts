import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
  _Object,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { StorageService, ImageMeta, ImageWithUrl } from "./StorageService";
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

  private async listAllObjects(): Promise<_Object[]> {
    const allContents: _Object[] = [];
    let continuationToken: string | undefined;

    do {
      const response = await this.client.send(
        new ListObjectsV2Command({
          Bucket: this.bucket,
          ContinuationToken: continuationToken,
        }),
      );
      allContents.push(...(response.Contents ?? []));
      continuationToken = response.IsTruncated
        ? response.NextContinuationToken
        : undefined;
    } while (continuationToken);

    return allContents;
  }

  private toMeta(obj: _Object): ImageMeta {
    return {
      key: obj.Key!,
      name: obj.Key!.split("/").pop()!,
      size: obj.Size,
      lastModified: obj.LastModified,
    };
  }

  async listImages(): Promise<ImageMeta[]> {
    const objects = await this.listAllObjects();
    return objects.map((obj) => this.toMeta(obj));
  }

  async listImagesWithUrls(): Promise<ImageWithUrl[]> {
    const objects = await this.listAllObjects();

    return Promise.all(
      objects.map(async (obj) => {
        const meta = this.toMeta(obj);
        const command = new GetObjectCommand({
          Bucket: this.bucket,
          Key: obj.Key!,
        });
        const url = await getSignedUrl(this.client, command, {
          expiresIn: 3600,
        });
        return { ...meta, url };
      }),
    );
  }

  async getImageUrl(key: string): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });
      return await getSignedUrl(this.client, command, { expiresIn: 3600 });
    } catch {
      throw new AppError(404, "Image not found");
    }
  }
}
