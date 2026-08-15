import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { unwrap } from '../../../common/errors/api-exception';
import { CreateTransactionUseCase } from '../../application/use-cases/create-transaction.use-case';
import { GetTransactionByIdUseCase } from '../../application/use-cases/get-transaction-by-id.use-case';
import { UpdateTransactionStatusUseCase } from '../../application/use-cases/update-transaction-status.use-case';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { TransactionResponseDto } from './dto/transaction-response.dto';
import { TransactionWebhookEventDto } from './dto/transaction-webhook-event.dto';

@ApiTags('transactions')
@Controller('transactions')
export class TransactionsController {
  constructor(
    private readonly createTransactionUseCase: CreateTransactionUseCase,
    private readonly getTransactionByIdUseCase: GetTransactionByIdUseCase,
    private readonly updateTransactionStatusUseCase: UpdateTransactionStatusUseCase,
  ) {}

  @Post()
  @ApiOperation({
    summary:
      'Create a checkout transaction: resolves/creates the customer, creates the delivery, decrements stock, and sends the transaction to the payment gateway.',
  })
  @ApiResponse({ status: 201, type: TransactionResponseDto })
  async create(
    @Body() dto: CreateTransactionDto,
  ): Promise<TransactionResponseDto> {
    const transaction = unwrap(await this.createTransactionUseCase.execute(dto));
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
    const transaction = unwrap(await this.getTransactionByIdUseCase.execute(id));
    return TransactionResponseDto.fromDomain(transaction);
  }

  @Post('webhook')
  @ApiOperation({
    summary:
      'Payment gateway webhook — applies the final status (APPROVED/DECLINED/etc.) to the transaction matching the given reference.',
  })
  @ApiResponse({ status: 200, type: TransactionResponseDto })
  @ApiResponse({ status: 404, description: 'Transaction not found.' })
  async handleWebhook(
    @Body() dto: TransactionWebhookEventDto,
  ): Promise<TransactionResponseDto> {
    const transaction = unwrap(
      await this.updateTransactionStatusUseCase.execute(dto),
    );
    return TransactionResponseDto.fromDomain(transaction);
  }
}
