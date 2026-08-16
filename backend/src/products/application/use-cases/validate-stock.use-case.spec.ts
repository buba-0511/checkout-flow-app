import { Product } from '../../domain/product.entity';
import type { ProductRepository } from '../../domain/product.repository';
import { ErrorCode } from '../../../common/errors/error-code';
import { ValidateStockUseCase } from './validate-stock.use-case';

function createMockRepository(): jest.Mocked<ProductRepository> {
  return {
    findPage: jest.fn(),
    findById: jest.fn(),
    findByIds: jest.fn(),
    save: jest.fn(),
    saveMany: jest.fn(),
  };
}

describe('ValidateStockUseCase', () => {
  it('returns the products without mutating stock when there is enough', async () => {
    const repository = createMockRepository();
    const product = new Product(
      'p1',
      'Widget',
      'A widget.',
      1000,
      10,
      ['http://x/1.jpg'],
      [],
    );
    repository.findByIds.mockResolvedValue([product]);

    const useCase = new ValidateStockUseCase(repository);
    const result = await useCase.execute([{ productId: 'p1', quantity: 3 }]);

    expect(result.isOk()).toBe(true);
    expect(result.value).toEqual([product]);
    // Read-only — nothing is ever written.
    expect(product.stock).toBe(10);
    expect(repository.save).not.toHaveBeenCalled();
    expect(repository.saveMany).not.toHaveBeenCalled();
  });

  it('fails with PRODUCT_NOT_FOUND when an item does not exist', async () => {
    const repository = createMockRepository();
    repository.findByIds.mockResolvedValue([]);

    const useCase = new ValidateStockUseCase(repository);
    const result = await useCase.execute([
      { productId: 'missing', quantity: 1 },
    ]);

    expect(result.isErr()).toBe(true);
    expect(result.error.code).toBe(ErrorCode.PRODUCT_NOT_FOUND);
  });

  it('fails with STOCK_INSUFFICIENT when the requested quantity exceeds stock', async () => {
    const repository = createMockRepository();
    const product = new Product(
      'p1',
      'Widget',
      'A widget.',
      1000,
      2,
      ['http://x/1.jpg'],
      [],
    );
    repository.findByIds.mockResolvedValue([product]);

    const useCase = new ValidateStockUseCase(repository);
    const result = await useCase.execute([{ productId: 'p1', quantity: 5 }]);

    expect(result.isErr()).toBe(true);
    expect(result.error.code).toBe(ErrorCode.STOCK_INSUFFICIENT);
    expect(product.stock).toBe(2); // untouched
  });
});
