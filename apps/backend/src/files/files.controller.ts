import {
  Controller,
  Post,
  Req,
  UseGuards,
  HttpException,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from "@nestjs/swagger";
import { FileInterceptor } from "@nestjs/platform-express";
import { Express } from "express";
import { Request } from "express";
import { FilesService } from "./files.service";
import { JwtAuthGuard } from "../auth/guards/auth.guard";
import { ChatSDKError } from "@repo/api";
import type { JwtPayload } from "../auth/auth.service";

@ApiTags("files")
@ApiBearerAuth("JWT-auth")
@Controller("files")
@UseGuards(JwtAuthGuard)
export class FilesController {
  constructor(private filesService: FilesService) {}

  @Post("upload")
  @UseInterceptors(FileInterceptor("file"))
  @ApiOperation({ summary: "Upload a file" })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        file: {
          type: "string",
          format: "binary",
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: "File uploaded successfully" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 400, description: "Bad request - invalid file" })
  async uploadFile(@UploadedFile() file: Express.Multer.File | undefined, @Req() req: Request) {
    const user = req.user as JwtPayload;

    if (!user) {
      throw new HttpException(
        new ChatSDKError("unauthorized:api"),
        HttpStatus.UNAUTHORIZED
      );
    }

    if (!file) {
      throw new HttpException(
        new ChatSDKError("bad_request:api", "No file uploaded"),
        HttpStatus.BAD_REQUEST
      );
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      throw new HttpException(
        new ChatSDKError("bad_request:api", "File size should be less than 5MB"),
        HttpStatus.BAD_REQUEST
      );
    }

    // Validate file type
    if (!["image/jpeg", "image/png"].includes(file.mimetype)) {
      throw new HttpException(
        new ChatSDKError("bad_request:api", "File type should be JPEG or PNG"),
        HttpStatus.BAD_REQUEST
      );
    }

    try {
      const fileBuffer = file.buffer;
      const data = await this.filesService.uploadFile(file.originalname, fileBuffer);
      return data;
    } catch (error) {
      throw new HttpException(
        new ChatSDKError("bad_request:api", "Upload failed"),
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}

