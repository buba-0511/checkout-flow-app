import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransactionContext } from '../../../common/transaction-manager';
import { TypeOrmTransactionContext } from '../../../common/typeorm-transaction-manager';
import { Customer } from '../../domain/customer.entity';
import { CustomerRepository } from '../../domain/customer.repository';
import { CustomerMapper } from './customer.mapper';
import { CustomerOrmEntity } from './customer.orm-entity';

@Injectable()
export class TypeOrmCustomerRepository implements CustomerRepository {
  constructor(
    @InjectRepository(CustomerOrmEntity)
    private readonly repo: Repository<CustomerOrmEntity>,
  ) {}

  async findById(id: string, ctx?: TransactionContext): Promise<Customer | null> {
    const entity = await this.repoFor(ctx).findOneBy({ id });
    return entity ? CustomerMapper.toDomain(entity) : null;
  }

  async findByLegalId(legalId: string): Promise<Customer | null> {
    const entity = await this.repo.findOneBy({ legalId });
    return entity ? CustomerMapper.toDomain(entity) : null;
  }

  async save(customer: Customer, ctx?: TransactionContext): Promise<void> {
    await this.repoFor(ctx).save(CustomerMapper.toOrm(customer));
  }

  private repoFor(ctx?: TransactionContext): Repository<CustomerOrmEntity> {
    const manager = TypeOrmTransactionContext.managerOf(ctx);
    return manager ? manager.getRepository(CustomerOrmEntity) : this.repo;
  }
}
