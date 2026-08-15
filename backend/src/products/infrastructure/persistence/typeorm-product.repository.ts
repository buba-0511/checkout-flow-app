import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, MoreThan, Repository } from 'typeorm';
import { TransactionContext } from '../../../common/transaction-manager';
import { TypeOrmTransactionContext } from '../../../common/typeorm-transaction-manager';
import { Product } from '../../domain/product.entity';
import {
  FindPageParams,
  ProductRepository,
} from '../../domain/product.repository';
import { ProductMapper } from './product.mapper';
import { ProductOrmEntity } from './product.orm-entity';

@Injectable()
export class TypeOrmProductRepository implements ProductRepository {
  constructor(
    @InjectRepository(ProductOrmEntity)
    private readonly repo: Repository<ProductOrmEntity>,
  ) {}

  async findPage({ cursor, limit }: FindPageParams): Promise<Product[]> {
    const entities = await this.repo.find({
      where: cursor ? { id: MoreThan(cursor) } : {},
      order: { id: 'ASC' },
      take: limit + 1,
    });
    return entities.map((entity) => ProductMapper.toDomain(entity));
  }

  async findById(id: string): Promise<Product | null> {
    const entity = await this.repo.findOneBy({ id });
    return entity ? ProductMapper.toDomain(entity) : null;
  }

  async findByIds(ids: string[]): Promise<Product[]> {
    if (ids.length === 0) return [];
    const entities = await this.repo.findBy({ id: In(ids) });
    return entities.map((entity) => ProductMapper.toDomain(entity));
  }

  async save(product: Product, ctx?: TransactionContext): Promise<void> {
    const repo = this.repoFor(ctx);
    await repo.save(ProductMapper.toOrm(product));
  }

  async saveMany(products: Product[], ctx?: TransactionContext): Promise<void> {
    const repo = this.repoFor(ctx);
    await repo.save(products.map((product) => ProductMapper.toOrm(product)));
  }

  private repoFor(ctx?: TransactionContext): Repository<ProductOrmEntity> {
    const manager = TypeOrmTransactionContext.managerOf(ctx);
    return manager ? manager.getRepository(ProductOrmEntity) : this.repo;
  }
}
