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
import { TransactionOrmEntity } from '../../../transactions/infrastructure/persistence/transaction.orm-entity';

@Entity('deliveries')
export class DeliveryOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Index()
  @ManyToOne(() => CustomerOrmEntity, (customer) => customer.deliveries, {
    nullable: false,
  })
  @JoinColumn({ name: 'customer_id' })
  customer: CustomerOrmEntity;

  @RelationId((delivery: DeliveryOrmEntity) => delivery.customer)
  customerId: string;

  @Column()
  address: string;

  @Column()
  city: string;

  @Column()
  region: string;

  @OneToMany(() => TransactionOrmEntity, (transaction) => transaction.delivery)
  transactions?: TransactionOrmEntity[];
}
