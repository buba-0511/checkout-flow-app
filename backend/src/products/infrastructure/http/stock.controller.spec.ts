import { Result } from '../../../common/result';
import { DomainError } from '../../../common/errors/domain-error';
import { ErrorCode } from '../../../common/errors/error-code';
import { ApiException } from '../../../common/errors/api-exception';
import { GetStockUseCase } from '../../application/use-cases/get-stock.use-case';
import { StockController } from './stock.controller';

describe('StockController', () => {
  function setup() {
    const getStockUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<GetStockUseCase>;

    const controller = new StockController(getStockUseCase);
    return { controller, getStockUseCase };
  }

  describe('findOne', () => {
    it('returns the mapped stock level when found', async () => {
      const { controller, getStockUseCase } = setup();
      getStockUseCase.execute.mockResolvedValue(
        Result.ok({ productId: 'p1', stock: 7 }),
      );

      const result = await controller.findOne('p1');

      expect(getStockUseCase.execute).toHaveBeenCalledWith('p1');
      expect(result).toEqual({ productId: 'p1', stock: 7 });
    });

    it('throws an ApiException when the use case returns an error', async () => {
      const { controller, getStockUseCase } = setup();
      getStockUseCase.execute.mockResolvedValue(
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
