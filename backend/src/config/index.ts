import path from "path";

export const config = {
  port: parseInt(process.env.PORT || "3000", 10),
  storageType: (process.env.STORAGE_TYPE || "local") as "local" | "s3",
  s3ImagesBucket: process.env.S3_IMAGES_BUCKET || "",
  awsRegion: process.env.AWS_REGION || "ap-northeast-1",
  localImageDir: path.resolve(process.cwd(), "data", "images"),
  baseUrl:
    process.env.BASE_URL || `http://localhost:${process.env.PORT || "3000"}`,
  corsOrigins: process.env.CORS_ORIGINS?.split(",") || [
    "http://localhost:5173",
  ],
};
