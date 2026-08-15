import { Result } from '../../../common/result';
import { DomainError } from '../../../common/errors/domain-error';
import { ErrorCode } from '../../../common/errors/error-code';
import type { TransactionContext, TransactionManager } from '../../../common/transaction-manager';
import { Customer, LegalIdType } from '../../../customers/domain/customer.entity';
import type { FindOrCreateCustomerUseCase } from '../../../customers/application/use-cases/find-or-create-customer.use-case';
import { Delivery } from '../../../deliveries/domain/delivery.entity';
import type { CreateDeliveryUseCase } from '../../../deliveries/application/use-cases/create-delivery.use-case';
import { Product } from '../../../products/domain/product.entity';
import type { DecreaseStockUseCase } from '../../../products/application/use-cases/decrease-stock.use-case';
import { TransactionSource, TransactionStatus } from '../../domain/transaction.entity';
import type { TransactionRepository } from '../../domain/transaction.repository';
import type { PaymentGatewayPort } from '../ports/payment-gateway.port';
import { CreateTransactionUseCase, type CreateTransactionInput } from './create-transaction.use-case';

function createMockTransactionManager(): jest.Mocked<TransactionManager> {
  return {
    // Runs work immediately against a fake ctx — good enough for unit
    // tests, since runInTransaction's rollback-bridging logic runs for
    // real here; only the actual Postgres transaction is stubbed out.
    run: jest.fn((work: (ctx: TransactionContext) => Promise<unknown>) =>
      work({} as TransactionContext),
    ),
  };
}

function createMockTransactionRepository(): jest.Mocked<TransactionRepository> {
  return {
    findById: jest.fn(),
    findByReference: jest.fn(),
    save: jest.fn(),
  };
}

function createMockPaymentGateway(): jest.Mocked<PaymentGatewayPort> {
  return { createTransaction: jest.fn() };
}

function createMockFindOrCreateCustomerUseCase() {
  return { execute: jest.fn() } as unknown as jest.Mocked<FindOrCreateCustomerUseCase>;
}

function createMockCreateDeliveryUseCase() {
  return { execute: jest.fn() } as unknown as jest.Mocked<CreateDeliveryUseCase>;
}

function createMockDecreaseStockUseCase() {
  return { execute: jest.fn() } as unknown as jest.Mocked<DecreaseStockUseCase>;
}

const customer = new Customer(
  'c1',
  'Jane Doe',
  'jane.doe@example.com',
  '+573001234567',
  '1234567890',
  LegalIdType.CC,
);

const delivery = new Delivery('d1', 'c1', 'Calle 123 #45-67', 'Bogotá', 'Cundinamarca');

const product = new Product('p1', 'Widget', 'A widget.', 1000, 10, 'http://x/1.jpg');

const input: CreateTransactionInput = {
  customer: {
    fullName: 'Jane Doe',
    email: 'jane.doe@example.com',
    phone: '+573001234567',
    legalId: '1234567890',
    legalIdType: LegalIdType.CC,
  },
  delivery: { address: 'Calle 123 #45-67', city: 'Bogotá', region: 'Cundinamarca' },
  items: [{ productId: 'p1', quantity: 2 }],
  source: TransactionSource.CART,
};

function setup() {
  const transactionManager = createMockTransactionManager();
  const transactionRepository = createMockTransactionRepository();
  const paymentGateway = createMockPaymentGateway();
  const findOrCreateCustomerUseCase = createMockFindOrCreateCustomerUseCase();
  const createDeliveryUseCase = createMockCreateDeliveryUseCase();
  const decreaseStockUseCase = createMockDecreaseStockUseCase();

  findOrCreateCustomerUseCase.execute.mockResolvedValue(Result.ok(customer));
  createDeliveryUseCase.execute.mockResolvedValue(Result.ok(delivery));
  decreaseStockUseCase.execute.mockResolvedValue(Result.ok([product]));
  paymentGateway.createTransaction.mockResolvedValue({ gatewayTransactionId: 'gw_123' });

  const useCase = new CreateTransactionUseCase(
    transactionManager,
    transactionRepository,
    paymentGateway,
    findOrCreateCustomerUseCase,
    createDeliveryUseCase,
    decreaseStockUseCase,
  );

  return {
    useCase,
    transactionManager,
    transactionRepository,
    paymentGateway,
    findOrCreateCustomerUseCase,
    createDeliveryUseCase,
    decreaseStockUseCase,
  };
}

describe('CreateTransactionUseCase', () => {
  it('prices items from the real product price, not any client input', async () => {
    const { useCase } = setup();

    const result = await useCase.execute(input);

    expect(result.isOk()).toBe(true);
    expect(result.value.items).toHaveLength(1);
    expect(result.value.items[0].unitPriceInCents).toBe(1000);
    expect(result.value.items[0].subtotalInCents).toBe(2000);
    expect(result.value.subtotalInCents).toBe(2000);
    expect(result.value.status).toBe(TransactionStatus.PENDING);
  });

  it('sends the transaction to the payment gateway after the DB transaction commits, and stores the gateway reference', async () => {
    const { useCase, paymentGateway, transactionRepository } = setup();

    const result = await useCase.execute(input);

    expect(paymentGateway.createTransaction).toHaveBeenCalledWith({
      reference: result.value.reference,
      amountInCents: result.value.totalAmountInCents,
      currency: 'COP',
      customerEmail: 'jane.doe@example.com',
    });
    expect(result.value.paymentGatewayTransactionId).toBe('gw_123');
    // Saved twice: once inside the DB transaction (PENDING, no gateway id),
    // once after, standalone, once the gateway id is known.
    expect(transactionRepository.save).toHaveBeenCalledTimes(2);
  });

  it('passes the same ctx to every write inside the DB transaction', async () => {
    const {
      useCase,
      findOrCreateCustomerUseCase,
      createDeliveryUseCase,
      decreaseStockUseCase,
      transactionRepository,
    } = setup();

    await useCase.execute(input);

    const ctx = findOrCreateCustomerUseCase.execute.mock.calls[0][1];
    expect(ctx).toBeDefined();
    expect(createDeliveryUseCase.execute.mock.calls[0][1]).toBe(ctx);
    expect(decreaseStockUseCase.execute.mock.calls[0][1]).toBe(ctx);
    expect(transactionRepository.save.mock.calls[0][1]).toBe(ctx);
  });

  it('rolls back and returns the error when customer resolution fails, without touching delivery/stock/gateway', async () => {
    const {
      useCase,
      findOrCreateCustomerUseCase,
      createDeliveryUseCase,
      decreaseStockUseCase,
      paymentGateway,
      transactionRepository,
    } = setup();
    findOrCreateCustomerUseCase.execute.mockResolvedValue(
      Result.err(new DomainError(ErrorCode.VALIDATION_ERROR, 'bad input')),
    );

    const result = await useCase.execute(input);

    expect(result.isErr()).toBe(true);
    expect(result.error.code).toBe(ErrorCode.VALIDATION_ERROR);
    expect(createDeliveryUseCase.execute).not.toHaveBeenCalled();
    expect(decreaseStockUseCase.execute).not.toHaveBeenCalled();
    expect(transactionRepository.save).not.toHaveBeenCalled();
    expect(paymentGateway.createTransaction).not.toHaveBeenCalled();
  });

  it('rolls back and returns the error when delivery creation fails, without touching stock/gateway', async () => {
    const {
      useCase,
      createDeliveryUseCase,
      decreaseStockUseCase,
      paymentGateway,
      transactionRepository,
    } = setup();
    createDeliveryUseCase.execute.mockResolvedValue(
      Result.err(new DomainError(ErrorCode.CUSTOMER_NOT_FOUND, 'not found')),
    );

    const result = await useCase.execute(input);

    expect(result.isErr()).toBe(true);
    expect(result.error.code).toBe(ErrorCode.CUSTOMER_NOT_FOUND);
    expect(decreaseStockUseCase.execute).not.toHaveBeenCalled();
    expect(transactionRepository.save).not.toHaveBeenCalled();
    expect(paymentGateway.createTransaction).not.toHaveBeenCalled();
  });

  it('rolls back and returns the error when stock decrement fails, without saving or calling the gateway', async () => {
    const { useCase, decreaseStockUseCase, paymentGateway, transactionRepository } = setup();
    decreaseStockUseCase.execute.mockResolvedValue(
      Result.err(new DomainError(ErrorCode.STOCK_INSUFFICIENT, 'not enough stock')),
    );

    const result = await useCase.execute(input);

    expect(result.isErr()).toBe(true);
    expect(result.error.code).toBe(ErrorCode.STOCK_INSUFFICIENT);
    expect(transactionRepository.save).not.toHaveBeenCalled();
    expect(paymentGateway.createTransaction).not.toHaveBeenCalled();
  });
});
