import { TransactionContext } from '../../common/transaction-manager';
import { Customer } from './customer.entity';

// The port — implemented by
// infrastructure/persistence/typeorm-customer.repository.ts.
export interface CustomerRepository {
  // ctx: needed when this read must see a customer just written earlier in
  // the same still-open DB transaction (e.g. CreateDeliveryUseCase reading
  // back a customer FindOrCreateCustomerUseCase just created, inside
  // CreateTransactionUseCase's transaction) — a plain connection wouldn't
  // see an uncommitted row from another one. Omit for a standalone read.
  findById(id: string, ctx?: TransactionContext): Promise<Customer | null>;
  // legalId (cédula/NIT), not email, is the real-world unique identifier
  // used to detect a returning customer — see find-or-create-customer.use-case.ts.
  findByLegalId(legalId: string): Promise<Customer | null>;
  // ctx: pass the TransactionContext from TransactionManager.run() to make
  // this write part of a larger atomic DB transaction (e.g. inside
  // CreateTransactionUseCase). Omit for a standalone write.
  save(customer: Customer, ctx?: TransactionContext): Promise<void>;
}

export const CUSTOMER_REPOSITORY = Symbol('CUSTOMER_REPOSITORY');
