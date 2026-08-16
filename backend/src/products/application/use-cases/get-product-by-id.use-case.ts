import { Inject, Injectable, Logger } from '@nestjs/common';
import { Result } from '../../../common/result';
import { DomainError } from '../../../common/errors/domain-error';
import { ErrorCode } from '../../../common/errors/error-code';
import { Product } from '../../domain/product.entity';
import {
  PRODUCT_REPOSITORY,
  type ProductRepository,
} from '../../domain/product.repository';

@Injectable()
export class GetProductByIdUseCase {
  private readonly logger = new Logger(GetProductByIdUseCase.name);

  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepository,
  ) {}

  async execute(id: string): Promise<Result<Product, DomainError>> {
    const product = await this.productRepository.findById(id);

    if (!product) {
      this.logger.warn(`Product "${id}" was not found`);
      return Result.err(
        new DomainError(
          ErrorCode.PRODUCT_NOT_FOUND,
          `Product "${id}" was not found.`,
          {
            productId: id,
          },
        ),
      );
    }

    return Result.ok(product);
  }
}
