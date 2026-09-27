import fs from "fs";
import path from "path";
import prisma from "@/lib/db";

export interface IFileStorageService {
  upload(file: Buffer, originalName: string, mimeType: string, uploadedBy?: string): Promise<{ url: string; key: string; size: number }>;
  delete(key: string): Promise<boolean>;
  getUrl(key: string): Promise<string>;
}

export class LocalFileStorageService implements IFileStorageService {
  private uploadDir: string;

  constructor() {
    this.uploadDir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async upload(fileBuffer: Buffer, originalName: string, mimeType: string, uploadedBy?: string) {
    const ext = path.extname(originalName) || ".bin";
    const cleanName = path.basename(originalName, ext).replace(/[^a-zA-Z0-9_-]/g, "_");
    const uniqueKey = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}_${cleanName}${ext}`;
    const filePath = path.join(this.uploadDir, uniqueKey);

    await fs.promises.writeFile(filePath, fileBuffer);
    const publicUrl = `/uploads/${uniqueKey}`;

    // Record in FileAsset metadata
    await prisma.fileAsset.create({
      data: {
        storageKey: uniqueKey,
        fileName: originalName,
        fileSize: fileBuffer.length,
        mimeType: mimeType,
        storagePath: filePath,
        uploadedBy: uploadedBy || null,
      },
    });

    return {
      url: publicUrl,
      key: uniqueKey,
      size: fileBuffer.length,
    };
  }

  async delete(key: string): Promise<boolean> {
    try {
      const asset = await prisma.fileAsset.findUnique({ where: { storageKey: key } });
      if (asset && fs.existsSync(asset.storagePath)) {
        await fs.promises.unlink(asset.storagePath);
      }
      await prisma.fileAsset.deleteMany({ where: { storageKey: key } });
      return true;
    } catch (e) {
      return false;
    }
  }

  async getUrl(key: string): Promise<string> {
    return `/uploads/${key}`;
  }
}

export const fileStorageService = new LocalFileStorageService();
