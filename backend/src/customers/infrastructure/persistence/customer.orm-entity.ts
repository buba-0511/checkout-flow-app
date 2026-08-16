import { Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';
import { LegalIdType } from '../../domain/customer.entity';
import { DeliveryOrmEntity } from '../../../deliveries/infrastructure/persistence/delivery.orm-entity';
import { TransactionOrmEntity } from '../../../transactions/infrastructure/persistence/transaction.orm-entity';

@Entity('customers')
export class CustomerOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'full_name' })
  fullName: string;

  @Column()
  email: string;

  @Column()
  phone: string;

  @Column({ name: 'legal_id', unique: true })
  legalId: string;

  @Column({ name: 'legal_id_type', type: 'enum', enum: LegalIdType })
  legalIdType: LegalIdType;

  @OneToMany(() => DeliveryOrmEntity, (delivery) => delivery.customer)
  deliveries?: DeliveryOrmEntity[];

  @OneToMany(() => TransactionOrmEntity, (transaction) => transaction.customer)
  transactions?: TransactionOrmEntity[];
}
