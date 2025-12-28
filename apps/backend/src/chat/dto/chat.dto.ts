import { PostChatRequestBody } from "../../common/dto/chat.dto";
import { IsOptional, IsString, IsEthereumAddress, IsNotEmpty } from "class-validator";

export class CreateChatDto implements PostChatRequestBody {
  @IsNotEmpty()
  @IsString()
  id!: string;
  
  @IsOptional()
  message?: {
    id: string;
    role: "user";
    parts: Array<{
      type: "text" | "file";
      text?: string;
      mediaType?: "image/jpeg" | "image/png";
      name?: string;
      url?: string;
    }>;
  };
  
  @IsOptional()
  messages?: Array<{
    id: string;
    role: string;
    parts: any[];
  }>;
  
  @IsNotEmpty()
  @IsString()
  selectedChatModel!: string;
  
  @IsOptional()
  @IsString()
  selectedVisibilityType?: "public" | "private";
  
  @IsOptional()
  @IsString()
  @IsEthereumAddress()
  walletAddress?: string;

  @IsOptional()
  @IsString()
  agentId?: string;
}

