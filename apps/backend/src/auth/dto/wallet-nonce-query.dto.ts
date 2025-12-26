import { IsEthereumAddress } from 'class-validator';

export class WalletNonceQueryDto {
  @IsEthereumAddress()
  walletAddress!: string;
}

