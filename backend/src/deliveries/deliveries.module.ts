import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomersModule } from '../customers/customers.module';
import { DELIVERY_REPOSITORY } from './domain/delivery.repository';
import { DeliveryOrmEntity } from './infrastructure/persistence/delivery.orm-entity';
import { TypeOrmDeliveryRepository } from './infrastructure/persistence/typeorm-delivery.repository';
import { DeliveriesController } from './infrastructure/http/deliveries.controller';
import { CreateDeliveryUseCase } from './application/use-cases/create-delivery.use-case';
import { GetDeliveryByIdUseCase } from './application/use-cases/get-delivery-by-id.use-case';

@Module({
  imports: [TypeOrmModule.forFeature([DeliveryOrmEntity]), CustomersModule],
  controllers: [DeliveriesController],
  providers: [
    CreateDeliveryUseCase,
    GetDeliveryByIdUseCase,
    { provide: DELIVERY_REPOSITORY, useClass: TypeOrmDeliveryRepository },
  ],
  exports: [CreateDeliveryUseCase, GetDeliveryByIdUseCase],
})
export class DeliveriesModule {}
