import { DomainError } from './domain-error';
import { ErrorCode } from './error-code';

describe('DomainError', () => {
  it('carries code, message, and details', () => {
    const error = new DomainError(
      ErrorCode.STOCK_INSUFFICIENT,
      'Not enough stock',
      {
        productId: 'p1',
      },
    );

    expect(error.code).toBe(ErrorCode.STOCK_INSUFFICIENT);
    expect(error.message).toBe('Not enough stock');
    expect(error.details).toEqual({ productId: 'p1' });
  });

  it('allows details to be omitted', () => {
    const error = new DomainError(
      ErrorCode.PRODUCT_NOT_FOUND,
      'Product not found',
    );
    expect(error.details).toBeUndefined();
  });
});
