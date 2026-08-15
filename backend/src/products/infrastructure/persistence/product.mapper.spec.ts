import { Product } from '../../domain/product.entity';
import { ProductMapper } from './product.mapper';
import { ProductOrmEntity } from './product.orm-entity';

describe('ProductMapper', () => {
  describe('toDomain', () => {
    it('maps every field from the ORM entity to the domain entity', () => {
      const orm = new ProductOrmEntity();
      orm.id = 'p1';
      orm.name = 'Widget';
      orm.description = 'A widget.';
      orm.priceInCents = 1999;
      orm.stock = 12;
      orm.imageUrl = 'http://x/widget.jpg';

      const domain = ProductMapper.toDomain(orm);

      expect(domain).toBeInstanceOf(Product);
      expect(domain.id).toBe('p1');
      expect(domain.name).toBe('Widget');
      expect(domain.description).toBe('A widget.');
      expect(domain.priceInCents).toBe(1999);
      expect(domain.stock).toBe(12);
      expect(domain.imageUrl).toBe('http://x/widget.jpg');
    });
  });

  describe('toOrm', () => {
    it('maps every field from the domain entity to the ORM entity', () => {
      const domain = new Product(
        'p1',
        'Widget',
        'A widget.',
        1999,
        12,
        'http://x/widget.jpg',
      );

      const orm = ProductMapper.toOrm(domain);

      expect(orm).toBeInstanceOf(ProductOrmEntity);
      expect(orm.id).toBe('p1');
      expect(orm.name).toBe('Widget');
      expect(orm.description).toBe('A widget.');
      expect(orm.priceInCents).toBe(1999);
      expect(orm.stock).toBe(12);
      expect(orm.imageUrl).toBe('http://x/widget.jpg');
    });
  });
});
