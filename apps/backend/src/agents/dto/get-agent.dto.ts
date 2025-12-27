import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class GetAgentParamsDto {
  @ApiProperty({
    description: 'Agent ID',
    example: 'bridge-agent',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  id: string;
}