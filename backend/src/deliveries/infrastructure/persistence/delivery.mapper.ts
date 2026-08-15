import { CustomerOrmEntity } from '../../../customers/infrastructure/persistence/customer.orm-entity';
import { Delivery } from '../../domain/delivery.entity';
import { DeliveryOrmEntity } from './delivery.orm-entity';

export class DeliveryMapper {
  static toDomain(orm: DeliveryOrmEntity): Delivery {
    return new Delivery(
      orm.id,
      orm.customerId,
      orm.address,
      orm.city,
      orm.region,
    );
  }

  static toOrm(domain: Delivery): DeliveryOrmEntity {
    const orm = new DeliveryOrmEntity();
    orm.id = domain.id;
    // A bare { id } stub is enough for TypeORM to write the FK column —
    // it does not trigger a SELECT or cascade into Customer.
    orm.customer = { id: domain.customerId } as CustomerOrmEntity;
    orm.address = domain.address;
    orm.city = domain.city;
    orm.region = domain.region;
    return orm;
  }
}
