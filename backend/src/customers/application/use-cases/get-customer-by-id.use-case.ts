import { Inject, Injectable, Logger } from '@nestjs/common';
import { Result } from '../../../common/result';
import { DomainError } from '../../../common/errors/domain-error';
import { ErrorCode } from '../../../common/errors/error-code';
import { TransactionContext } from '../../../common/transaction-manager';
import { Customer } from '../../domain/customer.entity';
import {
  CUSTOMER_REPOSITORY,
  type CustomerRepository,
} from '../../domain/customer.repository';

@Injectable()
export class GetCustomerByIdUseCase {
  private readonly logger = new Logger(GetCustomerByIdUseCase.name);

  constructor(
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customerRepository: CustomerRepository,
  ) {}

  async execute(
    id: string,
    ctx?: TransactionContext,
  ): Promise<Result<Customer, DomainError>> {
    const customer = await this.customerRepository.findById(id, ctx);

    if (!customer) {
      this.logger.warn(`Customer "${id}" was not found`);
      return Result.err(
        new DomainError(
          ErrorCode.CUSTOMER_NOT_FOUND,
          `Customer "${id}" was not found.`,
          { customerId: id },
        ),
      );
    }

    return Result.ok(customer);
  }
}
