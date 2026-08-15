import { Repository } from 'typeorm';
import { Customer, LegalIdType } from '../../domain/customer.entity';
import { CustomerMapper } from './customer.mapper';
import { CustomerOrmEntity } from './customer.orm-entity';
import { TypeOrmCustomerRepository } from './typeorm-customer.repository';

function createMockOrmRepo(): jest.Mocked<
  Pick<Repository<CustomerOrmEntity>, 'findOneBy' | 'save'>
> {
  return {
    findOneBy: jest.fn(),
    save: jest.fn(),
  };
}

function makeOrmEntity(id: string): CustomerOrmEntity {
  const orm = new CustomerOrmEntity();
  orm.id = id;
  orm.fullName = 'Jane Doe';
  orm.email = 'jane.doe@example.com';
  orm.phone = '+573001234567';
  orm.legalId = '1234567890';
  orm.legalIdType = LegalIdType.CC;
  return orm;
}

describe('TypeOrmCustomerRepository', () => {
  function setup() {
    const ormRepo = createMockOrmRepo();
    const repository = new TypeOrmCustomerRepository(
      ormRepo as unknown as Repository<CustomerOrmEntity>,
    );
    return { ormRepo, repository };
  }

  describe('findById', () => {
    it('returns a mapped Customer when found', async () => {
      const { ormRepo, repository } = setup();
      ormRepo.findOneBy.mockResolvedValue(makeOrmEntity('c1'));

      const customer = await repository.findById('c1');

      expect(ormRepo.findOneBy).toHaveBeenCalledWith({ id: 'c1' });
      expect(customer?.id).toBe('c1');
    });

    it('returns null when not found', async () => {
      const { ormRepo, repository } = setup();
      ormRepo.findOneBy.mockResolvedValue(null);

      expect(await repository.findById('missing')).toBeNull();
    });
  });

  describe('findByLegalId', () => {
    it('returns a mapped Customer when found', async () => {
      const { ormRepo, repository } = setup();
      ormRepo.findOneBy.mockResolvedValue(makeOrmEntity('c1'));

      const customer = await repository.findByLegalId('1234567890');

      expect(ormRepo.findOneBy).toHaveBeenCalledWith({ legalId: '1234567890' });
      expect(customer?.legalId).toBe('1234567890');
    });

    it('returns null when not found', async () => {
      const { ormRepo, repository } = setup();
      ormRepo.findOneBy.mockResolvedValue(null);

      expect(await repository.findByLegalId('missing')).toBeNull();
    });
  });

  describe('save', () => {
    it('maps the domain customer to an ORM entity before saving', async () => {
      const { ormRepo, repository } = setup();
      const customer = new Customer(
        'c1',
        'Jane Doe',
        'jane.doe@example.com',
        '+573001234567',
        '1234567890',
        LegalIdType.CC,
      );

      await repository.save(customer);

      expect(ormRepo.save).toHaveBeenCalledWith(CustomerMapper.toOrm(customer));
    });
  });
});
