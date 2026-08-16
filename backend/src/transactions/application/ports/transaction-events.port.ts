import { Transaction } from '../../domain/transaction.entity';

// Implemented by TransactionsGateway (Socket.IO) — lets a use case announce
// a resolved status without depending on the transport used to deliver it.
export interface TransactionEventsPort {
  publishStatusUpdate(transaction: Transaction): void;
}

export const TRANSACTION_EVENTS_PORT = Symbol('TRANSACTION_EVENTS_PORT');
