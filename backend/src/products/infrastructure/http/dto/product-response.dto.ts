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

  @ApiProperty({ example: 'https://cdn.example.com/products/headphones.jpg' })
  imageUrl: string;

  static fromDomain(product: Product): ProductResponseDto {
    const dto = new ProductResponseDto();
    dto.id = product.id;
    dto.name = product.name;
    dto.description = product.description;
    dto.priceInCents = product.priceInCents;
    dto.stock = product.stock;
    dto.imageUrl = product.imageUrl;
    return dto;
  }
}
