import { ErrorCode } from './error-code';

// The error type use cases return inside Result.err(...) — never throw
// this, it travels through the Result chain like any value. Only the
// controller/filter boundary turns it into an HTTP response.
export class DomainError {
  constructor(
    public readonly code: ErrorCode,
    public readonly message: string,
    public readonly details?: Record<string, unknown>,
  ) {}
}
