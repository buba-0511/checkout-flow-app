import { TransactionContext } from '../../common/transaction-manager';
import { Transaction } from './transaction.entity';

// The port — implemented by
// infrastructure/persistence/typeorm-transaction.repository.ts.
export interface TransactionRepository {
  findById(id: string): Promise<Transaction | null>;
  // reference is what the payment gateway echoes back on its webhook —
  // used to locate the transaction a webhook event is about.
  findByReference(reference: string): Promise<Transaction | null>;
  // Used by CreateTransactionUseCase to detect a resubmitted checkout
  // attempt (reload/retry) instead of creating a duplicate transaction.
  findByIdempotencyKey(idempotencyKey: string): Promise<Transaction | null>;
  // ctx: pass to join CreateTransactionUseCase's DB transaction. Omit for
  // a standalone write.
  save(transaction: Transaction, ctx?: TransactionContext): Promise<void>;
}

export const TRANSACTION_REPOSITORY = Symbol('TRANSACTION_REPOSITORY');
