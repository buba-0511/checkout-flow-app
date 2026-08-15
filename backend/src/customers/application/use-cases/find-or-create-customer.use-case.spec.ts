import { Customer, LegalIdType } from '../../domain/customer.entity';
import type { CustomerRepository } from '../../domain/customer.repository';
import { FindOrCreateCustomerUseCase } from './find-or-create-customer.use-case';

function createMockRepository(): jest.Mocked<CustomerRepository> {
  return {
    findById: jest.fn(),
    findByLegalId: jest.fn(),
    save: jest.fn(),
  };
}

const input = {
  fullName: 'Jane Doe',
  email: 'jane.doe@example.com',
  phone: '+573001234567',
  legalId: '1234567890',
  legalIdType: LegalIdType.CC,
};

describe('FindOrCreateCustomerUseCase', () => {
  it('returns the existing customer without creating a new one when legalId matches', async () => {
    const repository = createMockRepository();
    const existing = new Customer(
      'c1',
      'Jane Doe',
      'jane.doe@example.com',
      '+573001234567',
      '1234567890',
      LegalIdType.CC,
    );
    repository.findByLegalId.mockResolvedValue(existing);

    const useCase = new FindOrCreateCustomerUseCase(repository);
    const result = await useCase.execute(input);

    expect(repository.findByLegalId).toHaveBeenCalledWith('1234567890');
    expect(result.isOk()).toBe(true);
    expect(result.value).toBe(existing);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('does not overwrite the existing record even if the submitted details differ', async () => {
    const repository = createMockRepository();
    const existing = new Customer(
      'c1',
      'Jane On File',
      'on-file@example.com',
      '+573000000000',
      '1234567890',
      LegalIdType.CC,
    );
    repository.findByLegalId.mockResolvedValue(existing);

    const useCase = new FindOrCreateCustomerUseCase(repository);
    const result = await useCase.execute(input); // different name/email/phone, same legalId

    expect(result.value).toBe(existing);
    expect(result.value.fullName).toBe('Jane On File');
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('creates and persists a new customer when legalId is not found', async () => {
    const repository = createMockRepository();
    repository.findByLegalId.mockResolvedValue(null);

    const useCase = new FindOrCreateCustomerUseCase(repository);
    const result = await useCase.execute(input);

    expect(result.isOk()).toBe(true);
    expect(result.value.fullName).toBe('Jane Doe');
    expect(result.value.legalId).toBe('1234567890');
    expect(result.value.id).toEqual(expect.any(String));
    expect(repository.save).toHaveBeenCalledWith(result.value);
  });
});
