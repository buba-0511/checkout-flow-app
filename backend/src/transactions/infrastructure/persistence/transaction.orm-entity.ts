import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  RelationId,
} from 'typeorm';
import { CustomerOrmEntity } from '../../../customers/infrastructure/persistence/customer.orm-entity';
import { DeliveryOrmEntity } from '../../../deliveries/infrastructure/persistence/delivery.orm-entity';
import {
  TransactionSource,
  TransactionStatus,
} from '../../domain/transaction.entity';
import { TransactionItemOrmEntity } from './transaction-item.orm-entity';

// PrimaryColumn, not PrimaryGeneratedColumn — the application layer
// generates the id, matching every other *OrmEntity here.
@Entity('transactions')
export class TransactionOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ unique: true })
  reference: string;

  @Index()
  @ManyToOne(() => CustomerOrmEntity, (customer) => customer.transactions, {
    nullable: false,
  })
  @JoinColumn({ name: 'customer_id' })
  customer: CustomerOrmEntity;

  @RelationId((transaction: TransactionOrmEntity) => transaction.customer)
  customerId: string;

  @Index()
  @ManyToOne(() => DeliveryOrmEntity, (delivery) => delivery.transactions, {
    nullable: false,
  })
  @JoinColumn({ name: 'delivery_id' })
  delivery: DeliveryOrmEntity;

  @RelationId((transaction: TransactionOrmEntity) => transaction.delivery)
  deliveryId: string;

  @Column({ type: 'enum', enum: TransactionStatus })
  status: TransactionStatus;

  @Column({ type: 'enum', enum: TransactionSource })
  source: TransactionSource;

  // cascade: true lets save() also insert new TransactionItemOrmEntity rows.
  @OneToMany(() => TransactionItemOrmEntity, (item) => item.transaction, {
    cascade: true,
  })
  items: TransactionItemOrmEntity[];

  @Column({ name: 'subtotal_in_cents' })
  subtotalInCents: number;

  @Column({ name: 'base_fee_in_cents' })
  baseFeeInCents: number;

  @Column({ name: 'delivery_fee_in_cents' })
  deliveryFeeInCents: number;

  @Column({ name: 'total_amount_in_cents' })
  totalAmountInCents: number;

  // type must be explicit — TS's design:type metadata for a `string | null`
  // union resolves to Object, which TypeORM can't map to a Postgres column.
  @Column({
    name: 'payment_gateway_transaction_id',
    type: 'varchar',
    nullable: true,
  })
  paymentGatewayTransactionId: string | null;

  @Column({
    name: 'idempotency_key',
    type: 'varchar',
    nullable: true,
    unique: true,
  })
  idempotencyKey: string | null;
}
