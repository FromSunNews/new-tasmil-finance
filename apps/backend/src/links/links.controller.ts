import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';

import type { CreateLinkDto } from '@repo/api/src/links/dto/create-link.dto.js';
import type { UpdateLinkDto } from '@repo/api/src/links/dto/update-link.dto.js';

import { LinksService } from './links.service';

@ApiTags("links")
@Controller('links')
export class LinksController {
  constructor(private readonly linksService: LinksService) {}

  @Post()
  @ApiOperation({ summary: "Create a new link" })
  @ApiBody({ type: Object })
  @ApiResponse({ status: 201, description: "Link created" })
  create(@Body() createLinkDto: CreateLinkDto) {
    return this.linksService.create(createLinkDto);
  }

  @Get()
  @ApiOperation({ summary: "Get all links" })
  @ApiResponse({ status: 200, description: "List of links" })
  findAll() {
    return this.linksService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: "Get link by ID" })
  @ApiParam({ name: "id", type: String })
  @ApiResponse({ status: 200, description: "Link retrieved" })
  @ApiResponse({ status: 404, description: "Link not found" })
  findOne(@Param('id') id: string) {
    return this.linksService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: "Update a link" })
  @ApiParam({ name: "id", type: String })
  @ApiBody({ type: Object })
  @ApiResponse({ status: 200, description: "Link updated" })
  @ApiResponse({ status: 404, description: "Link not found" })
  update(@Param('id') id: string, @Body() updateLinkDto: UpdateLinkDto) {
    return this.linksService.update(+id, updateLinkDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: "Delete a link" })
  @ApiParam({ name: "id", type: String })
  @ApiResponse({ status: 200, description: "Link deleted" })
  @ApiResponse({ status: 404, description: "Link not found" })
  remove(@Param('id') id: string) {
    return this.linksService.remove(+id);
  }
}
