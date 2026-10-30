import { beforeEach, describe, expect, it, vi } from "vitest";

const { send, sign } = vi.hoisted(() => ({ send: vi.fn(), sign: vi.fn() }));
vi.mock("@aws-sdk/client-s3", async (importOriginal) => {
  const original = await importOriginal<typeof import("@aws-sdk/client-s3")>();
  return {
    ...original,
    S3Client: class {
      send = send;
    },
  };
});
vi.mock("@aws-sdk/s3-request-presigner", () => ({ getSignedUrl: sign }));

import { S3StorageService } from "./S3StorageService";

describe("S3 image access", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    sign.mockResolvedValue("https://example.com/temporary-image-url");
  });

  it("paginates S3 results and omits non-image objects", async () => {
    send
      .mockResolvedValueOnce({
        Contents: [{ Key: "photo.png" }, { Key: "notes.txt" }],
        IsTruncated: true,
        NextContinuationToken: "page2",
      })
      .mockResolvedValueOnce({
        Contents: [{ Key: "more.JPG" }, { Key: "folder/" }],
        IsTruncated: false,
      });
    const service = new S3StorageService("test-bucket", "ap-northeast-1");
    const images = await service.listImagesWithUrls();
    expect(images.map((image) => image.key)).toEqual(["photo.png", "more.JPG"]);
    expect(send.mock.calls[1][0].input.ContinuationToken).toBe("page2");
    expect(sign).toHaveBeenCalledTimes(2);
  });

  it("does not sign an object that does not exist", async () => {
    send.mockRejectedValue(
      Object.assign(new Error("Missing"), { name: "NotFound" }),
    );
    await expect(
      new S3StorageService("test-bucket", "ap-northeast-1").getImageUrl(
        "missing.png",
      ),
    ).rejects.toMatchObject({ statusCode: 404 });
    expect(sign).not.toHaveBeenCalled();
  });

  it("does not misreport an S3 permission failure as a missing image", async () => {
    const error = Object.assign(new Error("Denied"), { name: "AccessDenied" });
    send.mockRejectedValue(error);
    await expect(
      new S3StorageService("test-bucket", "ap-northeast-1").getImageUrl(
        "photo.png",
      ),
    ).rejects.toBe(error);
  });

  it("rejects non-image keys before contacting S3", async () => {
    await expect(
      new S3StorageService("test-bucket", "ap-northeast-1").getImageUrl(
        "notes.txt",
      ),
    ).rejects.toMatchObject({ statusCode: 400 });
    expect(send).not.toHaveBeenCalled();
  });
});
