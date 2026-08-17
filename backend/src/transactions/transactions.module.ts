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
import {
  PAYMENT_GATEWAY_CONFIG,
  type PaymentGatewayConfig,
} from './infrastructure/payment-gateway/payment-gateway.config';
import { HttpPaymentGatewayAdapter } from './infrastructure/payment-gateway/http-payment-gateway.adapter';
import { WebhookSignatureVerifier } from './infrastructure/payment-gateway/webhook-signature-verifier';
import { TransactionsController } from './infrastructure/http/transactions.controller';
import { TransactionsGateway } from './infrastructure/websocket/transactions.gateway';
import { TRANSACTION_EVENTS_PORT } from './application/ports/transaction-events.port';
import { CreateTransactionUseCase } from './application/use-cases/create-transaction.use-case';
import { GetTransactionByIdUseCase } from './application/use-cases/get-transaction-by-id.use-case';
import { UpdateTransactionStatusUseCase } from './application/use-cases/update-transaction-status.use-case';
import { ReconcileTransactionStatusUseCase } from './application/use-cases/reconcile-transaction-status.use-case';

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
    ReconcileTransactionStatusUseCase,
    WebhookSignatureVerifier,
    TransactionsGateway,
    { provide: TRANSACTION_EVENTS_PORT, useExisting: TransactionsGateway },
    { provide: TRANSACTION_REPOSITORY, useClass: TypeOrmTransactionRepository },
    {
      provide: PAYMENT_GATEWAY_CONFIG,
      useFactory: (): PaymentGatewayConfig => ({
        apiUrl: process.env.PAYMENT_GATEWAY_API_URL!,
        publicKey: process.env.PAYMENT_GATEWAY_PUBLIC_KEY!,
        privateKey: process.env.PAYMENT_GATEWAY_PRIVATE_KEY!,
        integrityKey: process.env.PAYMENT_GATEWAY_INTEGRITY_KEY!,
        eventsKey: process.env.PAYMENT_GATEWAY_EVENTS_KEY!,
      }),
    },
    { provide: PAYMENT_GATEWAY_PORT, useClass: HttpPaymentGatewayAdapter },
  ],
})
export class TransactionsModule {}
