import { EntityManager, Repository } from 'typeorm';
import { TypeOrmTransactionContext } from '../../../common/typeorm-transaction-manager';
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

    it('saves through the transactional EntityManager when a ctx is passed', async () => {
      const { ormRepo, repository } = setup();
      const customer = new Customer(
        'c1',
        'Jane Doe',
        'jane.doe@example.com',
        '+573001234567',
        '1234567890',
        LegalIdType.CC,
      );
      const txRepo = { save: jest.fn() };
      const manager = {
        getRepository: jest.fn().mockReturnValue(txRepo),
      } as unknown as EntityManager;
      const ctx = new TypeOrmTransactionContext(manager);

      await repository.save(customer, ctx);

      expect(manager.getRepository).toHaveBeenCalledWith(CustomerOrmEntity);
      expect(txRepo.save).toHaveBeenCalledWith(CustomerMapper.toOrm(customer));
      expect(ormRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('findById with ctx', () => {
    it('reads through the transactional EntityManager when a ctx is passed', async () => {
      const { ormRepo, repository } = setup();
      const txRepo = {
        findOneBy: jest.fn().mockResolvedValue(makeOrmEntity('c1')),
      };
      const manager = {
        getRepository: jest.fn().mockReturnValue(txRepo),
      } as unknown as EntityManager;
      const ctx = new TypeOrmTransactionContext(manager);

      const customer = await repository.findById('c1', ctx);

      expect(manager.getRepository).toHaveBeenCalledWith(CustomerOrmEntity);
      expect(txRepo.findOneBy).toHaveBeenCalledWith({ id: 'c1' });
      expect(customer?.id).toBe('c1');
      expect(ormRepo.findOneBy).not.toHaveBeenCalled();
    });
  });
});
