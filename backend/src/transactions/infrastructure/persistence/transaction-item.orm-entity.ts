import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  RelationId,
} from 'typeorm';
import { ProductOrmEntity } from '../../../products/infrastructure/persistence/product.orm-entity';
import { TransactionOrmEntity } from './transaction.orm-entity';

@Entity('transaction_items')
export class TransactionItemOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Index()
  @ManyToOne(() => TransactionOrmEntity, (transaction) => transaction.items, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'transaction_id' })
  transaction: TransactionOrmEntity;

  @RelationId((item: TransactionItemOrmEntity) => item.transaction)
  transactionId: string;

  @Index()
  @ManyToOne(() => ProductOrmEntity, (product) => product.transactionItems, {
    nullable: false,
  })
  @JoinColumn({ name: 'product_id' })
  product: ProductOrmEntity;

  @RelationId((item: TransactionItemOrmEntity) => item.product)
  productId: string;

  @Column()
  quantity: number;

  @Column({ name: 'unit_price_in_cents' })
  unitPriceInCents: number;

  @Column({ name: 'subtotal_in_cents' })
  subtotalInCents: number;
}
