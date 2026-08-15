import { Customer } from './customer.entity';

// The port — implemented by
// infrastructure/persistence/typeorm-customer.repository.ts.
export interface CustomerRepository {
  findById(id: string): Promise<Customer | null>;
  // legalId (cédula/NIT), not email, is the real-world unique identifier
  // used to detect a returning customer — see find-or-create-customer.use-case.ts.
  findByLegalId(legalId: string): Promise<Customer | null>;
  save(customer: Customer): Promise<void>;
}

export const CUSTOMER_REPOSITORY = Symbol('CUSTOMER_REPOSITORY');
