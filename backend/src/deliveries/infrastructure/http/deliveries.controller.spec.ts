import { Result } from '../../../common/result';
import { DomainError } from '../../../common/errors/domain-error';
import { ErrorCode } from '../../../common/errors/error-code';
import { ApiException } from '../../../common/errors/api-exception';
import { Delivery } from '../../domain/delivery.entity';
import { CreateDeliveryUseCase } from '../../application/use-cases/create-delivery.use-case';
import { GetDeliveryByIdUseCase } from '../../application/use-cases/get-delivery-by-id.use-case';
import { DeliveriesController } from './deliveries.controller';
import { CreateDeliveryDto } from './dto/create-delivery.dto';

describe('DeliveriesController', () => {
  function setup() {
    const createDeliveryUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<CreateDeliveryUseCase>;
    const getDeliveryByIdUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<GetDeliveryByIdUseCase>;

    const controller = new DeliveriesController(
      createDeliveryUseCase,
      getDeliveryByIdUseCase,
    );
    return { controller, createDeliveryUseCase, getDeliveryByIdUseCase };
  }

  const dto: CreateDeliveryDto = {
    customerId: 'c1',
    address: 'Calle 123 #45-67',
    city: 'Bogotá',
    region: 'Cundinamarca',
  };

  describe('create', () => {
    it('maps the resulting delivery to a response DTO', async () => {
      const { controller, createDeliveryUseCase } = setup();
      const delivery = new Delivery(
        'd1',
        'c1',
        'Calle 123 #45-67',
        'Bogotá',
        'Cundinamarca',
      );
      createDeliveryUseCase.execute.mockResolvedValue(Result.ok(delivery));

      const result = await controller.create(dto);

      expect(createDeliveryUseCase.execute).toHaveBeenCalledWith(dto);
      expect(result.id).toBe('d1');
    });
  });

  describe('findOne', () => {
    it('returns the mapped delivery when found', async () => {
      const { controller, getDeliveryByIdUseCase } = setup();
      const delivery = new Delivery(
        'd1',
        'c1',
        'Calle 123 #45-67',
        'Bogotá',
        'Cundinamarca',
      );
      getDeliveryByIdUseCase.execute.mockResolvedValue(Result.ok(delivery));

      const result = await controller.findOne('d1');

      expect(getDeliveryByIdUseCase.execute).toHaveBeenCalledWith('d1');
      expect(result.id).toBe('d1');
    });

    it('throws an ApiException when the use case returns an error', async () => {
      const { controller, getDeliveryByIdUseCase } = setup();
      getDeliveryByIdUseCase.execute.mockResolvedValue(
        Result.err(
          new DomainError(
            ErrorCode.DELIVERY_NOT_FOUND,
            'Delivery "missing" was not found.',
          ),
        ),
      );

      await expect(controller.findOne('missing')).rejects.toBeInstanceOf(
        ApiException,
      );
    });
  });
});
