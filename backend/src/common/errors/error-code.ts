import { HttpStatus } from '@nestjs/common';

// Business error codes returned in the `error.code` field of the response
// envelope. Add to this enum as use cases need new failure modes — the
// frontend interceptor and Redux error handling key off these codes, not
// off HTTP status alone, so it can show specific messages per case
// (e.g. "out of stock" vs "card declined" vs a generic error).
export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  PRODUCT_NOT_FOUND = 'PRODUCT_NOT_FOUND',
  STOCK_INSUFFICIENT = 'STOCK_INSUFFICIENT',
  CUSTOMER_NOT_FOUND = 'CUSTOMER_NOT_FOUND',
  TRANSACTION_NOT_FOUND = 'TRANSACTION_NOT_FOUND',
  DELIVERY_NOT_FOUND = 'DELIVERY_NOT_FOUND',
  PAYMENT_GATEWAY_ERROR = 'PAYMENT_GATEWAY_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

export const ERROR_CODE_HTTP_STATUS: Record<ErrorCode, HttpStatus> = {
  [ErrorCode.VALIDATION_ERROR]: HttpStatus.BAD_REQUEST,
  [ErrorCode.PRODUCT_NOT_FOUND]: HttpStatus.NOT_FOUND,
  [ErrorCode.STOCK_INSUFFICIENT]: HttpStatus.CONFLICT,
  [ErrorCode.CUSTOMER_NOT_FOUND]: HttpStatus.NOT_FOUND,
  [ErrorCode.TRANSACTION_NOT_FOUND]: HttpStatus.NOT_FOUND,
  [ErrorCode.DELIVERY_NOT_FOUND]: HttpStatus.NOT_FOUND,
  [ErrorCode.PAYMENT_GATEWAY_ERROR]: HttpStatus.BAD_GATEWAY,
  [ErrorCode.INTERNAL_ERROR]: HttpStatus.INTERNAL_SERVER_ERROR,
};
