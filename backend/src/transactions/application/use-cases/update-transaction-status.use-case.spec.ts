import { ErrorCode } from '../../../common/errors/error-code';
import {
  Transaction,
  TransactionItem,
  TransactionSource,
  TransactionStatus,
} from '../../domain/transaction.entity';
import type { TransactionRepository } from '../../domain/transaction.repository';
import { UpdateTransactionStatusUseCase } from './update-transaction-status.use-case';

function createMockRepository(): jest.Mocked<TransactionRepository> {
  return {
    findById: jest.fn(),
    findByReference: jest.fn(),
    save: jest.fn(),
  };
}

function makePendingTransaction(): Transaction {
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

describe('UpdateTransactionStatusUseCase', () => {
  it('resolves a PENDING transaction to the given status and persists it', async () => {
    const repository = createMockRepository();
    const transaction = makePendingTransaction();
    repository.findByReference.mockResolvedValue(transaction);

    const useCase = new UpdateTransactionStatusUseCase(repository);
    const result = await useCase.execute({
      reference: 'ref-1',
      status: TransactionStatus.APPROVED,
    });

    expect(repository.findByReference).toHaveBeenCalledWith('ref-1');
    expect(result.isOk()).toBe(true);
    expect(result.value.status).toBe(TransactionStatus.APPROVED);
    expect(repository.save).toHaveBeenCalledWith(transaction);
  });

  it('returns TRANSACTION_NOT_FOUND when no transaction matches the reference', async () => {
    const repository = createMockRepository();
    repository.findByReference.mockResolvedValue(null);

    const useCase = new UpdateTransactionStatusUseCase(repository);
    const result = await useCase.execute({
      reference: 'missing',
      status: TransactionStatus.APPROVED,
    });

    expect(result.isErr()).toBe(true);
    expect(result.error.code).toBe(ErrorCode.TRANSACTION_NOT_FOUND);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('acknowledges without changing state when the transaction is already resolved', async () => {
    const repository = createMockRepository();
    const transaction = makePendingTransaction();
    transaction.resolve(TransactionStatus.DECLINED);
    repository.findByReference.mockResolvedValue(transaction);

    const useCase = new UpdateTransactionStatusUseCase(repository);
    const result = await useCase.execute({
      reference: 'ref-1',
      status: TransactionStatus.APPROVED,
    });

    expect(result.isOk()).toBe(true);
    expect(result.value.status).toBe(TransactionStatus.DECLINED);
    expect(repository.save).not.toHaveBeenCalled();
  });
});
