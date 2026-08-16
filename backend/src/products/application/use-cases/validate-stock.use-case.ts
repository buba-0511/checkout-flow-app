import { Inject, Injectable } from '@nestjs/common';
import { Result } from '../../../common/result';
import { DomainError } from '../../../common/errors/domain-error';
import { Product } from '../../domain/product.entity';
import {
  PRODUCT_REPOSITORY,
  type ProductRepository,
} from '../../domain/product.repository';
import {
  validateProductsExist,
  validateSufficientStock,
  type StockCheckItem,
} from '../stock-validation';

// Read-only — checks existence + sufficient stock without mutating.
// CreateTransactionUseCase uses this to price items and reject an obviously
// oversold cart up front; the actual decrement only happens once the
// payment resolves (see DecreaseStockUseCase, called from
// UpdateTransactionStatusUseCase on APPROVED).
@Injectable()
export class ValidateStockUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepository,
  ) {}

  async execute(
    items: StockCheckItem[],
  ): Promise<Result<Product[], DomainError>> {
    const productIds = items.map((item) => item.productId);
    const foundProducts = await this.productRepository.findByIds(productIds);

    return validateProductsExist(items, foundProducts).andThen((products) =>
      validateSufficientStock(items, products),
    );
  }
}
