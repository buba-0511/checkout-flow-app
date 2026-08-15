import { Customer, LegalIdType } from '../../domain/customer.entity';
import { CustomerMapper } from './customer.mapper';
import { CustomerOrmEntity } from './customer.orm-entity';

describe('CustomerMapper', () => {
  describe('toDomain', () => {
    it('maps every field from the ORM entity to the domain entity', () => {
      const orm = new CustomerOrmEntity();
      orm.id = 'c1';
      orm.fullName = 'Jane Doe';
      orm.email = 'jane.doe@example.com';
      orm.phone = '+573001234567';
      orm.legalId = '1234567890';
      orm.legalIdType = LegalIdType.CC;

      const domain = CustomerMapper.toDomain(orm);

      expect(domain).toBeInstanceOf(Customer);
      expect(domain.id).toBe('c1');
      expect(domain.fullName).toBe('Jane Doe');
      expect(domain.email).toBe('jane.doe@example.com');
      expect(domain.phone).toBe('+573001234567');
      expect(domain.legalId).toBe('1234567890');
      expect(domain.legalIdType).toBe(LegalIdType.CC);
    });
  });

  describe('toOrm', () => {
    it('maps every field from the domain entity to the ORM entity', () => {
      const domain = new Customer(
        'c1',
        'Jane Doe',
        'jane.doe@example.com',
        '+573001234567',
        '1234567890',
        LegalIdType.CC,
      );

      const orm = CustomerMapper.toOrm(domain);

      expect(orm).toBeInstanceOf(CustomerOrmEntity);
      expect(orm.id).toBe('c1');
      expect(orm.fullName).toBe('Jane Doe');
      expect(orm.email).toBe('jane.doe@example.com');
      expect(orm.phone).toBe('+573001234567');
      expect(orm.legalId).toBe('1234567890');
      expect(orm.legalIdType).toBe(LegalIdType.CC);
    });
  });
});
