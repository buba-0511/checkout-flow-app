import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransactionContext } from '../../../common/transaction-manager';
import { TypeOrmTransactionContext } from '../../../common/typeorm-transaction-manager';
import { Transaction } from '../../domain/transaction.entity';
import { TransactionRepository } from '../../domain/transaction.repository';
import { TransactionMapper } from './transaction.mapper';
import { TransactionOrmEntity } from './transaction.orm-entity';

@Injectable()
export class TypeOrmTransactionRepository implements TransactionRepository {
  constructor(
    @InjectRepository(TransactionOrmEntity)
    private readonly repo: Repository<TransactionOrmEntity>,
  ) {}

  async findById(id: string): Promise<Transaction | null> {
    const entity = await this.repo.findOne({
      where: { id },
      relations: { items: true },
    });
    return entity ? TransactionMapper.toDomain(entity) : null;
  }

  async findByReference(reference: string): Promise<Transaction | null> {
    const entity = await this.repo.findOne({
      where: { reference },
      relations: { items: true },
    });
    return entity ? TransactionMapper.toDomain(entity) : null;
  }

  async save(transaction: Transaction, ctx?: TransactionContext): Promise<void> {
    const manager = TypeOrmTransactionContext.managerOf(ctx);
    const repo = manager ? manager.getRepository(TransactionOrmEntity) : this.repo;
    await repo.save(TransactionMapper.toOrm(transaction));
  }
}
