import { ApiProperty } from '@nestjs/swagger';
import { Product } from '../../../domain/product.entity';

export class ProductResponseDto {
  @ApiProperty({
    example: 'b3f1c2a4-5e6d-4f7a-8b9c-0d1e2f3a4b5c',
    format: 'uuid',
  })
  id: string;

  @ApiProperty({ example: 'Wireless Headphones' })
  name: string;

  @ApiProperty({ example: 'Noise-cancelling over-ear headphones.' })
  description: string;

  @ApiProperty({ example: 12999, description: 'Price in cents (COP).' })
  priceInCents: number;

  @ApiProperty({ example: 42, description: 'Units currently available.' })
  stock: number;

  @ApiProperty({
    example: ['https://cdn.example.com/products/headphones-1.jpg'],
    description:
      'Ordered gallery — first entry is the primary/catalog-card image.',
  })
  imageUrls: string[];

  @ApiProperty({
    example: ['Colombia', 'Medium roast'],
    description: 'Freeform display labels — category-agnostic.',
  })
  tags: string[];

  static fromDomain(product: Product): ProductResponseDto {
    const dto = new ProductResponseDto();
    dto.id = product.id;
    dto.name = product.name;
    dto.description = product.description;
    dto.priceInCents = product.priceInCents;
    dto.stock = product.stock;
    dto.imageUrls = product.imageUrls;
    dto.tags = product.tags;
    return dto;
  }
}
