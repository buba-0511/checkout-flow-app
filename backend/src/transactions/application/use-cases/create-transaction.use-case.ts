import { randomUUID } from 'crypto';
import { Inject, Injectable } from '@nestjs/common';
import { Result } from '../../../common/result';
import { DomainError } from '../../../common/errors/domain-error';
import { ErrorCode } from '../../../common/errors/error-code';
import {
  TRANSACTION_MANAGER,
  type TransactionManager,
  runInTransaction,
} from '../../../common/transaction-manager';
import {
  FindOrCreateCustomerUseCase,
  type FindOrCreateCustomerInput,
} from '../../../customers/application/use-cases/find-or-create-customer.use-case';
import { CreateDeliveryUseCase } from '../../../deliveries/application/use-cases/create-delivery.use-case';
import { DecreaseStockUseCase } from '../../../products/application/use-cases/decrease-stock.use-case';
import {
  Transaction,
  TransactionItem,
  TransactionSource,
} from '../../domain/transaction.entity';
import {
  TRANSACTION_REPOSITORY,
  type TransactionRepository,
} from '../../domain/transaction.repository';
import {
  PAYMENT_GATEWAY_PORT,
  type PaymentGatewayPort,
} from '../ports/payment-gateway.port';
import type { Product } from '../../../products/domain/product.entity';

// TODO: placeholder flat fees — replace with real business rules once specified.
const BASE_FEE_IN_CENTS = 500;
const DELIVERY_FEE_IN_CENTS = 1000;

export interface CreateTransactionItemInput {
  productId: string;
  quantity: number;
}

export interface CreateTransactionPaymentMethodInput {
  // Card token from client-side tokenization (browser -> gateway, public
  // key) — raw card data never reaches this backend.
  cardToken: string;
  installments: number;
}

export interface CreateTransactionInput {
  customer: FindOrCreateCustomerInput;
  delivery: {
    address: string;
    city: string;
    region: string;
  };
  items: CreateTransactionItemInput[];
  source: TransactionSource;
  paymentMethod: CreateTransactionPaymentMethodInput;
}

@Injectable()
export class CreateTransactionUseCase {
  constructor(
    @Inject(TRANSACTION_MANAGER)
    private readonly transactionManager: TransactionManager,
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepository: TransactionRepository,
    @Inject(PAYMENT_GATEWAY_PORT)
    private readonly paymentGateway: PaymentGatewayPort,
    private readonly findOrCreateCustomerUseCase: FindOrCreateCustomerUseCase,
    private readonly createDeliveryUseCase: CreateDeliveryUseCase,
    private readonly decreaseStockUseCase: DecreaseStockUseCase,
  ) {}

  async execute(
    input: CreateTransactionInput,
  ): Promise<Result<Transaction, DomainError>> {
    const committed = await runInTransaction(this.transactionManager, async (ctx) => {
      const customerResult = await this.findOrCreateCustomerUseCase.execute(
        input.customer,
        ctx,
      );
      if (customerResult.isErr()) return Result.err(customerResult.error);
      const customer = customerResult.value;

      const deliveryResult = await this.createDeliveryUseCase.execute(
        { customerId: customer.id, ...input.delivery },
        ctx,
      );
      if (deliveryResult.isErr()) return Result.err(deliveryResult.error);
      const delivery = deliveryResult.value;

      const stockResult = await this.decreaseStockUseCase.execute(
        input.items,
        ctx,
      );
      if (stockResult.isErr()) return Result.err(stockResult.error);
      const products = stockResult.value;

      const transaction = Transaction.create({
        id: randomUUID(),
        reference: randomUUID(),
        customerId: customer.id,
        deliveryId: delivery.id,
        source: input.source,
        items: this.buildItems(input.items, products),
        baseFeeInCents: BASE_FEE_IN_CENTS,
        deliveryFeeInCents: DELIVERY_FEE_IN_CENTS,
      });
      await this.transactionRepository.save(transaction, ctx);

      return Result.ok({ transaction, customerEmail: customer.email });
    });

    if (committed.isErr()) {
      return Result.err(committed.error);
    }

    const { transaction, customerEmail } = committed.value;
    try {
      const gatewayOutput = await this.paymentGateway.createTransaction({
        reference: transaction.reference,
        amountInCents: transaction.totalAmountInCents,
        currency: 'COP',
        customerEmail,
        cardToken: input.paymentMethod.cardToken,
        installments: input.paymentMethod.installments,
      });
      transaction.assignPaymentGatewayReference(gatewayOutput.gatewayTransactionId);
      await this.transactionRepository.save(transaction);
    } catch (err) {
      // DB work above already committed — this row stays PENDING, no gatewayTransactionId.
      const message = err instanceof Error ? err.message : String(err);
      return Result.err(
        new DomainError(
          ErrorCode.PAYMENT_GATEWAY_ERROR,
          `Payment gateway request failed for transaction "${transaction.id}": ${message}`,
          { transactionId: transaction.id, reference: transaction.reference },
        ),
      );
    }

    return Result.ok(transaction);
  }

  private buildItems(
    items: CreateTransactionItemInput[],
    products: Product[],
  ): TransactionItem[] {
    return items.map((item) => {
      // DecreaseStockUseCase already validated every item's product exists
      // — this lookup can't miss.
      const product = products.find((p) => p.id === item.productId)!;
      const subtotalInCents = product.priceInCents * item.quantity;
      return new TransactionItem(
        randomUUID(),
        product.id,
        item.quantity,
        product.priceInCents,
        subtotalInCents,
      );
    });
  }
}
