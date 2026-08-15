import {
  ArgumentsHost,
  BadRequestException,
  HttpStatus,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ApiException } from '../errors/api-exception';
import { DomainError } from '../errors/domain-error';
import { ErrorCode } from '../errors/error-code';
import { GlobalExceptionFilter } from './http-exception.filter';

function createMockHost() {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const response = { status };
  const host = {
    switchToHttp: () => ({ getResponse: () => response }),
  } as unknown as ArgumentsHost;

  return { host, status, json };
}

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;

  beforeEach(() => {
    filter = new GlobalExceptionFilter();
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('formats an ApiException using its domain error', () => {
    const { host, status, json } = createMockHost();
    const domainError = new DomainError(
      ErrorCode.STOCK_INSUFFICIENT,
      'Not enough stock',
      {
        productId: 'p1',
      },
    );

    filter.catch(new ApiException(domainError), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: ErrorCode.STOCK_INSUFFICIENT,
        message: 'Not enough stock',
        details: { productId: 'p1' },
      },
    });
  });

  it('formats a BadRequestException with array messages as VALIDATION_ERROR with field details', () => {
    const { host, status, json } = createMockHost();

    filter.catch(new BadRequestException(['cardNumber must be valid']), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Request validation failed.',
        details: { fields: ['cardNumber must be valid'] },
      },
    });
  });

  it('wraps a BadRequestException with a plain string message into a single-item fields array', () => {
    const { host, json } = createMockHost();

    filter.catch(new BadRequestException('bad input'), host);

    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          details: { fields: ['bad input'] },
        }) as unknown,
      }),
    );
  });

  it('formats any other HttpException with its own status and message', () => {
    const { host, status, json } = createMockHost();

    filter.catch(new NotFoundException('Route not found'), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(json).toHaveBeenCalledWith({
      success: false,
      error: { code: ErrorCode.INTERNAL_ERROR, message: 'Route not found' },
    });
  });

  it('falls back to a generic 500 for an unexpected non-HTTP exception', () => {
    const { host, status, json } = createMockHost();

    filter.catch(new Error('database exploded'), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: ErrorCode.INTERNAL_ERROR,
        message: 'Something went wrong. Please try again.',
      },
    });
  });

  it('logs unexpected exceptions without leaking their details to the client', () => {
    const { host } = createMockHost();
    const logSpy = jest.spyOn(Logger.prototype, 'error');

    filter.catch(new Error('database exploded'), host);

    expect(logSpy).toHaveBeenCalled();
  });
});
