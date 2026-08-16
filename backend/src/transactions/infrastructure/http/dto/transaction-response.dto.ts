import { ApiProperty } from '@nestjs/swagger';
import {
  Transaction,
  TransactionSource,
  TransactionStatus,
} from '../../../domain/transaction.entity';
import { TransactionItemResponseDto } from './transaction-item-response.dto';

export class TransactionResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  reference: string;

  @ApiProperty({ format: 'uuid' })
  customerId: string;

  @ApiProperty({ format: 'uuid' })
  deliveryId: string;

  @ApiProperty({ enum: TransactionStatus })
  status: TransactionStatus;

  @ApiProperty({ enum: TransactionSource })
  source: TransactionSource;

  @ApiProperty({ type: [TransactionItemResponseDto] })
  items: TransactionItemResponseDto[];

  @ApiProperty({ example: 2000 })
  subtotalInCents: number;

  @ApiProperty({ example: 500 })
  baseFeeInCents: number;

  @ApiProperty({ example: 1000 })
  deliveryFeeInCents: number;

  @ApiProperty({ example: 3500 })
  totalAmountInCents: number;

  @ApiProperty({ nullable: true, example: null })
  paymentGatewayTransactionId: string | null;

  static fromDomain(transaction: Transaction): TransactionResponseDto {
    const dto = new TransactionResponseDto();
    dto.id = transaction.id;
    dto.reference = transaction.reference;
    dto.customerId = transaction.customerId;
    dto.deliveryId = transaction.deliveryId;
    dto.status = transaction.status;
    dto.source = transaction.source;
    dto.items = transaction.items.map((item) =>
      TransactionItemResponseDto.fromDomain(item),
    );
    dto.subtotalInCents = transaction.subtotalInCents;
    dto.baseFeeInCents = transaction.baseFeeInCents;
    dto.deliveryFeeInCents = transaction.deliveryFeeInCents;
    dto.totalAmountInCents = transaction.totalAmountInCents;
    dto.paymentGatewayTransactionId = transaction.paymentGatewayTransactionId;
    return dto;
  }
}
