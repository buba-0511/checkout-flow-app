import { Product } from './product.entity';

function makeProduct(stock: number): Product {
  return new Product(
    'p1',
    'Widget',
    'A widget.',
    1000,
    stock,
    'http://x/img.jpg',
  );
}

describe('Product', () => {
  describe('hasEnoughStock', () => {
    it('is true when stock is greater than the requested quantity', () => {
      expect(makeProduct(10).hasEnoughStock(5)).toBe(true);
    });

    it('is true when stock exactly equals the requested quantity', () => {
      expect(makeProduct(5).hasEnoughStock(5)).toBe(true);
    });

    it('is false when stock is less than the requested quantity', () => {
      expect(makeProduct(2).hasEnoughStock(5)).toBe(false);
    });
  });

  describe('decreaseStock', () => {
    it('subtracts the quantity from stock', () => {
      const product = makeProduct(10);
      product.decreaseStock(3);
      expect(product.stock).toBe(7);
    });

    it('can decrease stock down to exactly zero', () => {
      const product = makeProduct(5);
      product.decreaseStock(5);
      expect(product.stock).toBe(0);
    });

    it('throws for a zero or negative quantity', () => {
      const product = makeProduct(10);
      expect(() => product.decreaseStock(0)).toThrow(
        'quantity must be positive',
      );
      expect(() => product.decreaseStock(-1)).toThrow(
        'quantity must be positive',
      );
    });

    it('throws rather than let stock go negative', () => {
      const product = makeProduct(2);
      expect(() => product.decreaseStock(5)).toThrow(
        'Cannot decrease stock of "Widget" below zero',
      );
    });
  });
});
