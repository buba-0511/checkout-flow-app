import { randomUUID } from 'crypto';
import { Inject, Injectable } from '@nestjs/common';
import { Result } from '../../../common/result';
import { DomainError } from '../../../common/errors/domain-error';
import { TransactionContext } from '../../../common/transaction-manager';
import { Customer, LegalIdType } from '../../domain/customer.entity';
import {
  CUSTOMER_REPOSITORY,
  type CustomerRepository,
} from '../../domain/customer.repository';

export interface FindOrCreateCustomerInput {
  fullName: string;
  email: string;
  phone: string;
  legalId: string;
  legalIdType: LegalIdType;
}

// No login/auth in this flow — every checkout submits customer details
// fresh. legalId identifies a returning customer; if one already exists we
// return that record as-is (never silently overwrite their details with
// whatever was just typed, in case of a typo) rather than erroring.
@Injectable()
export class FindOrCreateCustomerUseCase {
  constructor(
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customerRepository: CustomerRepository,
  ) {}

  async execute(
    input: FindOrCreateCustomerInput,
    ctx?: TransactionContext,
  ): Promise<Result<Customer, DomainError>> {
    const existing = await this.customerRepository.findByLegalId(input.legalId);
    if (existing) {
      return Result.ok(existing);
    }

    const customer = new Customer(
      randomUUID(),
      input.fullName,
      input.email,
      input.phone,
      input.legalId,
      input.legalIdType,
    );
    await this.customerRepository.save(customer, ctx);
    return Result.ok(customer);
  }
}
