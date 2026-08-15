import { TransactionContext } from '../../common/transaction-manager';
import { Delivery } from './delivery.entity';

// The port — implemented by
// infrastructure/persistence/typeorm-delivery.repository.ts.
export interface DeliveryRepository {
  findById(id: string): Promise<Delivery | null>;
  // ctx: pass the TransactionContext from TransactionManager.run() to make
  // this write part of a larger atomic DB transaction (e.g. inside
  // CreateTransactionUseCase). Omit for a standalone write.
  save(delivery: Delivery, ctx?: TransactionContext): Promise<void>;
}

export const DELIVERY_REPOSITORY = Symbol('DELIVERY_REPOSITORY');
