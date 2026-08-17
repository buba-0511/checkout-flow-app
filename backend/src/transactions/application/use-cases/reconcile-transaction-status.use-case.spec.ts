import { Result } from '../../../common/result';
import {
  Transaction,
  TransactionItem,
  TransactionSource,
  TransactionStatus,
} from '../../domain/transaction.entity';
import type { PaymentGatewayPort } from '../ports/payment-gateway.port';
import { ReconcileTransactionStatusUseCase } from './reconcile-transaction-status.use-case';
import type { UpdateTransactionStatusUseCase } from './update-transaction-status.use-case';

function createMockPaymentGateway(): jest.Mocked<PaymentGatewayPort> {
  return { createTransaction: jest.fn(), getTransactionStatus: jest.fn() };
}

function createMockUpdateTransactionStatusUseCase() {
  return {
    execute: jest.fn(),
  } as unknown as jest.Mocked<UpdateTransactionStatusUseCase>;
}

function makePendingTransaction(): Transaction {
  const transaction = Transaction.create({
    id: 't1',
    reference: 'ref-1',
    customerId: 'c1',
    deliveryId: 'd1',
    source: TransactionSource.CART,
    items: [new TransactionItem('i1', 'p1', 1, 1000, 1000)],
    baseFeeInCents: 300,
    deliveryFeeInCents: 700,
  });
  transaction.assignPaymentGatewayReference('gw-1');
  return transaction;
}

function setup() {
  const paymentGateway = createMockPaymentGateway();
  const updateTransactionStatusUseCase = createMockUpdateTransactionStatusUseCase();
  const useCase = new ReconcileTransactionStatusUseCase(
    paymentGateway,
    updateTransactionStatusUseCase,
  );
  return { paymentGateway, updateTransactionStatusUseCase, useCase };
}

describe('ReconcileTransactionStatusUseCase', () => {
  it('returns the transaction as-is when it is already resolved, without calling the gateway', async () => {
    const { paymentGateway, useCase } = setup();
    const transaction = makePendingTransaction();
    transaction.resolve(TransactionStatus.APPROVED);

    const result = await useCase.execute(transaction);

    expect(result.isOk()).toBe(true);
    expect(result.value).toBe(transaction);
    expect(paymentGateway.getTransactionStatus).not.toHaveBeenCalled();
  });

  it('returns the transaction as-is when it has no gateway reference yet', async () => {
    const { paymentGateway, useCase } = setup();
    const transaction = Transaction.create({
      id: 't1',
      reference: 'ref-1',
      customerId: 'c1',
      deliveryId: 'd1',
      source: TransactionSource.CART,
      items: [new TransactionItem('i1', 'p1', 1, 1000, 1000)],
      baseFeeInCents: 300,
      deliveryFeeInCents: 700,
    });

    const result = await useCase.execute(transaction);

    expect(result.isOk()).toBe(true);
    expect(paymentGateway.getTransactionStatus).not.toHaveBeenCalled();
  });

  it('returns the transaction unchanged when the gateway still reports PENDING', async () => {
    const { paymentGateway, updateTransactionStatusUseCase, useCase } = setup();
    const transaction = makePendingTransaction();
    paymentGateway.getTransactionStatus.mockResolvedValue({ status: 'PENDING' });

    const result = await useCase.execute(transaction);

    expect(paymentGateway.getTransactionStatus).toHaveBeenCalledWith('gw-1');
    expect(result.isOk()).toBe(true);
    expect(result.value).toBe(transaction);
    expect(updateTransactionStatusUseCase.execute).not.toHaveBeenCalled();
  });

  it('resolves the transaction via UpdateTransactionStatusUseCase when the gateway reports a final status', async () => {
    const { paymentGateway, updateTransactionStatusUseCase, useCase } = setup();
    const transaction = makePendingTransaction();
    paymentGateway.getTransactionStatus.mockResolvedValue({ status: 'APPROVED' });
    const resolved = makePendingTransaction();
    resolved.resolve(TransactionStatus.APPROVED);
    updateTransactionStatusUseCase.execute.mockResolvedValue(Result.ok(resolved));

    const result = await useCase.execute(transaction);

    expect(updateTransactionStatusUseCase.execute).toHaveBeenCalledWith({
      reference: 'ref-1',
      status: 'APPROVED',
    });
    expect(result.isOk()).toBe(true);
    expect(result.value.status).toBe(TransactionStatus.APPROVED);
  });

  it('returns the transaction unchanged when the gateway call itself fails', async () => {
    const { paymentGateway, updateTransactionStatusUseCase, useCase } = setup();
    const transaction = makePendingTransaction();
    paymentGateway.getTransactionStatus.mockRejectedValue(new Error('network error'));

    const result = await useCase.execute(transaction);

    expect(result.isOk()).toBe(true);
    expect(result.value).toBe(transaction);
    expect(updateTransactionStatusUseCase.execute).not.toHaveBeenCalled();
  });
});
