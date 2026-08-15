import { Product } from '../../domain/product.entity';
import type { ProductRepository } from '../../domain/product.repository';
import { ErrorCode } from '../../../common/errors/error-code';
import { GetStockUseCase } from './get-stock.use-case';

function createMockRepository(): jest.Mocked<ProductRepository> {
  return {
    findPage: jest.fn(),
    findById: jest.fn(),
    findByIds: jest.fn(),
    save: jest.fn(),
    saveMany: jest.fn(),
  };
}

describe('GetStockUseCase', () => {
  it('returns the productId and stock when the product exists', async () => {
    const repository = createMockRepository();
    const product = new Product(
      'p1',
      'Widget',
      'A widget.',
      1000,
      7,
      'http://x/1.jpg',
    );
    repository.findById.mockResolvedValue(product);

    const useCase = new GetStockUseCase(repository);
    const result = await useCase.execute('p1');

    expect(result.isOk()).toBe(true);
    expect(result.value).toEqual({ productId: 'p1', stock: 7 });
  });

  it('returns PRODUCT_NOT_FOUND when the product does not exist', async () => {
    const repository = createMockRepository();
    repository.findById.mockResolvedValue(null);

    const useCase = new GetStockUseCase(repository);
    const result = await useCase.execute('missing');

    expect(result.isErr()).toBe(true);
    expect(result.error.code).toBe(ErrorCode.PRODUCT_NOT_FOUND);
  });
});
