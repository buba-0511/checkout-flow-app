import { Delivery } from '../../domain/delivery.entity';
import { DeliveryMapper } from './delivery.mapper';
import { DeliveryOrmEntity } from './delivery.orm-entity';

describe('DeliveryMapper', () => {
  describe('toDomain', () => {
    it('maps every field from the ORM entity to the domain entity', () => {
      const orm = new DeliveryOrmEntity();
      orm.id = 'd1';
      orm.customerId = 'c1';
      orm.address = 'Calle 123 #45-67';
      orm.city = 'Bogotá';
      orm.region = 'Cundinamarca';

      const domain = DeliveryMapper.toDomain(orm);

      expect(domain).toBeInstanceOf(Delivery);
      expect(domain.id).toBe('d1');
      expect(domain.customerId).toBe('c1');
      expect(domain.address).toBe('Calle 123 #45-67');
      expect(domain.city).toBe('Bogotá');
      expect(domain.region).toBe('Cundinamarca');
    });
  });

  describe('toOrm', () => {
    it('maps every field from the domain entity to the ORM entity', () => {
      const domain = new Delivery(
        'd1',
        'c1',
        'Calle 123 #45-67',
        'Bogotá',
        'Cundinamarca',
      );

      const orm = DeliveryMapper.toOrm(domain);

      expect(orm).toBeInstanceOf(DeliveryOrmEntity);
      expect(orm.id).toBe('d1');
      expect(orm.customer).toEqual({ id: 'c1' });
      expect(orm.address).toBe('Calle 123 #45-67');
      expect(orm.city).toBe('Bogotá');
      expect(orm.region).toBe('Cundinamarca');
    });
  });
});
