import { Global, Module } from '@nestjs/common';
import { TRANSACTION_MANAGER } from './transaction-manager';
import { TypeOrmTransactionManager } from './typeorm-transaction-manager';

// @Global() so every feature module can @Inject(TRANSACTION_MANAGER)
// without each one importing CommonModule explicitly — same rationale as
// TypeOrmModule.forRoot() being registered once in AppModule.
@Global()
@Module({
  providers: [
    { provide: TRANSACTION_MANAGER, useClass: TypeOrmTransactionManager },
  ],
  exports: [TRANSACTION_MANAGER],
})
export class CommonModule {}
