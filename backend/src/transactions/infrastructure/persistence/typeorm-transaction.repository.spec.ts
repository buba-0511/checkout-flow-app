import { EntityManager, Repository } from 'typeorm';
import { TypeOrmTransactionContext } from '../../../common/typeorm-transaction-manager';
import {
  Transaction,
  TransactionItem,
  TransactionSource,
  TransactionStatus,
} from '../../domain/transaction.entity';
import { TransactionItemOrmEntity } from './transaction-item.orm-entity';
import { TransactionMapper } from './transaction.mapper';
import { TransactionOrmEntity } from './transaction.orm-entity';
import { TypeOrmTransactionRepository } from './typeorm-transaction.repository';

function createMockOrmRepo(): jest.Mocked<Pick<Repository<TransactionOrmEntity>, 'findOne' | 'save'>> {
  return {
    findOne: jest.fn(),
    save: jest.fn(),
  };
}

function makeOrmEntity(id: string): TransactionOrmEntity {
  const orm = new TransactionOrmEntity();
  orm.id = id;
  orm.reference = 'ref-1';
  orm.customerId = 'c1';
  orm.deliveryId = 'd1';
  orm.status = TransactionStatus.PENDING;
  orm.source = TransactionSource.CART;
  const item = new TransactionItemOrmEntity();
  item.id = 'i1';
  item.productId = 'p1';
  item.quantity = 2;
  item.unitPriceInCents = 1000;
  item.subtotalInCents = 2000;
  orm.items = [item];
  orm.subtotalInCents = 2000;
  orm.baseFeeInCents = 300;
  orm.deliveryFeeInCents = 700;
  orm.totalAmountInCents = 3000;
  orm.paymentGatewayTransactionId = null;
  return orm;
}

function makeDomainTransaction(): Transaction {
  return Transaction.create({
    id: 't1',
    reference: 'ref-1',
    customerId: 'c1',
    deliveryId: 'd1',
    source: TransactionSource.CART,
    items: [new TransactionItem('i1', 'p1', 2, 1000, 2000)],
    baseFeeInCents: 300,
    deliveryFeeInCents: 700,
  });
}

describe('TypeOrmTransactionRepository', () => {
  function setup() {
    const ormRepo = createMockOrmRepo();
    const repository = new TypeOrmTransactionRepository(
      ormRepo as unknown as Repository<TransactionOrmEntity>,
    );
    return { ormRepo, repository };
  }

  describe('findById', () => {
    it('returns a mapped Transaction, eagerly loading items', async () => {
      const { ormRepo, repository } = setup();
      ormRepo.findOne.mockResolvedValue(makeOrmEntity('t1'));

      const transaction = await repository.findById('t1');

      expect(ormRepo.findOne).toHaveBeenCalledWith({
        where: { id: 't1' },
        relations: { items: true },
      });
      expect(transaction?.id).toBe('t1');
      expect(transaction?.items).toHaveLength(1);
    });

    it('returns null when not found', async () => {
      const { ormRepo, repository } = setup();
      ormRepo.findOne.mockResolvedValue(null);

      expect(await repository.findById('missing')).toBeNull();
    });
  });

  describe('findByReference', () => {
    it('returns a mapped Transaction, eagerly loading items', async () => {
      const { ormRepo, repository } = setup();
      ormRepo.findOne.mockResolvedValue(makeOrmEntity('t1'));

      const transaction = await repository.findByReference('ref-1');

      expect(ormRepo.findOne).toHaveBeenCalledWith({
        where: { reference: 'ref-1' },
        relations: { items: true },
      });
      expect(transaction?.reference).toBe('ref-1');
    });

    it('returns null when not found', async () => {
      const { ormRepo, repository } = setup();
      ormRepo.findOne.mockResolvedValue(null);

      expect(await repository.findByReference('missing')).toBeNull();
    });
  });

  describe('save', () => {
    it('maps the domain transaction to an ORM entity before saving', async () => {
      const { ormRepo, repository } = setup();
      const transaction = makeDomainTransaction();

      await repository.save(transaction);

      expect(ormRepo.save).toHaveBeenCalledWith(TransactionMapper.toOrm(transaction));
    });

    it('saves through the transactional EntityManager when a ctx is passed', async () => {
      const { ormRepo, repository } = setup();
      const transaction = makeDomainTransaction();
      const txRepo = { save: jest.fn() };
      const manager = {
        getRepository: jest.fn().mockReturnValue(txRepo),
      } as unknown as EntityManager;
      const ctx = new TypeOrmTransactionContext(manager);

      await repository.save(transaction, ctx);

      expect(manager.getRepository).toHaveBeenCalledWith(TransactionOrmEntity);
      expect(txRepo.save).toHaveBeenCalledWith(TransactionMapper.toOrm(transaction));
      expect(ormRepo.save).not.toHaveBeenCalled();
    });
  });
});
