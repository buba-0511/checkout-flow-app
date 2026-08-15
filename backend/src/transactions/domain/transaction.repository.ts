import { TransactionContext } from '../../common/transaction-manager';
import { Transaction } from './transaction.entity';

// The port — implemented by
// infrastructure/persistence/typeorm-transaction.repository.ts.
export interface TransactionRepository {
  findById(id: string): Promise<Transaction | null>;
  // reference is what the payment gateway echoes back on its webhook —
  // used to locate the transaction a webhook event is about.
  findByReference(reference: string): Promise<Transaction | null>;
  // ctx: pass the TransactionContext from TransactionManager.run() to make
  // this write part of a larger atomic DB transaction (e.g. inside
  // CreateTransactionUseCase, alongside the customer/delivery/stock
  // writes). Omit for a standalone write (e.g. the webhook handler).
  save(transaction: Transaction, ctx?: TransactionContext): Promise<void>;
}

export const TRANSACTION_REPOSITORY = Symbol('TRANSACTION_REPOSITORY');
