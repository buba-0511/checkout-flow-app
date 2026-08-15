import { Result } from '../../../common/result';
import { DomainError } from '../../../common/errors/domain-error';
import { ErrorCode } from '../../../common/errors/error-code';
import { ApiException } from '../../../common/errors/api-exception';
import {
  Transaction,
  TransactionItem,
  TransactionSource,
  TransactionStatus,
} from '../../domain/transaction.entity';
import { CreateTransactionUseCase } from '../../application/use-cases/create-transaction.use-case';
import { GetTransactionByIdUseCase } from '../../application/use-cases/get-transaction-by-id.use-case';
import { UpdateTransactionStatusUseCase } from '../../application/use-cases/update-transaction-status.use-case';
import { TransactionsController } from './transactions.controller';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { LegalIdType } from '../../../customers/domain/customer.entity';

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

describe('TransactionsController', () => {
  function setup() {
    const createTransactionUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<CreateTransactionUseCase>;
    const getTransactionByIdUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<GetTransactionByIdUseCase>;
    const updateTransactionStatusUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<UpdateTransactionStatusUseCase>;

    const controller = new TransactionsController(
      createTransactionUseCase,
      getTransactionByIdUseCase,
      updateTransactionStatusUseCase,
    );
    return {
      controller,
      createTransactionUseCase,
      getTransactionByIdUseCase,
      updateTransactionStatusUseCase,
    };
  }

  const dto: CreateTransactionDto = {
    customer: {
      fullName: 'Jane Doe',
      email: 'jane.doe@example.com',
      phone: '+573001234567',
      legalId: '1234567890',
      legalIdType: LegalIdType.CC,
    },
    delivery: { address: 'Calle 123 #45-67', city: 'Bogotá', region: 'Cundinamarca' },
    items: [{ productId: 'p1', quantity: 1 }],
    source: TransactionSource.CART,
  };

  describe('create', () => {
    it('maps the resulting transaction to a response DTO', async () => {
      const { controller, createTransactionUseCase } = setup();
      createTransactionUseCase.execute.mockResolvedValue(Result.ok(makeTransaction()));

      const result = await controller.create(dto);

      expect(createTransactionUseCase.execute).toHaveBeenCalledWith(dto);
      expect(result.id).toBe('t1');
    });
  });

  describe('findOne', () => {
    it('returns the mapped transaction when found', async () => {
      const { controller, getTransactionByIdUseCase } = setup();
      getTransactionByIdUseCase.execute.mockResolvedValue(Result.ok(makeTransaction()));

      const result = await controller.findOne('t1');

      expect(getTransactionByIdUseCase.execute).toHaveBeenCalledWith('t1');
      expect(result.id).toBe('t1');
    });

    it('throws an ApiException when the use case returns an error', async () => {
      const { controller, getTransactionByIdUseCase } = setup();
      getTransactionByIdUseCase.execute.mockResolvedValue(
        Result.err(
          new DomainError(ErrorCode.TRANSACTION_NOT_FOUND, 'Transaction "missing" was not found.'),
        ),
      );

      await expect(controller.findOne('missing')).rejects.toBeInstanceOf(ApiException);
    });
  });

  describe('handleWebhook', () => {
    it('applies the status update and returns the mapped transaction', async () => {
      const { controller, updateTransactionStatusUseCase } = setup();
      const transaction = makeTransaction();
      transaction.resolve(TransactionStatus.APPROVED);
      updateTransactionStatusUseCase.execute.mockResolvedValue(Result.ok(transaction));
      const webhookDto = { reference: 'ref-1', status: TransactionStatus.APPROVED };

      const result = await controller.handleWebhook(webhookDto);

      expect(updateTransactionStatusUseCase.execute).toHaveBeenCalledWith(webhookDto);
      expect(result.status).toBe(TransactionStatus.APPROVED);
    });

    it('throws an ApiException when no transaction matches the reference', async () => {
      const { controller, updateTransactionStatusUseCase } = setup();
      updateTransactionStatusUseCase.execute.mockResolvedValue(
        Result.err(
          new DomainError(
            ErrorCode.TRANSACTION_NOT_FOUND,
            'Transaction with reference "missing" was not found.',
          ),
        ),
      );

      await expect(
        controller.handleWebhook({ reference: 'missing', status: TransactionStatus.APPROVED }),
      ).rejects.toBeInstanceOf(ApiException);
    });
  });
});
