import { HttpException } from '@nestjs/common';
import { DomainError } from './domain-error';
import { ERROR_CODE_HTTP_STATUS } from './error-code';
import { Result } from '../result';

// Bridges the ROP world (Result<T, DomainError>) to NestJS's HTTP world
// (exceptions), at the controller boundary only.
export class ApiException extends HttpException {
  constructor(public readonly domainError: DomainError) {
    super(domainError.message, ERROR_CODE_HTTP_STATUS[domainError.code]);
  }
}

// Controllers stay thin: `return unwrap(await useCase.execute(dto))`.
// Throws on Err so the global filter can format it; returns the plain
// value on Ok so the global interceptor can wrap it.
export function unwrap<T>(result: Result<T, DomainError>): T {
  if (result.isErr()) {
    throw new ApiException(result.error);
  }
  return result.value;
}
