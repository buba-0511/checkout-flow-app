import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { TerminusModule } from '@nestjs/terminus';
import { ProductsModule } from './products/products.module';
import { CustomersModule } from './customers/customers.module';
import { DeliveriesModule } from './deliveries/deliveries.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      autoLoadEntities: true,
      synchronize: process.env.NODE_ENV !== 'production',
    }),
    TerminusModule,
    ProductsModule,
    CustomersModule,
    DeliveriesModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
