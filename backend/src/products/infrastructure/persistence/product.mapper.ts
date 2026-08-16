import { Product } from '../../domain/product.entity';
import { ProductOrmEntity } from './product.orm-entity';

export class ProductMapper {
  static toDomain(orm: ProductOrmEntity): Product {
    return new Product(
      orm.id,
      orm.name,
      orm.description,
      orm.priceInCents,
      orm.stock,
      orm.imageUrls,
      orm.tags,
    );
  }

  static toOrm(domain: Product): ProductOrmEntity {
    const orm = new ProductOrmEntity();
    orm.id = domain.id;
    orm.name = domain.name;
    orm.description = domain.description;
    orm.priceInCents = domain.priceInCents;
    orm.stock = domain.stock;
    orm.imageUrls = domain.imageUrls;
    orm.tags = domain.tags;
    return orm;
  }
}
