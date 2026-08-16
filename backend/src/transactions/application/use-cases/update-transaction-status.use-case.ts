import { Inject, Injectable, Logger } from '@nestjs/common';
import { Result } from '../../../common/result';
import { DomainError } from '../../../common/errors/domain-error';
import { ErrorCode } from '../../../common/errors/error-code';
import {
  Transaction,
  TransactionStatus,
} from '../../domain/transaction.entity';
import {
  TRANSACTION_REPOSITORY,
  type TransactionRepository,
} from '../../domain/transaction.repository';

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

    return Result.ok(transaction);
  }
}
