import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomersModule } from '../customers/customers.module';
import { DeliveriesModule } from '../deliveries/deliveries.module';
import { ProductsModule } from '../products/products.module';
import { TRANSACTION_REPOSITORY } from './domain/transaction.repository';
import { TransactionOrmEntity } from './infrastructure/persistence/transaction.orm-entity';
import { TransactionItemOrmEntity } from './infrastructure/persistence/transaction-item.orm-entity';
import { TypeOrmTransactionRepository } from './infrastructure/persistence/typeorm-transaction.repository';
import { PAYMENT_GATEWAY_PORT } from './application/ports/payment-gateway.port';
import { StubPaymentGatewayAdapter } from './infrastructure/payment-gateway/stub-payment-gateway.adapter';
import { TransactionsController } from './infrastructure/http/transactions.controller';
import { CreateTransactionUseCase } from './application/use-cases/create-transaction.use-case';
import { GetTransactionByIdUseCase } from './application/use-cases/get-transaction-by-id.use-case';
import { UpdateTransactionStatusUseCase } from './application/use-cases/update-transaction-status.use-case';

@Module({
  imports: [
    TypeOrmModule.forFeature([TransactionOrmEntity, TransactionItemOrmEntity]),
    CustomersModule,
    DeliveriesModule,
    ProductsModule,
  ],
  controllers: [TransactionsController],
  providers: [
    CreateTransactionUseCase,
    GetTransactionByIdUseCase,
    UpdateTransactionStatusUseCase,
    { provide: TRANSACTION_REPOSITORY, useClass: TypeOrmTransactionRepository },
    // TODO: swap for a real adapter once the payment gateway HTTP client is
    // built — see payment-gateway.port.ts and stub-payment-gateway.adapter.ts.
    { provide: PAYMENT_GATEWAY_PORT, useClass: StubPaymentGatewayAdapter },
  ],
})
export class TransactionsModule {}
