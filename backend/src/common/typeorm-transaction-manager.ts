import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { TransactionContext, TransactionManager } from './transaction-manager';

// The only place that knows a TransactionContext wraps a TypeORM
// EntityManager. Each typeorm-*.repository.ts unwraps it with
// TypeOrmTransactionContext.managerOf(ctx) to run its query against the
// same open transaction instead of its normally-injected Repository.
export class TypeOrmTransactionContext implements TransactionContext {
  constructor(public readonly manager: EntityManager) {}

  static managerOf(
    ctx: TransactionContext | undefined,
  ): EntityManager | undefined {
    return ctx instanceof TypeOrmTransactionContext ? ctx.manager : undefined;
  }
}

@Injectable()
export class TypeOrmTransactionManager implements TransactionManager {
  constructor(private readonly dataSource: DataSource) {}

  async run<T>(work: (ctx: TransactionContext) => Promise<T>): Promise<T> {
    return this.dataSource.transaction((manager) =>
      work(new TypeOrmTransactionContext(manager)),
    );
  }
}
