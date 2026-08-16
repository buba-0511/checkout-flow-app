import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  ParseUUIDPipe,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { unwrap } from '../../../common/errors/api-exception';
import { CreateTransactionUseCase } from '../../application/use-cases/create-transaction.use-case';
import { GetTransactionByIdUseCase } from '../../application/use-cases/get-transaction-by-id.use-case';
import { UpdateTransactionStatusUseCase } from '../../application/use-cases/update-transaction-status.use-case';
import { WebhookSignatureVerifier } from '../payment-gateway/webhook-signature-verifier';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { TransactionResponseDto } from './dto/transaction-response.dto';
import { TransactionWebhookEventDto } from './dto/transaction-webhook-event.dto';

// Event types the gateway can send that this app doesn't act on (e.g.
// token-status updates for payment methods this app doesn't support) —
// acknowledged with 200 so the gateway doesn't retry, but otherwise a no-op.
const HANDLED_WEBHOOK_EVENT = 'transaction.updated';

@ApiTags('transactions')
@Controller('transactions')
export class TransactionsController {
  private readonly logger = new Logger(TransactionsController.name);

  constructor(
    private readonly createTransactionUseCase: CreateTransactionUseCase,
    private readonly getTransactionByIdUseCase: GetTransactionByIdUseCase,
    private readonly updateTransactionStatusUseCase: UpdateTransactionStatusUseCase,
    private readonly webhookSignatureVerifier: WebhookSignatureVerifier,
  ) {}

  @Post()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({
    summary:
      'Create a checkout transaction: resolves/creates the customer, creates the delivery, decrements stock, and sends the transaction to the payment gateway. Rate limited to 10 requests/minute per IP.',
  })
  @ApiResponse({ status: 201, type: TransactionResponseDto })
  @ApiResponse({
    status: 429,
    description: 'Too many requests (limit: 10/min per IP).',
  })
  async create(
    @Body() dto: CreateTransactionDto,
  ): Promise<TransactionResponseDto> {
    const transaction = unwrap(
      await this.createTransactionUseCase.execute(dto),
    );
    return TransactionResponseDto.fromDomain(transaction);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single transaction by id.' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, type: TransactionResponseDto })
  @ApiResponse({ status: 404, description: 'Transaction not found.' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<TransactionResponseDto> {
    const transaction = unwrap(
      await this.getTransactionByIdUseCase.execute(id),
    );
    return TransactionResponseDto.fromDomain(transaction);
  }

  @Post('webhook')
  @ApiOperation({
    summary:
      'Payment gateway webhook — applies the final status (APPROVED/DECLINED/etc.) to the transaction matching the given reference. Verifies the event signature; ignores event types other than transaction.updated.',
  })
  @ApiResponse({ status: 200, type: TransactionResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid webhook signature.' })
  @ApiResponse({ status: 404, description: 'Transaction not found.' })
  async handleWebhook(
    @Body() dto: TransactionWebhookEventDto,
  ): Promise<TransactionResponseDto | { received: true }> {
    if (!this.webhookSignatureVerifier.verify(dto)) {
      this.logger.warn(
        `Rejected webhook with invalid/stale signature — event "${dto.event}", reference "${dto.data?.transaction?.reference}"`,
      );
      throw new UnauthorizedException('Invalid webhook signature.');
    }

    if (dto.event !== HANDLED_WEBHOOK_EVENT) {
      return { received: true };
    }

    const transaction = unwrap(
      await this.updateTransactionStatusUseCase.execute({
        reference: dto.data.transaction.reference,
        status: dto.data.transaction.status,
      }),
    );
    return TransactionResponseDto.fromDomain(transaction);
  }
}
