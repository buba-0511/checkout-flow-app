import { Delivery } from '../../domain/delivery.entity';
import type { DeliveryRepository } from '../../domain/delivery.repository';
import { ErrorCode } from '../../../common/errors/error-code';
import { GetDeliveryByIdUseCase } from './get-delivery-by-id.use-case';

function createMockRepository(): jest.Mocked<DeliveryRepository> {
  return {
    findById: jest.fn(),
    save: jest.fn(),
  };
}

describe('GetDeliveryByIdUseCase', () => {
  it('returns the delivery when it exists', async () => {
    const repository = createMockRepository();
    const delivery = new Delivery(
      'd1',
      'c1',
      'Calle 123 #45-67',
      'Bogotá',
      'Cundinamarca',
    );
    repository.findById.mockResolvedValue(delivery);

    const useCase = new GetDeliveryByIdUseCase(repository);
    const result = await useCase.execute('d1');

    expect(repository.findById).toHaveBeenCalledWith('d1');
    expect(result.isOk()).toBe(true);
    expect(result.value).toBe(delivery);
  });

  it('returns DELIVERY_NOT_FOUND when it does not exist', async () => {
    const repository = createMockRepository();
    repository.findById.mockResolvedValue(null);

    const useCase = new GetDeliveryByIdUseCase(repository);
    const result = await useCase.execute('missing');

    expect(result.isErr()).toBe(true);
    expect(result.error.code).toBe(ErrorCode.DELIVERY_NOT_FOUND);
    expect(result.error.details).toEqual({ deliveryId: 'missing' });
  });
});
