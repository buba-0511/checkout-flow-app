import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CUSTOMER_REPOSITORY } from './domain/customer.repository';
import { CustomerOrmEntity } from './infrastructure/persistence/customer.orm-entity';
import { TypeOrmCustomerRepository } from './infrastructure/persistence/typeorm-customer.repository';
import { CustomersController } from './infrastructure/http/customers.controller';
import { FindOrCreateCustomerUseCase } from './application/use-cases/find-or-create-customer.use-case';
import { GetCustomerByIdUseCase } from './application/use-cases/get-customer-by-id.use-case';

@Module({
  imports: [TypeOrmModule.forFeature([CustomerOrmEntity])],
  controllers: [CustomersController],
  providers: [
    FindOrCreateCustomerUseCase,
    GetCustomerByIdUseCase,
    { provide: CUSTOMER_REPOSITORY, useClass: TypeOrmCustomerRepository },
  ],
  exports: [FindOrCreateCustomerUseCase, GetCustomerByIdUseCase],
})
export class CustomersModule {}
