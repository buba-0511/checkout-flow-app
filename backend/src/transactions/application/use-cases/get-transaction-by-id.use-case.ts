import { Inject, Injectable, Logger } from '@nestjs/common';
import { Result } from '../../../common/result';
import { DomainError } from '../../../common/errors/domain-error';
import { ErrorCode } from '../../../common/errors/error-code';
import { Transaction } from '../../domain/transaction.entity';
import {
  TRANSACTION_REPOSITORY,
  type TransactionRepository,
} from '../../domain/transaction.repository';

@Injectable()
export class GetTransactionByIdUseCase {
  private readonly logger = new Logger(GetTransactionByIdUseCase.name);

  constructor(
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepository: TransactionRepository,
  ) {}

  async execute(id: string): Promise<Result<Transaction, DomainError>> {
    const transaction = await this.transactionRepository.findById(id);

    if (!transaction) {
      this.logger.warn(`Transaction "${id}" was not found`);
      return Result.err(
        new DomainError(
          ErrorCode.TRANSACTION_NOT_FOUND,
          `Transaction "${id}" was not found.`,
          { transactionId: id },
        ),
      );
    }

    return Result.ok(transaction);
  }
}
