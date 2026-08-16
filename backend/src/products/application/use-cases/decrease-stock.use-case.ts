import { Inject, Injectable, Logger } from '@nestjs/common';
import { Result } from '../../../common/result';
import { DomainError } from '../../../common/errors/domain-error';
import { TransactionContext } from '../../../common/transaction-manager';
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

export type DecreaseStockItem = StockCheckItem;

@Injectable()
export class DecreaseStockUseCase {
  private readonly logger = new Logger(DecreaseStockUseCase.name);

  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepository,
  ) {}

  async execute(
    items: DecreaseStockItem[],
    ctx?: TransactionContext,
  ): Promise<Result<Product[], DomainError>> {
    const productIds = items.map((item) => item.productId);
    const foundProducts = await this.productRepository.findByIds(productIds);

    const result = validateProductsExist(items, foundProducts)
      .andThen((products) => validateSufficientStock(items, products))
      .andThen((products) => this.applyDecrease(items, products));

    if (result.isErr()) {
      this.logger.warn(`Stock decrement failed: ${result.error.message}`);
      return Result.err(result.error);
    }

    await this.productRepository.saveMany(result.value, ctx);
    this.logger.log(`Decremented stock for ${result.value.length} product(s)`);
    return Result.ok(result.value);
  }

  private applyDecrease(
    items: DecreaseStockItem[],
    products: Product[],
  ): Result<Product[], DomainError> {
    for (const item of items) {
      const product = products.find((p) => p.id === item.productId)!;
      product.decreaseStock(item.quantity);
    }
    return Result.ok(products);
  }
}
