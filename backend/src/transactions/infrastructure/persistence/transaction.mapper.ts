import {
  Transaction,
  TransactionItem,
} from '../../domain/transaction.entity';
import { CustomerOrmEntity } from '../../../customers/infrastructure/persistence/customer.orm-entity';
import { DeliveryOrmEntity } from '../../../deliveries/infrastructure/persistence/delivery.orm-entity';
import { ProductOrmEntity } from '../../../products/infrastructure/persistence/product.orm-entity';
import { TransactionItemOrmEntity } from './transaction-item.orm-entity';
import { TransactionOrmEntity } from './transaction.orm-entity';

export class TransactionMapper {
  static toDomain(orm: TransactionOrmEntity): Transaction {
    return Transaction.reconstitute({
      id: orm.id,
      reference: orm.reference,
      customerId: orm.customerId,
      deliveryId: orm.deliveryId,
      status: orm.status,
      source: orm.source,
      items: orm.items.map((item) => this.itemToDomain(item)),
      subtotalInCents: orm.subtotalInCents,
      baseFeeInCents: orm.baseFeeInCents,
      deliveryFeeInCents: orm.deliveryFeeInCents,
      totalAmountInCents: orm.totalAmountInCents,
      paymentGatewayTransactionId: orm.paymentGatewayTransactionId,
    });
  }

  static toOrm(domain: Transaction): TransactionOrmEntity {
    const orm = new TransactionOrmEntity();
    orm.id = domain.id;
    orm.reference = domain.reference;
    // Bare { id } stubs are enough for TypeORM to write the FK columns —
    // they don't trigger a SELECT or cascade into Customer/Delivery.
    orm.customer = { id: domain.customerId } as CustomerOrmEntity;
    orm.delivery = { id: domain.deliveryId } as DeliveryOrmEntity;
    orm.status = domain.status;
    orm.source = domain.source;
    orm.items = domain.items.map((item) => this.itemToOrm(item));
    orm.subtotalInCents = domain.subtotalInCents;
    orm.baseFeeInCents = domain.baseFeeInCents;
    orm.deliveryFeeInCents = domain.deliveryFeeInCents;
    orm.totalAmountInCents = domain.totalAmountInCents;
    orm.paymentGatewayTransactionId = domain.paymentGatewayTransactionId;
    return orm;
  }

  private static itemToDomain(orm: TransactionItemOrmEntity): TransactionItem {
    return new TransactionItem(
      orm.id,
      orm.productId,
      orm.quantity,
      orm.unitPriceInCents,
      orm.subtotalInCents,
    );
  }

  private static itemToOrm(domain: TransactionItem): TransactionItemOrmEntity {
    const orm = new TransactionItemOrmEntity();
    orm.id = domain.id;
    orm.product = { id: domain.productId } as ProductOrmEntity;
    orm.quantity = domain.quantity;
    orm.unitPriceInCents = domain.unitPriceInCents;
    orm.subtotalInCents = domain.subtotalInCents;
    return orm;
  }
}
