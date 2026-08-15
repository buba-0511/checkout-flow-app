import { Customer } from '../../domain/customer.entity';
import { CustomerOrmEntity } from './customer.orm-entity';

export class CustomerMapper {
  static toDomain(orm: CustomerOrmEntity): Customer {
    return new Customer(
      orm.id,
      orm.fullName,
      orm.email,
      orm.phone,
      orm.legalId,
      orm.legalIdType,
    );
  }

  static toOrm(domain: Customer): CustomerOrmEntity {
    const orm = new CustomerOrmEntity();
    orm.id = domain.id;
    orm.fullName = domain.fullName;
    orm.email = domain.email;
    orm.phone = domain.phone;
    orm.legalId = domain.legalId;
    orm.legalIdType = domain.legalIdType;
    return orm;
  }
}
