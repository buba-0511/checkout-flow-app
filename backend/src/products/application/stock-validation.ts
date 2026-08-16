import { Result } from '../../common/result';
import { DomainError } from '../../common/errors/domain-error';
import { ErrorCode } from '../../common/errors/error-code';
import { Product } from '../domain/product.entity';

export interface StockCheckItem {
  productId: string;
  quantity: number;
}

// Shared by ValidateStockUseCase (read-only, at checkout time) and
// DecreaseStockUseCase (mutating, once a payment resolves) so both apply
// the exact same existence/sufficiency rules.
export function validateProductsExist(
  items: StockCheckItem[],
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

export function validateSufficientStock(
  items: StockCheckItem[],
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
