import { Product } from '../../domain/product.entity';
import type { ProductRepository } from '../../domain/product.repository';
import { ListProductsUseCase } from './list-products.use-case';

function createMockRepository(): jest.Mocked<ProductRepository> {
  return {
    findPage: jest.fn(),
    findById: jest.fn(),
    findByIds: jest.fn(),
    save: jest.fn(),
    saveMany: jest.fn(),
  };
}

function product(id: string): Product {
  return new Product(id, 'Widget', 'A widget.', 1000, 10, 'http://x/1.jpg');
}

describe('ListProductsUseCase', () => {
  it('passes the cursor and limit through to the repository', async () => {
    const repository = createMockRepository();
    repository.findPage.mockResolvedValue([]);

    const useCase = new ListProductsUseCase(repository);
    await useCase.execute({ cursor: 'p5', limit: 20 });

    expect(repository.findPage).toHaveBeenCalledWith({
      cursor: 'p5',
      limit: 20,
    });
  });

  it('returns a null nextCursor when fewer than limit + 1 rows come back', async () => {
    const repository = createMockRepository();
    repository.findPage.mockResolvedValue([product('p1'), product('p2')]);

    const useCase = new ListProductsUseCase(repository);
    const result = await useCase.execute({ limit: 20 });

    expect(result.isOk()).toBe(true);
    expect(result.value.items).toHaveLength(2);
    expect(result.value.nextCursor).toBeNull();
  });

  it('trims the extra row and returns its id as nextCursor when there is a next page', async () => {
    const repository = createMockRepository();
    // limit is 2, repository returns 3 (the "limit + 1" probe row).
    repository.findPage.mockResolvedValue([
      product('p1'),
      product('p2'),
      product('p3'),
    ]);

    const useCase = new ListProductsUseCase(repository);
    const result = await useCase.execute({ limit: 2 });

    expect(result.isOk()).toBe(true);
    expect(result.value.items.map((p) => p.id)).toEqual(['p1', 'p2']);
    expect(result.value.nextCursor).toBe('p2');
  });

  it('returns an empty page with a null cursor when there are no products', async () => {
    const repository = createMockRepository();
    repository.findPage.mockResolvedValue([]);

    const useCase = new ListProductsUseCase(repository);
    const result = await useCase.execute({ limit: 20 });

    expect(result.isOk()).toBe(true);
    expect(result.value).toEqual({ items: [], nextCursor: null });
  });
});
