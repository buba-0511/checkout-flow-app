import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  RelationId,
} from 'typeorm';
import { CustomerOrmEntity } from '../../../customers/infrastructure/persistence/customer.orm-entity';

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
}
