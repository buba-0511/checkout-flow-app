import { Result } from './result';

// Opaque marker — carries no TypeORM types into ports/use cases. Only the
// TypeORM adapter (typeorm-transaction-manager.ts) and each
// typeorm-*.repository.ts know what's actually inside one.
export interface TransactionContext {}

// A port so a use case that writes across multiple repositories (e.g.
// CreateTransactionUseCase: customer, delivery, transaction, stock) can run
// them as one atomic DB transaction, without the use case or any
// domain/*.repository.ts port ever importing from 'typeorm'.
export interface TransactionManager {
  run<T>(work: (ctx: TransactionContext) => Promise<T>): Promise<T>;
}

export const TRANSACTION_MANAGER = Symbol('TRANSACTION_MANAGER');

// TypeORM only rolls back a DataSource.transaction() when its callback
// throws — but ROP use cases signal failure by returning Result.err(...) as
// a normal value, which TypeORM would see as success and commit anyway.
// runInTransaction bridges the two: any Result.err from `work` gets thrown
// internally (forcing the rollback) and converted back to a Result.err for
// the caller, so callers never have to think about this mismatch.
class RollbackSignal<E> extends Error {
  constructor(public readonly error: E) {
    super('Result.err inside a DB transaction — rolling back.');
  }
}

export async function runInTransaction<T, E>(
  transactionManager: TransactionManager,
  work: (ctx: TransactionContext) => Promise<Result<T, E>>,
): Promise<Result<T, E>> {
  try {
    const value = await transactionManager.run(async (ctx) => {
      const result = await work(ctx);
      if (result.isErr()) {
        throw new RollbackSignal(result.error);
      }
      return result.value;
    });
    return Result.ok(value);
  } catch (err) {
    if (err instanceof RollbackSignal) {
      return Result.err(err.error as E);
    }
    throw err;
  }
}
