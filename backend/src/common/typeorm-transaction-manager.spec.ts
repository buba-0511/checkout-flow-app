import { DataSource, EntityManager } from 'typeorm';
import {
  TypeOrmTransactionContext,
  TypeOrmTransactionManager,
} from './typeorm-transaction-manager';

describe('TypeOrmTransactionContext.managerOf', () => {
  it('returns the wrapped EntityManager for a TypeOrmTransactionContext', () => {
    const manager = {} as EntityManager;
    const ctx = new TypeOrmTransactionContext(manager);

    expect(TypeOrmTransactionContext.managerOf(ctx)).toBe(manager);
  });

  it('returns undefined when ctx is undefined', () => {
    expect(TypeOrmTransactionContext.managerOf(undefined)).toBeUndefined();
  });

  it('returns undefined for a ctx that is not a TypeOrmTransactionContext', () => {
    expect(TypeOrmTransactionContext.managerOf({})).toBeUndefined();
  });
});

describe('TypeOrmTransactionManager', () => {
  it('runs work inside a DataSource transaction, wrapped in a TypeOrmTransactionContext', async () => {
    const fakeManager = {} as EntityManager;
    const dataSource = {
      transaction: jest.fn((work: (manager: EntityManager) => Promise<unknown>) =>
        work(fakeManager),
      ),
    } as unknown as DataSource;

    const transactionManager = new TypeOrmTransactionManager(dataSource);
    const work = jest.fn(async (ctx) => {
      expect(ctx).toBeInstanceOf(TypeOrmTransactionContext);
      expect(TypeOrmTransactionContext.managerOf(ctx)).toBe(fakeManager);
      return 'result';
    });

    const result = await transactionManager.run(work);

    expect(dataSource.transaction).toHaveBeenCalledTimes(1);
    expect(work).toHaveBeenCalledTimes(1);
    expect(result).toBe('result');
  });
});
