import { PartialType } from '@nestjs/mapped-types';

import { CreateLinkDto } from './create-link.dto.js';

export class UpdateLinkDto extends PartialType(CreateLinkDto) {}
