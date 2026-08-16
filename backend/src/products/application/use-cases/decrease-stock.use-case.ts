import { Inject, Injectable, Logger } from '@nestjs/common';
import { Result } from '../../../common/result';
import { DomainError } from '../../../common/errors/domain-error';
import { ErrorCode } from '../../../common/errors/error-code';
import { TransactionContext } from '../../../common/transaction-manager';
import { Product } from '../../domain/product.entity';
import {
  PRODUCT_REPOSITORY,
  type ProductRepository,
} from '../../domain/product.repository';

export interface DecreaseStockItem {
  productId: string;
  quantity: number;
}

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

    const result = this.validateAllExist(items, foundProducts)
      .andThen((products) => this.validateSufficientStock(items, products))
      .andThen((products) => this.applyDecrease(items, products));

    if (result.isErr()) {
      this.logger.warn(`Stock decrement failed: ${result.error.message}`);
      return Result.err(result.error);
    }

    await this.productRepository.saveMany(result.value, ctx);
    this.logger.log(`Decremented stock for ${result.value.length} product(s)`);
    return Result.ok(result.value);
  }

  private validateAllExist(
    items: DecreaseStockItem[],
    products: Product[],
  ): Result<Product[], DomainError> {
    for (const item of items) {
      const found = products.find((product) => product.id === item.productId);
      if (!found) {
        return Result.err(
          new DomainError(
            ErrorCode.PRODUCT_NOT_FOUND,
            `Product "${item.productId}" was not found.`,
            { productId: item.productId },
          ),
        );
      }
    }
    return Result.ok(products);
  }

  private validateSufficientStock(
    items: DecreaseStockItem[],
    products: Product[],
  ): Result<Product[], DomainError> {
    for (const item of items) {
      const product = products.find((p) => p.id === item.productId)!;
      if (!product.hasEnoughStock(item.quantity)) {
        return Result.err(
          new DomainError(
            ErrorCode.STOCK_INSUFFICIENT,
            `Not enough stock for "${product.name}".`,
            {
              productId: product.id,
              requested: item.quantity,
              available: product.stock,
            },
          ),
        );
      }
    }
    return Result.ok(products);
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
