import { Result } from '../../../common/result';
import { ErrorCode } from '../../../common/errors/error-code';
import {
  Transaction,
  TransactionItem,
  TransactionSource,
} from '../../domain/transaction.entity';
import type { TransactionRepository } from '../../domain/transaction.repository';
import { GetTransactionByIdUseCase } from './get-transaction-by-id.use-case';
import type { ReconcileTransactionStatusUseCase } from './reconcile-transaction-status.use-case';

function createMockRepository(): jest.Mocked<TransactionRepository> {
  return {
    findById: jest.fn(),
    findByReference: jest.fn(),
    save: jest.fn(),
  };
}

function createMockReconciler(): jest.Mocked<ReconcileTransactionStatusUseCase> {
  return {
    execute: jest.fn((transaction) => Promise.resolve(Result.ok(transaction))),
  } as unknown as jest.Mocked<ReconcileTransactionStatusUseCase>;
}

function makeTransaction(): Transaction {
  return Transaction.create({
    id: 't1',
    reference: 'ref-1',
    customerId: 'c1',
    deliveryId: 'd1',
    source: TransactionSource.CART,
    items: [new TransactionItem('i1', 'p1', 1, 1000, 1000)],
    baseFeeInCents: 300,
    deliveryFeeInCents: 700,
  });
}

describe('GetTransactionByIdUseCase', () => {
  it('returns the transaction when it exists, reconciled with the gateway', async () => {
    const repository = createMockRepository();
    const reconciler = createMockReconciler();
    const transaction = makeTransaction();
    repository.findById.mockResolvedValue(transaction);

    const useCase = new GetTransactionByIdUseCase(repository, reconciler);
    const result = await useCase.execute('t1');

    expect(repository.findById).toHaveBeenCalledWith('t1');
    expect(reconciler.execute).toHaveBeenCalledWith(transaction);
    expect(result.isOk()).toBe(true);
    expect(result.value).toBe(transaction);
  });

  it('returns TRANSACTION_NOT_FOUND when it does not exist', async () => {
    const repository = createMockRepository();
    const reconciler = createMockReconciler();
    repository.findById.mockResolvedValue(null);

    const useCase = new GetTransactionByIdUseCase(repository, reconciler);
    const result = await useCase.execute('missing');

    expect(result.isErr()).toBe(true);
    expect(result.error.code).toBe(ErrorCode.TRANSACTION_NOT_FOUND);
    expect(result.error.details).toEqual({ transactionId: 'missing' });
    expect(reconciler.execute).not.toHaveBeenCalled();
  });
});
