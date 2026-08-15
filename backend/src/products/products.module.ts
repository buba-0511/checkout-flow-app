import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PRODUCT_REPOSITORY } from './domain/product.repository';
import { ProductOrmEntity } from './infrastructure/persistence/product.orm-entity';
import { TypeOrmProductRepository } from './infrastructure/persistence/typeorm-product.repository';
import { ProductsController } from './infrastructure/http/products.controller';
import { StockController } from './infrastructure/http/stock.controller';
import { ListProductsUseCase } from './application/use-cases/list-products.use-case';
import { GetProductByIdUseCase } from './application/use-cases/get-product-by-id.use-case';
import { GetStockUseCase } from './application/use-cases/get-stock.use-case';
import { DecreaseStockUseCase } from './application/use-cases/decrease-stock.use-case';

@Module({
  imports: [TypeOrmModule.forFeature([ProductOrmEntity])],
  controllers: [ProductsController, StockController],
  providers: [
    ListProductsUseCase,
    GetProductByIdUseCase,
    GetStockUseCase,
    DecreaseStockUseCase,
    { provide: PRODUCT_REPOSITORY, useClass: TypeOrmProductRepository },
  ],
  // DecreaseStockUseCase will be called by the transactions module once
  // it exists, when a payment is confirmed.
  exports: [DecreaseStockUseCase],
})
export class ProductsModule {}
