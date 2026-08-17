import {
  Transaction,
  TransactionItem,
  TransactionSource,
  TransactionStatus,
} from '../../domain/transaction.entity';
import { CustomerOrmEntity } from '../../../customers/infrastructure/persistence/customer.orm-entity';
import { DeliveryOrmEntity } from '../../../deliveries/infrastructure/persistence/delivery.orm-entity';
import { ProductOrmEntity } from '../../../products/infrastructure/persistence/product.orm-entity';
import { TransactionItemOrmEntity } from './transaction-item.orm-entity';
import { TransactionMapper } from './transaction.mapper';
import { TransactionOrmEntity } from './transaction.orm-entity';

function makeOrmItem(id: string, productId: string): TransactionItemOrmEntity {
  const orm = new TransactionItemOrmEntity();
  orm.id = id;
  orm.productId = productId;
  orm.quantity = 2;
  orm.unitPriceInCents = 1000;
  orm.subtotalInCents = 2000;
  return orm;
}

function makeOrmTransaction(): TransactionOrmEntity {
  const orm = new TransactionOrmEntity();
  orm.id = 't1';
  orm.reference = 'ref-1';
  orm.customerId = 'c1';
  orm.deliveryId = 'd1';
  orm.status = TransactionStatus.PENDING;
  orm.source = TransactionSource.CART;
  orm.items = [makeOrmItem('i1', 'p1')];
  orm.subtotalInCents = 2000;
  orm.baseFeeInCents = 300;
  orm.deliveryFeeInCents = 700;
  orm.totalAmountInCents = 3000;
  orm.paymentGatewayTransactionId = null;
  orm.idempotencyKey = 'idem-1';
  return orm;
}

function makeDomainTransaction(): Transaction {
  return Transaction.reconstitute({
    id: 't1',
    reference: 'ref-1',
    customerId: 'c1',
    deliveryId: 'd1',
    status: TransactionStatus.PENDING,
    source: TransactionSource.CART,
    items: [new TransactionItem('i1', 'p1', 2, 1000, 2000)],
    subtotalInCents: 2000,
    baseFeeInCents: 300,
    deliveryFeeInCents: 700,
    totalAmountInCents: 3000,
    paymentGatewayTransactionId: null,
    idempotencyKey: 'idem-1',
  });
}

describe('TransactionMapper', () => {
  describe('toDomain', () => {
    it('maps every field, including items, from the ORM entity', () => {
      const orm = makeOrmTransaction();

      const domain = TransactionMapper.toDomain(orm);

      expect(domain).toBeInstanceOf(Transaction);
      expect(domain.id).toBe('t1');
      expect(domain.reference).toBe('ref-1');
      expect(domain.customerId).toBe('c1');
      expect(domain.deliveryId).toBe('d1');
      expect(domain.status).toBe(TransactionStatus.PENDING);
      expect(domain.source).toBe(TransactionSource.CART);
      expect(domain.items).toHaveLength(1);
      expect(domain.items[0].productId).toBe('p1');
      expect(domain.subtotalInCents).toBe(2000);
      expect(domain.baseFeeInCents).toBe(300);
      expect(domain.deliveryFeeInCents).toBe(700);
      expect(domain.totalAmountInCents).toBe(3000);
      expect(domain.paymentGatewayTransactionId).toBeNull();
      expect(domain.idempotencyKey).toBe('idem-1');
    });
  });

  describe('toOrm', () => {
    it('maps every field, including items, to the ORM entity', () => {
      const domain = makeDomainTransaction();

      const orm = TransactionMapper.toOrm(domain);

      expect(orm).toBeInstanceOf(TransactionOrmEntity);
      expect(orm.id).toBe('t1');
      expect(orm.reference).toBe('ref-1');
      expect(orm.customer).toEqual({ id: 'c1' } as CustomerOrmEntity);
      expect(orm.delivery).toEqual({ id: 'd1' } as DeliveryOrmEntity);
      expect(orm.status).toBe(TransactionStatus.PENDING);
      expect(orm.source).toBe(TransactionSource.CART);
      expect(orm.items).toHaveLength(1);
      expect(orm.items[0]).toBeInstanceOf(TransactionItemOrmEntity);
      expect(orm.items[0].id).toBe('i1');
      expect(orm.items[0].product).toEqual({ id: 'p1' } as ProductOrmEntity);
      expect(orm.items[0].quantity).toBe(2);
      expect(orm.items[0].unitPriceInCents).toBe(1000);
      expect(orm.items[0].subtotalInCents).toBe(2000);
      expect(orm.subtotalInCents).toBe(2000);
      expect(orm.baseFeeInCents).toBe(300);
      expect(orm.deliveryFeeInCents).toBe(700);
      expect(orm.totalAmountInCents).toBe(3000);
      expect(orm.paymentGatewayTransactionId).toBeNull();
      expect(orm.idempotencyKey).toBe('idem-1');
    });
  });
});
