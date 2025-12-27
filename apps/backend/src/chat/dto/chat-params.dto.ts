import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class ChatParamsDto {
  @ApiProperty({
    description: 'Chat ID',
    example: 'chat-123',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  id: string;
}

export class MessageParamsDto {
  @ApiProperty({
    description: 'Message ID',
    example: 'msg-123',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  id: string;
}

export class UpdateChatVisibilityDto {
  @ApiProperty({
    description: 'Chat visibility',
    enum: ['private', 'public'],
    example: 'public',
  })
  @IsString()
  @IsNotEmpty()
  visibility: 'private' | 'public';
}