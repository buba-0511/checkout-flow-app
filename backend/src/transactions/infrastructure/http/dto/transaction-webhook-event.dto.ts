import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsInt,
  IsString,
  ValidateNested,
} from 'class-validator';
import { TransactionStatus } from '../../../domain/transaction.entity';

// The payment gateway's real event envelope shape.
export class WebhookTransactionDto {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty()
  @IsString()
  reference: string;

  @ApiProperty({ enum: TransactionStatus })
  @IsIn(Object.values(TransactionStatus))
  status: TransactionStatus;
}

export class WebhookDataDto {
  @ApiProperty({ type: WebhookTransactionDto })
  @ValidateNested()
  @Type(() => WebhookTransactionDto)
  transaction: WebhookTransactionDto;
}

export class WebhookSignatureDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  properties: string[];

  @ApiProperty()
  @IsString()
  checksum: string;
}

export class TransactionWebhookEventDto {
  @ApiProperty({ example: 'transaction.updated' })
  @IsString()
  event: string;

  @ApiProperty({ type: WebhookDataDto })
  @ValidateNested()
  @Type(() => WebhookDataDto)
  data: WebhookDataDto;

  @ApiProperty()
  @IsInt()
  timestamp: number;

  @ApiProperty({ type: WebhookSignatureDto })
  @ValidateNested()
  @Type(() => WebhookSignatureDto)
  signature: WebhookSignatureDto;
}
