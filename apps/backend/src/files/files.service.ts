import { Injectable } from "@nestjs/common";
import { put } from "@vercel/blob";

@Injectable()
export class FilesService {
  async uploadFile(filename: string, fileBuffer: ArrayBuffer) {
    const data = await put(filename, fileBuffer, {
      access: "public",
    });
    return data;
  }
}

