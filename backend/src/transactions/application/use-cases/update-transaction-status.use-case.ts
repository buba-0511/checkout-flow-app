import { Inject, Injectable, Logger } from '@nestjs/common';
import { Result } from '../../../common/result';
import { DomainError } from '../../../common/errors/domain-error';
import { ErrorCode } from '../../../common/errors/error-code';
import { DecreaseStockUseCase } from '../../../products/application/use-cases/decrease-stock.use-case';
import {
  Transaction,
  TransactionStatus,
} from '../../domain/transaction.entity';
import {
  TRANSACTION_REPOSITORY,
  type TransactionRepository,
} from '../../domain/transaction.repository';
import {
  TRANSACTION_EVENTS_PORT,
  type TransactionEventsPort,
} from '../ports/transaction-events.port';

export interface UpdateTransactionStatusInput {
  reference: string;
  status: TransactionStatus;
}

// Called by the payment gateway's webhook — looks the transaction up by
// reference, since that's what the gateway echoes back.
@Injectable()
export class UpdateTransactionStatusUseCase {
  private readonly logger = new Logger(UpdateTransactionStatusUseCase.name);

  constructor(
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepository: TransactionRepository,
    private readonly decreaseStockUseCase: DecreaseStockUseCase,
    @Inject(TRANSACTION_EVENTS_PORT)
    private readonly transactionEvents: TransactionEventsPort,
  ) {}

  async execute(
    input: UpdateTransactionStatusInput,
  ): Promise<Result<Transaction, DomainError>> {
    const transaction = await this.transactionRepository.findByReference(
      input.reference,
    );

    if (!transaction) {
      this.logger.warn(
        `Webhook referenced unknown transaction "${input.reference}"`,
      );
      return Result.err(
        new DomainError(
          ErrorCode.TRANSACTION_NOT_FOUND,
          `Transaction with reference "${input.reference}" was not found.`,
          { reference: input.reference },
        ),
      );
    }

    // Already resolved — a duplicate/late webhook delivery, acknowledge as-is.
    if (transaction.status !== TransactionStatus.PENDING) {
      this.logger.warn(
        `Duplicate/late webhook for transaction "${transaction.id}" — already ${transaction.status}`,
      );
      return Result.ok(transaction);
    }

    transaction.resolve(input.status);
    await this.transactionRepository.save(transaction);
    this.logger.log(
      `Transaction "${transaction.id}" (ref "${transaction.reference}") resolved to ${input.status}`,
    );
    this.transactionEvents.publishStatusUpdate(transaction);

    // Stock is only committed once the payment is actually approved — a
    // PENDING/declined transaction never touches inventory.
    if (input.status === TransactionStatus.APPROVED) {
      const stockResult = await this.decreaseStockUseCase.execute(
        transaction.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      );
      if (stockResult.isErr()) {
        // The charge already happened — we can't undo that from here. This
        // needs manual reconciliation; the payment result itself still
        // stands, so this doesn't fail the use case.
        this.logger.error(
          `Stock decrement failed for approved transaction "${transaction.id}": ${stockResult.error.message}`,
        );
      }
    }

    return Result.ok(transaction);
  }
}
