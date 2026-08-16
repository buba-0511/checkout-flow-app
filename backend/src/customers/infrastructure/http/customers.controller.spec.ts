import { Result } from '../../../common/result';
import { DomainError } from '../../../common/errors/domain-error';
import { ErrorCode } from '../../../common/errors/error-code';
import { ApiException } from '../../../common/errors/api-exception';
import { Customer, LegalIdType } from '../../domain/customer.entity';
import { FindOrCreateCustomerUseCase } from '../../application/use-cases/find-or-create-customer.use-case';
import { GetCustomerByIdUseCase } from '../../application/use-cases/get-customer-by-id.use-case';
import { CustomersController } from './customers.controller';
import { CreateCustomerDto } from './dto/create-customer.dto';

describe('CustomersController', () => {
  function setup() {
    const findOrCreateCustomerUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<FindOrCreateCustomerUseCase>;
    const getCustomerByIdUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<GetCustomerByIdUseCase>;

    const controller = new CustomersController(
      findOrCreateCustomerUseCase,
      getCustomerByIdUseCase,
    );
    return { controller, findOrCreateCustomerUseCase, getCustomerByIdUseCase };
  }

  const dto: CreateCustomerDto = {
    fullName: 'Jane Doe',
    email: 'jane.doe@example.com',
    phone: '+573001234567',
    legalId: '1234567890',
    legalIdType: LegalIdType.CC,
  };

  describe('findOrCreate', () => {
    it('maps the resulting customer to a response DTO', async () => {
      const { controller, findOrCreateCustomerUseCase } = setup();
      const customer = new Customer(
        'c1',
        'Jane Doe',
        'jane.doe@example.com',
        '+573001234567',
        '1234567890',
        LegalIdType.CC,
      );
      findOrCreateCustomerUseCase.execute.mockResolvedValue(
        Result.ok(customer),
      );

      const result = await controller.findOrCreate(dto);

      expect(findOrCreateCustomerUseCase.execute).toHaveBeenCalledWith(dto);
      expect(result.id).toBe('c1');
    });
  });

  describe('findOne', () => {
    it('returns the mapped customer when found', async () => {
      const { controller, getCustomerByIdUseCase } = setup();
      const customer = new Customer(
        'c1',
        'Jane Doe',
        'jane.doe@example.com',
        '+573001234567',
        '1234567890',
        LegalIdType.CC,
      );
      getCustomerByIdUseCase.execute.mockResolvedValue(Result.ok(customer));

      const result = await controller.findOne('c1');

      expect(getCustomerByIdUseCase.execute).toHaveBeenCalledWith('c1');
      expect(result.id).toBe('c1');
    });

    it('throws an ApiException when the use case returns an error', async () => {
      const { controller, getCustomerByIdUseCase } = setup();
      getCustomerByIdUseCase.execute.mockResolvedValue(
        Result.err(
          new DomainError(
            ErrorCode.CUSTOMER_NOT_FOUND,
            'Customer "missing" was not found.',
          ),
        ),
      );

      await expect(controller.findOne('missing')).rejects.toBeInstanceOf(
        ApiException,
      );
    });
  });
});
