import { Inject, Injectable } from '@nestjs/common';
import { Result } from '../../../common/result';
import { DomainError } from '../../../common/errors/domain-error';
import { ErrorCode } from '../../../common/errors/error-code';
import { Transaction, TransactionStatus } from '../../domain/transaction.entity';
import {
  TRANSACTION_REPOSITORY,
  type TransactionRepository,
} from '../../domain/transaction.repository';

export interface UpdateTransactionStatusInput {
  reference: string;
  status: TransactionStatus;
}

// Called by the payment gateway's webhook once it resolves a transaction.
// See [[project-payment-webhook-decision]] — the gateway calls back with
// reference + final status; this use case looks the transaction up by that
// reference (not id, since the gateway only ever echoes the reference it
// was given) and applies the result.
@Injectable()
export class UpdateTransactionStatusUseCase {
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
      return Result.err(
        new DomainError(
          ErrorCode.TRANSACTION_NOT_FOUND,
          `Transaction with reference "${input.reference}" was not found.`,
          { reference: input.reference },
        ),
      );
    }

    // Already resolved — a duplicate or late webhook delivery. Acknowledge
    // without changing state rather than erroring, since retrying a
    // duplicate delivery on our side would never succeed differently.
    if (transaction.status !== TransactionStatus.PENDING) {
      return Result.ok(transaction);
    }

    transaction.resolve(input.status);
    await this.transactionRepository.save(transaction);

    return Result.ok(transaction);
  }
}
