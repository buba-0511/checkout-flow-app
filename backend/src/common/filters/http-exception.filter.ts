import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiErrorResponse } from '../dto/api-response';
import { ApiException } from '../errors/api-exception';
import { ErrorCode } from '../errors/error-code';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const { status, body } = this.toErrorResponse(exception);
    response.status(status).json(body);
  }

  private toErrorResponse(exception: unknown): {
    status: number;
    body: ApiErrorResponse;
  } {
    if (exception instanceof ApiException) {
      const { code, message, details } = exception.domainError;
      return {
        status: exception.getStatus(),
        body: { success: false, error: { code, message, details } },
      };
    }

    // class-validator failures raised by Nest's ValidationPipe
    if (exception instanceof BadRequestException) {
      const payload = exception.getResponse();
      const fields =
        typeof payload === 'object' && payload !== null && 'message' in payload
          ? (payload as { message: string[] | string }).message
          : exception.message;

      return {
        status: HttpStatus.BAD_REQUEST,
        body: {
          success: false,
          error: {
            code: ErrorCode.VALIDATION_ERROR,
            message: 'Request validation failed.',
            details: { fields: Array.isArray(fields) ? fields : [fields] },
          },
        },
      };
    }

    if (exception instanceof HttpException) {
      return {
        status: exception.getStatus(),
        body: {
          success: false,
          error: { code: ErrorCode.INTERNAL_ERROR, message: exception.message },
        },
      };
    }

    this.logger.error(
      'Unhandled exception',
      exception instanceof Error ? exception.stack : exception,
    );
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      body: {
        success: false,
        error: {
          code: ErrorCode.INTERNAL_ERROR,
          message: 'Something went wrong. Please try again.',
        },
      },
    };
  }
}
