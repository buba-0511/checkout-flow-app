import { Inject, Injectable, Logger } from '@nestjs/common';
import { Result } from '../../../common/result';
import { DomainError } from '../../../common/errors/domain-error';
import { ErrorCode } from '../../../common/errors/error-code';
import { Delivery } from '../../domain/delivery.entity';
import {
  DELIVERY_REPOSITORY,
  type DeliveryRepository,
} from '../../domain/delivery.repository';

@Injectable()
export class GetDeliveryByIdUseCase {
  private readonly logger = new Logger(GetDeliveryByIdUseCase.name);

  constructor(
    @Inject(DELIVERY_REPOSITORY)
    private readonly deliveryRepository: DeliveryRepository,
  ) {}

  async execute(id: string): Promise<Result<Delivery, DomainError>> {
    const delivery = await this.deliveryRepository.findById(id);

    if (!delivery) {
      this.logger.warn(`Delivery "${id}" was not found`);
      return Result.err(
        new DomainError(
          ErrorCode.DELIVERY_NOT_FOUND,
          `Delivery "${id}" was not found.`,
          { deliveryId: id },
        ),
      );
    }

    return Result.ok(delivery);
  }
}
