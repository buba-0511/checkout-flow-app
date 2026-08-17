import { Inject, Injectable, Logger } from '@nestjs/common';
import { Result } from '../../../common/result';
import { DomainError } from '../../../common/errors/domain-error';
import { Transaction, TransactionStatus } from '../../domain/transaction.entity';
import {
  PAYMENT_GATEWAY_PORT,
  type PaymentGatewayPort,
} from '../ports/payment-gateway.port';
import { UpdateTransactionStatusUseCase } from './update-transaction-status.use-case';

// Fallback for when the gateway's webhook never arrives (e.g. a
// misconfigured webhook URL on the gateway's side) — pulls the real status
// directly so a transaction doesn't stay PENDING forever. Called
// opportunistically by GetTransactionByIdUseCase on every read.
@Injectable()
export class ReconcileTransactionStatusUseCase {
  private readonly logger = new Logger(ReconcileTransactionStatusUseCase.name);

  constructor(
    @Inject(PAYMENT_GATEWAY_PORT)
    private readonly paymentGateway: PaymentGatewayPort,
    private readonly updateTransactionStatusUseCase: UpdateTransactionStatusUseCase,
  ) {}

  async execute(
    transaction: Transaction,
  ): Promise<Result<Transaction, DomainError>> {
    if (
      transaction.status !== TransactionStatus.PENDING ||
      !transaction.paymentGatewayTransactionId
    ) {
      return Result.ok(transaction);
    }

    let gatewayStatus: TransactionStatus;
    try {
      const gatewayResult = await this.paymentGateway.getTransactionStatus(
        transaction.paymentGatewayTransactionId,
      );
      gatewayStatus = gatewayResult.status as TransactionStatus;
    } catch (err) {
      this.logger.warn(
        `Gateway status poll failed for transaction "${transaction.id}": ${err instanceof Error ? err.message : String(err)}`,
      );
      return Result.ok(transaction);
    }

    if (gatewayStatus === TransactionStatus.PENDING) {
      return Result.ok(transaction);
    }

    this.logger.log(
      `Polled gateway directly and found transaction "${transaction.id}" resolved to ${gatewayStatus} — webhook likely never arrived`,
    );
    return this.updateTransactionStatusUseCase.execute({
      reference: transaction.reference,
      status: gatewayStatus,
    });
  }
}
