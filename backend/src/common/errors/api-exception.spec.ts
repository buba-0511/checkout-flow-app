import { HttpStatus } from '@nestjs/common';
import { Result } from '../result';
import { ApiException, unwrap } from './api-exception';
import { DomainError } from './domain-error';
import { ErrorCode } from './error-code';

describe('ApiException', () => {
  it('maps the domain error code to the corresponding HTTP status', () => {
    const domainError = new DomainError(
      ErrorCode.STOCK_INSUFFICIENT,
      'Not enough stock',
    );
    const exception = new ApiException(domainError);

    expect(exception.getStatus()).toBe(HttpStatus.CONFLICT);
    expect(exception.message).toBe('Not enough stock');
    expect(exception.domainError).toBe(domainError);
  });
});

describe('unwrap', () => {
  it('returns the value for an Ok result', () => {
    const result = Result.ok<number, DomainError>(42);
    expect(unwrap(result)).toBe(42);
  });

  it('throws an ApiException carrying the domain error for an Err result', () => {
    const domainError = new DomainError(
      ErrorCode.PRODUCT_NOT_FOUND,
      'Product not found',
    );
    const result = Result.err<number, DomainError>(domainError);

    expect(() => unwrap(result)).toThrow(ApiException);
    try {
      unwrap(result);
      fail('expected unwrap to throw');
    } catch (thrown) {
      expect(thrown).toBeInstanceOf(ApiException);
      expect((thrown as ApiException).domainError).toBe(domainError);
      expect((thrown as ApiException).getStatus()).toBe(HttpStatus.NOT_FOUND);
    }
  });
});
