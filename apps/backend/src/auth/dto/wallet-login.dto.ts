import { IsEthereumAddress, IsOptional, IsString, Length } from 'class-validator';

export class WalletLoginDto {
  @IsString()
  @IsEthereumAddress()
  walletAddress!: string;

  @IsString()
  signature!: string;

  @IsOptional()
  @IsString()
  @Length(3, 50)
  referralCode?: string;
}

