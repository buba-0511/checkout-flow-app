import { Inject, Injectable } from '@nestjs/common';
import { Result } from '../../../common/result';
import { DomainError } from '../../../common/errors/domain-error';
import { ErrorCode } from '../../../common/errors/error-code';
import { Product } from '../../domain/product.entity';
import {
  PRODUCT_REPOSITORY,
  type ProductRepository,
} from '../../domain/product.repository';

export interface DecreaseStockItem {
  productId: string;
  quantity: number;
}

// Decrements stock for every item in a transaction's cart atomically: if any
// single item fails validation (missing product, insufficient stock), no
// product's stock is touched at all — the whole batch fails together.
//
// The Result chain below is synchronous by design (see common/result.ts),
// so the two I/O steps (fetching, persisting) sit outside it: fetch once up
// front, run the pure validate -> apply chain in memory, persist once at
// the end only if the whole chain succeeded.
@Injectable()
export class DecreaseStockUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepository,
  ) {}

  async execute(
    items: DecreaseStockItem[],
  ): Promise<Result<void, DomainError>> {
    const productIds = items.map((item) => item.productId);
    const foundProducts = await this.productRepository.findByIds(productIds);

    const result = this.validateAllExist(items, foundProducts)
      .andThen((products) => this.validateSufficientStock(items, products))
      .andThen((products) => this.applyDecrease(items, products));

    if (result.isErr()) {
      return Result.err(result.error);
    }

    await this.productRepository.saveMany(result.value);
    return Result.ok(undefined);
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
