import { Result } from '../../../common/result';
import { DomainError } from '../../../common/errors/domain-error';
import { ErrorCode } from '../../../common/errors/error-code';
import type { TransactionContext } from '../../../common/transaction-manager';
import { Customer, LegalIdType } from '../../../customers/domain/customer.entity';
import { GetCustomerByIdUseCase } from '../../../customers/application/use-cases/get-customer-by-id.use-case';
import type { DeliveryRepository } from '../../domain/delivery.repository';
import { CreateDeliveryUseCase } from './create-delivery.use-case';

function createMockDeliveryRepository(): jest.Mocked<DeliveryRepository> {
  return {
    findById: jest.fn(),
    save: jest.fn(),
  };
}

function createMockGetCustomerByIdUseCase(): jest.Mocked<GetCustomerByIdUseCase> {
  return { execute: jest.fn() } as unknown as jest.Mocked<GetCustomerByIdUseCase>;
}

const existingCustomer = new Customer(
  'c1',
  'Jane Doe',
  'jane.doe@example.com',
  '+573001234567',
  '1234567890',
  LegalIdType.CC,
);

const input = {
  customerId: 'c1',
  address: 'Calle 123 #45-67',
  city: 'Bogotá',
  region: 'Cundinamarca',
};

describe('CreateDeliveryUseCase', () => {
  it('creates and persists a new delivery when the customer exists', async () => {
    const repository = createMockDeliveryRepository();
    const getCustomerByIdUseCase = createMockGetCustomerByIdUseCase();
    getCustomerByIdUseCase.execute.mockResolvedValue(Result.ok(existingCustomer));
    const useCase = new CreateDeliveryUseCase(repository, getCustomerByIdUseCase);

    const result = await useCase.execute(input);

    expect(getCustomerByIdUseCase.execute).toHaveBeenCalledWith('c1', undefined);
    expect(result.isOk()).toBe(true);
    expect(result.value.customerId).toBe('c1');
    expect(result.value.address).toBe('Calle 123 #45-67');
    expect(result.value.city).toBe('Bogotá');
    expect(result.value.region).toBe('Cundinamarca');
    expect(result.value.id).toEqual(expect.any(String));
    expect(repository.save).toHaveBeenCalledWith(result.value, undefined);
  });

  it('creates a new delivery every call, even for the same customer', async () => {
    const repository = createMockDeliveryRepository();
    const getCustomerByIdUseCase = createMockGetCustomerByIdUseCase();
    getCustomerByIdUseCase.execute.mockResolvedValue(Result.ok(existingCustomer));
    const useCase = new CreateDeliveryUseCase(repository, getCustomerByIdUseCase);

    const first = await useCase.execute(input);
    const second = await useCase.execute(input);

    expect(first.value.id).not.toBe(second.value.id);
    expect(repository.save).toHaveBeenCalledTimes(2);
  });

  it('returns CUSTOMER_NOT_FOUND and does not persist when the customer does not exist', async () => {
    const repository = createMockDeliveryRepository();
    const getCustomerByIdUseCase = createMockGetCustomerByIdUseCase();
    getCustomerByIdUseCase.execute.mockResolvedValue(
      Result.err(
        new DomainError(
          ErrorCode.CUSTOMER_NOT_FOUND,
          'Customer "c1" was not found.',
          { customerId: 'c1' },
        ),
      ),
    );
    const useCase = new CreateDeliveryUseCase(repository, getCustomerByIdUseCase);

    const result = await useCase.execute(input);

    expect(result.isErr()).toBe(true);
    expect(result.error.code).toBe(ErrorCode.CUSTOMER_NOT_FOUND);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('forwards the transaction context to the customer check and the save', async () => {
    const repository = createMockDeliveryRepository();
    const getCustomerByIdUseCase = createMockGetCustomerByIdUseCase();
    getCustomerByIdUseCase.execute.mockResolvedValue(Result.ok(existingCustomer));
    const useCase = new CreateDeliveryUseCase(repository, getCustomerByIdUseCase);
    const ctx = {} as TransactionContext;

    const result = await useCase.execute(input, ctx);

    expect(getCustomerByIdUseCase.execute).toHaveBeenCalledWith('c1', ctx);
    expect(repository.save).toHaveBeenCalledWith(result.value, ctx);
  });
});
