import { ApiProperty } from '@nestjs/swagger';
import { TransactionItem } from '../../../domain/transaction.entity';

export class TransactionItemResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  productId: string;

  @ApiProperty({ example: 2 })
  quantity: number;

  @ApiProperty({ example: 1000 })
  unitPriceInCents: number;

  @ApiProperty({ example: 2000 })
  subtotalInCents: number;

  static fromDomain(item: TransactionItem): TransactionItemResponseDto {
    const dto = new TransactionItemResponseDto();
    dto.id = item.id;
    dto.productId = item.productId;
    dto.quantity = item.quantity;
    dto.unitPriceInCents = item.unitPriceInCents;
    dto.subtotalInCents = item.subtotalInCents;
    return dto;
  }
}
