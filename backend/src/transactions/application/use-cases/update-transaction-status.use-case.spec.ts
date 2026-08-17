import { Result } from '../../../common/result';
import { DomainError } from '../../../common/errors/domain-error';
import { ErrorCode } from '../../../common/errors/error-code';
import { Product } from '../../../products/domain/product.entity';
import type { DecreaseStockUseCase } from '../../../products/application/use-cases/decrease-stock.use-case';
import {
  Transaction,
  TransactionItem,
  TransactionSource,
  TransactionStatus,
} from '../../domain/transaction.entity';
import type { TransactionRepository } from '../../domain/transaction.repository';
import type { TransactionEventsPort } from '../ports/transaction-events.port';
import { UpdateTransactionStatusUseCase } from './update-transaction-status.use-case';

function createMockRepository(): jest.Mocked<TransactionRepository> {
  return {
    findById: jest.fn(),
    findByReference: jest.fn(),
    findByIdempotencyKey: jest.fn(),
    save: jest.fn(),
  };
}

function createMockDecreaseStockUseCase() {
  return { execute: jest.fn() } as unknown as jest.Mocked<DecreaseStockUseCase>;
}

function createMockTransactionEvents(): jest.Mocked<TransactionEventsPort> {
  return { publishStatusUpdate: jest.fn() };
}

function makePendingTransaction(): Transaction {
  return Transaction.create({
    id: 't1',
    reference: 'ref-1',
    customerId: 'c1',
    deliveryId: 'd1',
    source: TransactionSource.CART,
    items: [new TransactionItem('i1', 'p1', 2, 1000, 2000)],
    baseFeeInCents: 300,
    deliveryFeeInCents: 700,
  });
}

function setup() {
  const repository = createMockRepository();
  const decreaseStockUseCase = createMockDecreaseStockUseCase();
  const transactionEvents = createMockTransactionEvents();
  decreaseStockUseCase.execute.mockResolvedValue(
    Result.ok([
      new Product('p1', 'Widget', 'A widget.', 1000, 8, ['http://x/1.jpg'], []),
    ]),
  );
  const useCase = new UpdateTransactionStatusUseCase(
    repository,
    decreaseStockUseCase,
    transactionEvents,
  );
  return { repository, decreaseStockUseCase, transactionEvents, useCase };
}

describe('UpdateTransactionStatusUseCase', () => {
  it('resolves a PENDING transaction to APPROVED, persists it, and decrements stock', async () => {
    const { repository, decreaseStockUseCase, transactionEvents, useCase } =
      setup();
    const transaction = makePendingTransaction();
    repository.findByReference.mockResolvedValue(transaction);

    const result = await useCase.execute({
      reference: 'ref-1',
      status: TransactionStatus.APPROVED,
    });

    expect(repository.findByReference).toHaveBeenCalledWith('ref-1');
    expect(result.isOk()).toBe(true);
    expect(result.value.status).toBe(TransactionStatus.APPROVED);
    expect(repository.save).toHaveBeenCalledWith(transaction);
    expect(decreaseStockUseCase.execute).toHaveBeenCalledWith([
      { productId: 'p1', quantity: 2 },
    ]);
    expect(transactionEvents.publishStatusUpdate).toHaveBeenCalledWith(
      transaction,
    );
  });

  it('resolves to DECLINED without touching stock, but still publishes the update', async () => {
    const { repository, decreaseStockUseCase, transactionEvents, useCase } =
      setup();
    const transaction = makePendingTransaction();
    repository.findByReference.mockResolvedValue(transaction);

    const result = await useCase.execute({
      reference: 'ref-1',
      status: TransactionStatus.DECLINED,
    });

    expect(result.isOk()).toBe(true);
    expect(result.value.status).toBe(TransactionStatus.DECLINED);
    expect(decreaseStockUseCase.execute).not.toHaveBeenCalled();
    expect(transactionEvents.publishStatusUpdate).toHaveBeenCalledWith(
      transaction,
    );
  });

  it('still resolves the transaction as approved even if the stock decrement fails', async () => {
    const { repository, decreaseStockUseCase, useCase } = setup();
    const transaction = makePendingTransaction();
    repository.findByReference.mockResolvedValue(transaction);
    decreaseStockUseCase.execute.mockResolvedValue(
      Result.err(
        new DomainError(ErrorCode.STOCK_INSUFFICIENT, 'not enough stock'),
      ),
    );

    const result = await useCase.execute({
      reference: 'ref-1',
      status: TransactionStatus.APPROVED,
    });

    // The charge already happened — can't be undone from here, so the
    // resolved status stands regardless of the stock outcome.
    expect(result.isOk()).toBe(true);
    expect(result.value.status).toBe(TransactionStatus.APPROVED);
  });

  it('returns TRANSACTION_NOT_FOUND when no transaction matches the reference', async () => {
    const { repository, decreaseStockUseCase, transactionEvents, useCase } =
      setup();
    repository.findByReference.mockResolvedValue(null);

    const result = await useCase.execute({
      reference: 'missing',
      status: TransactionStatus.APPROVED,
    });

    expect(result.isErr()).toBe(true);
    expect(result.error.code).toBe(ErrorCode.TRANSACTION_NOT_FOUND);
    expect(repository.save).not.toHaveBeenCalled();
    expect(decreaseStockUseCase.execute).not.toHaveBeenCalled();
    expect(transactionEvents.publishStatusUpdate).not.toHaveBeenCalled();
  });

  it('acknowledges without changing state or touching stock when the transaction is already resolved', async () => {
    const { repository, decreaseStockUseCase, transactionEvents, useCase } =
      setup();
    const transaction = makePendingTransaction();
    transaction.resolve(TransactionStatus.DECLINED);
    repository.findByReference.mockResolvedValue(transaction);

    const result = await useCase.execute({
      reference: 'ref-1',
      status: TransactionStatus.APPROVED,
    });

    expect(result.isOk()).toBe(true);
    expect(result.value.status).toBe(TransactionStatus.DECLINED);
    expect(repository.save).not.toHaveBeenCalled();
    expect(decreaseStockUseCase.execute).not.toHaveBeenCalled();
    expect(transactionEvents.publishStatusUpdate).not.toHaveBeenCalled();
  });
});
