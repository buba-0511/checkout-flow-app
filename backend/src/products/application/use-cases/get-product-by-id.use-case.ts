import { Inject, Injectable } from '@nestjs/common';
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
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepository,
  ) {}

  async execute(id: string): Promise<Result<Product, DomainError>> {
    const product = await this.productRepository.findById(id);

    if (!product) {
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
