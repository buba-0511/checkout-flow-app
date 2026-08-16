import { randomUUID } from 'crypto';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Result } from '../../../common/result';
import { DomainError } from '../../../common/errors/domain-error';
import { TransactionContext } from '../../../common/transaction-manager';
import { GetCustomerByIdUseCase } from '../../../customers/application/use-cases/get-customer-by-id.use-case';
import { Delivery } from '../../domain/delivery.entity';
import {
  DELIVERY_REPOSITORY,
  type DeliveryRepository,
} from '../../domain/delivery.repository';

export interface CreateDeliveryInput {
  customerId: string;
  address: string;
  city: string;
  region: string;
}

// Unlike Customer (deduped by legalId), a Delivery is always created new —
// a returning customer may ship to a different address on each checkout,
// so there is no lookup-by-identity step here.
@Injectable()
export class CreateDeliveryUseCase {
  private readonly logger = new Logger(CreateDeliveryUseCase.name);

  constructor(
    @Inject(DELIVERY_REPOSITORY)
    private readonly deliveryRepository: DeliveryRepository,
    // Validates customerId up front so a bad id surfaces as
    // CUSTOMER_NOT_FOUND, not as a raw Postgres FK-violation turned
    // generic 500 by the global exception filter.
    private readonly getCustomerByIdUseCase: GetCustomerByIdUseCase,
  ) {}

  async execute(
    input: CreateDeliveryInput,
    ctx?: TransactionContext,
  ): Promise<Result<Delivery, DomainError>> {
    const customerResult = await this.getCustomerByIdUseCase.execute(
      input.customerId,
      ctx,
    );
    if (customerResult.isErr()) {
      return Result.err(customerResult.error);
    }

    const delivery = new Delivery(
      randomUUID(),
      input.customerId,
      input.address,
      input.city,
      input.region,
    );
    await this.deliveryRepository.save(delivery, ctx);
    this.logger.log(
      `Created delivery "${delivery.id}" for customer "${delivery.customerId}"`,
    );
    return Result.ok(delivery);
  }
}
