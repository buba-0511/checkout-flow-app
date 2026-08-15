import { Result } from '../../../common/result';
import { DomainError } from '../../../common/errors/domain-error';
import { ErrorCode } from '../../../common/errors/error-code';
import { ApiException } from '../../../common/errors/api-exception';
import { Product } from '../../domain/product.entity';
import { ListProductsUseCase } from '../../application/use-cases/list-products.use-case';
import { GetProductByIdUseCase } from '../../application/use-cases/get-product-by-id.use-case';
import { ProductsController } from './products.controller';

describe('ProductsController', () => {
  function setup() {
    const listProductsUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<ListProductsUseCase>;
    const getProductByIdUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<GetProductByIdUseCase>;

    const controller = new ProductsController(
      listProductsUseCase,
      getProductByIdUseCase,
    );
    return { controller, listProductsUseCase, getProductByIdUseCase };
  }

  describe('findAll', () => {
    it('passes the query cursor/limit to the use case and maps the page to DTOs', async () => {
      const { controller, listProductsUseCase } = setup();
      const products = [
        new Product('p1', 'Widget', 'A widget.', 1000, 10, 'http://x/1.jpg'),
      ];
      listProductsUseCase.execute.mockResolvedValue(
        Result.ok({ items: products, nextCursor: 'p1' }),
      );

      const result = await controller.findAll({ cursor: 'p0', limit: 20 });

      expect(listProductsUseCase.execute).toHaveBeenCalledWith({
        cursor: 'p0',
        limit: 20,
      });
      expect(result).toEqual({
        items: [
          {
            id: 'p1',
            name: 'Widget',
            description: 'A widget.',
            priceInCents: 1000,
            stock: 10,
            imageUrl: 'http://x/1.jpg',
          },
        ],
        nextCursor: 'p1',
      });
    });
  });

  describe('findOne', () => {
    it('returns the mapped product when found', async () => {
      const { controller, getProductByIdUseCase } = setup();
      const product = new Product(
        'p1',
        'Widget',
        'A widget.',
        1000,
        10,
        'http://x/1.jpg',
      );
      getProductByIdUseCase.execute.mockResolvedValue(Result.ok(product));

      const result = await controller.findOne('p1');

      expect(getProductByIdUseCase.execute).toHaveBeenCalledWith('p1');
      expect(result.id).toBe('p1');
    });

    it('throws an ApiException when the use case returns an error', async () => {
      const { controller, getProductByIdUseCase } = setup();
      getProductByIdUseCase.execute.mockResolvedValue(
        Result.err(
          new DomainError(
            ErrorCode.PRODUCT_NOT_FOUND,
            'Product "missing" was not found.',
          ),
        ),
      );

      await expect(controller.findOne('missing')).rejects.toBeInstanceOf(
        ApiException,
      );
    });
  });
});
