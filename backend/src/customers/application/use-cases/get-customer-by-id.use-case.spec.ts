import { Customer, LegalIdType } from '../../domain/customer.entity';
import type { CustomerRepository } from '../../domain/customer.repository';
import { ErrorCode } from '../../../common/errors/error-code';
import type { TransactionContext } from '../../../common/transaction-manager';
import { GetCustomerByIdUseCase } from './get-customer-by-id.use-case';

function createMockRepository(): jest.Mocked<CustomerRepository> {
  return {
    findById: jest.fn(),
    findByLegalId: jest.fn(),
    save: jest.fn(),
  };
}

describe('GetCustomerByIdUseCase', () => {
  it('returns the customer when it exists', async () => {
    const repository = createMockRepository();
    const customer = new Customer(
      'c1',
      'Jane Doe',
      'jane.doe@example.com',
      '+573001234567',
      '1234567890',
      LegalIdType.CC,
    );
    repository.findById.mockResolvedValue(customer);

    const useCase = new GetCustomerByIdUseCase(repository);
    const result = await useCase.execute('c1');

    expect(repository.findById).toHaveBeenCalledWith('c1', undefined);
    expect(result.isOk()).toBe(true);
    expect(result.value).toBe(customer);
  });

  it('returns CUSTOMER_NOT_FOUND when it does not exist', async () => {
    const repository = createMockRepository();
    repository.findById.mockResolvedValue(null);

    const useCase = new GetCustomerByIdUseCase(repository);
    const result = await useCase.execute('missing');

    expect(result.isErr()).toBe(true);
    expect(result.error.code).toBe(ErrorCode.CUSTOMER_NOT_FOUND);
    expect(result.error.details).toEqual({ customerId: 'missing' });
  });

  it('forwards the transaction context to findById when provided', async () => {
    const repository = createMockRepository();
    const customer = new Customer(
      'c1',
      'Jane Doe',
      'jane.doe@example.com',
      '+573001234567',
      '1234567890',
      LegalIdType.CC,
    );
    repository.findById.mockResolvedValue(customer);
    const ctx = {} as TransactionContext;

    const useCase = new GetCustomerByIdUseCase(repository);
    await useCase.execute('c1', ctx);

    expect(repository.findById).toHaveBeenCalledWith('c1', ctx);
  });
});
