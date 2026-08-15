import { Column, Entity, PrimaryColumn } from 'typeorm';
import { LegalIdType } from '../../domain/customer.entity';

// TypeORM's view of a customer. Only this file and customer.mapper.ts know
// this shape exists. Uses PrimaryColumn (not PrimaryGeneratedColumn) — the
// application layer generates the id (see FindOrCreateCustomerUseCase),
// not the database, so identity is decided before persistence is involved.
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
}
