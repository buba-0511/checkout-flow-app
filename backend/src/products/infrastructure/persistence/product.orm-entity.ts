import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { TransactionItemOrmEntity } from '../../../transactions/infrastructure/persistence/transaction-item.orm-entity';

// TypeORM's view of a product. Only this file and product.mapper.ts know
// this shape exists — everything else in the app works with the plain
// domain.Product entity instead.
@Entity('products')
export class ProductOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column('text')
  description: string;

  @Column({ name: 'price_in_cents', type: 'int' })
  priceInCents: number;

  @Column('int')
  stock: number;

  @Column({ name: 'image_url' })
  imageUrl: string;

  @OneToMany(() => TransactionItemOrmEntity, (item) => item.product)
  transactionItems?: TransactionItemOrmEntity[];
}
