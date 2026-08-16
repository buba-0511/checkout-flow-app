import { Inject, Injectable, Logger } from '@nestjs/common';
import { Result } from '../../../common/result';
import { DomainError } from '../../../common/errors/domain-error';
import { ErrorCode } from '../../../common/errors/error-code';
import {
  PRODUCT_REPOSITORY,
  type ProductRepository,
} from '../../domain/product.repository';

export interface StockLevel {
  productId: string;
  stock: number;
}

@Injectable()
export class GetStockUseCase {
  private readonly logger = new Logger(GetStockUseCase.name);

  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepository,
  ) {}

  async execute(productId: string): Promise<Result<StockLevel, DomainError>> {
    const product = await this.productRepository.findById(productId);

    if (!product) {
      this.logger.warn(`Product "${productId}" was not found`);
      return Result.err(
        new DomainError(
          ErrorCode.PRODUCT_NOT_FOUND,
          `Product "${productId}" was not found.`,
          {
            productId,
          },
        ),
      );
    }

    return Result.ok({ productId: product.id, stock: product.stock });
  }
}
