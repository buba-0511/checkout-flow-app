import { ApiProperty } from '@nestjs/swagger';
import { ProductResponseDto } from './product-response.dto';

export class ProductPageResponseDto {
  @ApiProperty({ type: [ProductResponseDto] })
  items: ProductResponseDto[];

  @ApiProperty({
    nullable: true,
    format: 'uuid',
    description:
      'Pass as ?cursor= to fetch the next page. Null when there are no more products.',
  })
  nextCursor: string | null;
}
