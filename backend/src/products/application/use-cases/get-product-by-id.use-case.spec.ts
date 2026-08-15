import { Product } from '../../domain/product.entity';
import type { ProductRepository } from '../../domain/product.repository';
import { ErrorCode } from '../../../common/errors/error-code';
import { GetProductByIdUseCase } from './get-product-by-id.use-case';

function createMockRepository(): jest.Mocked<ProductRepository> {
  return {
    findPage: jest.fn(),
    findById: jest.fn(),
    findByIds: jest.fn(),
    save: jest.fn(),
    saveMany: jest.fn(),
  };
}

describe('GetProductByIdUseCase', () => {
  it('returns the product when it exists', async () => {
    const repository = createMockRepository();
    const product = new Product(
      'p1',
      'Widget',
      'A widget.',
      1000,
      10,
      'http://x/1.jpg',
    );
    repository.findById.mockResolvedValue(product);

    const useCase = new GetProductByIdUseCase(repository);
    const result = await useCase.execute('p1');

    expect(repository.findById).toHaveBeenCalledWith('p1');
    expect(result.isOk()).toBe(true);
    expect(result.value).toBe(product);
  });

  it('returns PRODUCT_NOT_FOUND when it does not exist', async () => {
    const repository = createMockRepository();
    repository.findById.mockResolvedValue(null);

    const useCase = new GetProductByIdUseCase(repository);
    const result = await useCase.execute('missing');

    expect(result.isErr()).toBe(true);
    expect(result.error.code).toBe(ErrorCode.PRODUCT_NOT_FOUND);
    expect(result.error.details).toEqual({ productId: 'missing' });
  });
});
