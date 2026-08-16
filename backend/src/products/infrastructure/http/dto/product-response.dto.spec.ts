import { Product } from '../../../domain/product.entity';
import { ProductResponseDto } from './product-response.dto';

describe('ProductResponseDto.fromDomain', () => {
  it('maps every field from the domain product', () => {
    const product = new Product(
      'p1',
      'Widget',
      'A widget.',
      1999,
      12,
      ['http://x/widget.jpg'],
      [],
    );

    const dto = ProductResponseDto.fromDomain(product);

    expect(dto).toEqual({
      id: 'p1',
      name: 'Widget',
      description: 'A widget.',
      priceInCents: 1999,
      stock: 12,
      imageUrls: ['http://x/widget.jpg'],
      tags: [],
    });
  });
});
