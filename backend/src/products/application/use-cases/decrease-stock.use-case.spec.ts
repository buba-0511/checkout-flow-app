import { Product } from '../../domain/product.entity';
import type { ProductRepository } from '../../domain/product.repository';
import { ErrorCode } from '../../../common/errors/error-code';
import type { TransactionContext } from '../../../common/transaction-manager';
import { DecreaseStockUseCase } from './decrease-stock.use-case';

function createMockRepository(): jest.Mocked<ProductRepository> {
  return {
    findPage: jest.fn(),
    findById: jest.fn(),
    findByIds: jest.fn(),
    save: jest.fn(),
    saveMany: jest.fn(),
  };
}

describe('DecreaseStockUseCase', () => {
  it('decreases stock for a single item with enough stock', async () => {
    const repository = createMockRepository();
    const product = new Product(
      'p1',
      'Widget',
      'A widget.',
      1000,
      10,
      'http://x/1.jpg',
    );
    repository.findByIds.mockResolvedValue([product]);

    const useCase = new DecreaseStockUseCase(repository);
    const result = await useCase.execute([{ productId: 'p1', quantity: 3 }]);

    expect(result.isOk()).toBe(true);
    expect(product.stock).toBe(7);
    expect(repository.saveMany).toHaveBeenCalledWith([product], undefined);
  });

  it('decreases stock for every item in a multi-item cart', async () => {
    const repository = createMockRepository();
    const p1 = new Product(
      'p1',
      'Widget',
      'A widget.',
      1000,
      10,
      'http://x/1.jpg',
    );
    const p2 = new Product(
      'p2',
      'Gadget',
      'A gadget.',
      2000,
      5,
      'http://x/2.jpg',
    );
    repository.findByIds.mockResolvedValue([p1, p2]);

    const useCase = new DecreaseStockUseCase(repository);
    const result = await useCase.execute([
      { productId: 'p1', quantity: 4 },
      { productId: 'p2', quantity: 5 },
    ]);

    expect(result.isOk()).toBe(true);
    expect(p1.stock).toBe(6);
    expect(p2.stock).toBe(0);
    expect(repository.saveMany).toHaveBeenCalledWith([p1, p2], undefined);
  });

  it('fails with PRODUCT_NOT_FOUND and never persists when one item does not exist', async () => {
    const repository = createMockRepository();
    const p1 = new Product(
      'p1',
      'Widget',
      'A widget.',
      1000,
      10,
      'http://x/1.jpg',
    );
    // p2 requested but not returned by the repository — doesn't exist.
    repository.findByIds.mockResolvedValue([p1]);

    const useCase = new DecreaseStockUseCase(repository);
    const result = await useCase.execute([
      { productId: 'p1', quantity: 2 },
      { productId: 'p2', quantity: 1 },
    ]);

    expect(result.isErr()).toBe(true);
    expect(result.error.code).toBe(ErrorCode.PRODUCT_NOT_FOUND);
    expect(result.error.details).toEqual({ productId: 'p2' });
    expect(p1.stock).toBe(10); // untouched
    expect(repository.saveMany).not.toHaveBeenCalled();
  });

  it('fails with STOCK_INSUFFICIENT and never persists when one item lacks stock', async () => {
    const repository = createMockRepository();
    const p1 = new Product(
      'p1',
      'Widget',
      'A widget.',
      1000,
      10,
      'http://x/1.jpg',
    );
    const p2 = new Product(
      'p2',
      'Gadget',
      'A gadget.',
      2000,
      2,
      'http://x/2.jpg',
    );
    repository.findByIds.mockResolvedValue([p1, p2]);

    const useCase = new DecreaseStockUseCase(repository);
    const result = await useCase.execute([
      { productId: 'p1', quantity: 4 },
      { productId: 'p2', quantity: 5 }, // only 2 available
    ]);

    expect(result.isErr()).toBe(true);
    expect(result.error.code).toBe(ErrorCode.STOCK_INSUFFICIENT);
    expect(result.error.details).toEqual({
      productId: 'p2',
      requested: 5,
      available: 2,
    });
    // Neither product was mutated — p1 would have succeeded alone, but the
    // whole batch fails together.
    expect(p1.stock).toBe(10);
    expect(p2.stock).toBe(2);
    expect(repository.saveMany).not.toHaveBeenCalled();
  });

  it('allows decreasing stock down to exactly zero', async () => {
    const repository = createMockRepository();
    const product = new Product(
      'p1',
      'Widget',
      'A widget.',
      1000,
      5,
      'http://x/1.jpg',
    );
    repository.findByIds.mockResolvedValue([product]);

    const useCase = new DecreaseStockUseCase(repository);
    const result = await useCase.execute([{ productId: 'p1', quantity: 5 }]);

    expect(result.isOk()).toBe(true);
    expect(product.stock).toBe(0);
  });

  it('forwards the transaction context to saveMany when provided', async () => {
    const repository = createMockRepository();
    const product = new Product(
      'p1',
      'Widget',
      'A widget.',
      1000,
      10,
      'http://x/1.jpg',
    );
    repository.findByIds.mockResolvedValue([product]);
    const ctx = {} as TransactionContext;

    const useCase = new DecreaseStockUseCase(repository);
    await useCase.execute([{ productId: 'p1', quantity: 3 }], ctx);

    expect(repository.saveMany).toHaveBeenCalledWith([product], ctx);
  });
});
