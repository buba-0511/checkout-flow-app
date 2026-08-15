import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

  async findById(id: string): Promise<Customer | null> {
    const entity = await this.repo.findOneBy({ id });
    return entity ? CustomerMapper.toDomain(entity) : null;
  }

  async findByLegalId(legalId: string): Promise<Customer | null> {
    const entity = await this.repo.findOneBy({ legalId });
    return entity ? CustomerMapper.toDomain(entity) : null;
  }

  async save(customer: Customer): Promise<void> {
    await this.repo.save(CustomerMapper.toOrm(customer));
  }
}
