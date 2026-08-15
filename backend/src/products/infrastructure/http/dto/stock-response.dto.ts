import { ApiProperty } from '@nestjs/swagger';
import { StockLevel } from '../../../application/use-cases/get-stock.use-case';

export class StockResponseDto {
  @ApiProperty({
    example: 'b3f1c2a4-5e6d-4f7a-8b9c-0d1e2f3a4b5c',
    format: 'uuid',
  })
  productId: string;

  @ApiProperty({ example: 42, description: 'Units currently available.' })
  stock: number;

  static fromDomain(level: StockLevel): StockResponseDto {
    const dto = new StockResponseDto();
    dto.productId = level.productId;
    dto.stock = level.stock;
    return dto;
  }
}
