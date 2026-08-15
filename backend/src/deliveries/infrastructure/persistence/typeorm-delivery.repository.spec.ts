import { EntityManager, Repository } from 'typeorm';
import { TypeOrmTransactionContext } from '../../../common/typeorm-transaction-manager';
import { Delivery } from '../../domain/delivery.entity';
import { DeliveryMapper } from './delivery.mapper';
import { DeliveryOrmEntity } from './delivery.orm-entity';
import { TypeOrmDeliveryRepository } from './typeorm-delivery.repository';

function createMockOrmRepo(): jest.Mocked<
  Pick<Repository<DeliveryOrmEntity>, 'findOneBy' | 'save'>
> {
  return {
    findOneBy: jest.fn(),
    save: jest.fn(),
  };
}

function makeOrmEntity(id: string): DeliveryOrmEntity {
  const orm = new DeliveryOrmEntity();
  orm.id = id;
  orm.customerId = 'c1';
  orm.address = 'Calle 123 #45-67';
  orm.city = 'Bogotá';
  orm.region = 'Cundinamarca';
  return orm;
}

describe('TypeOrmDeliveryRepository', () => {
  function setup() {
    const ormRepo = createMockOrmRepo();
    const repository = new TypeOrmDeliveryRepository(
      ormRepo as unknown as Repository<DeliveryOrmEntity>,
    );
    return { ormRepo, repository };
  }

  describe('findById', () => {
    it('returns a mapped Delivery when found', async () => {
      const { ormRepo, repository } = setup();
      ormRepo.findOneBy.mockResolvedValue(makeOrmEntity('d1'));

      const delivery = await repository.findById('d1');

      expect(ormRepo.findOneBy).toHaveBeenCalledWith({ id: 'd1' });
      expect(delivery?.id).toBe('d1');
    });

    it('returns null when not found', async () => {
      const { ormRepo, repository } = setup();
      ormRepo.findOneBy.mockResolvedValue(null);

      expect(await repository.findById('missing')).toBeNull();
    });
  });

  describe('save', () => {
    it('maps the domain delivery to an ORM entity before saving', async () => {
      const { ormRepo, repository } = setup();
      const delivery = new Delivery(
        'd1',
        'c1',
        'Calle 123 #45-67',
        'Bogotá',
        'Cundinamarca',
      );

      await repository.save(delivery);

      expect(ormRepo.save).toHaveBeenCalledWith(DeliveryMapper.toOrm(delivery));
    });

    it('saves through the transactional EntityManager when a ctx is passed', async () => {
      const { ormRepo, repository } = setup();
      const delivery = new Delivery(
        'd1',
        'c1',
        'Calle 123 #45-67',
        'Bogotá',
        'Cundinamarca',
      );
      const txRepo = { save: jest.fn() };
      const manager = {
        getRepository: jest.fn().mockReturnValue(txRepo),
      } as unknown as EntityManager;
      const ctx = new TypeOrmTransactionContext(manager);

      await repository.save(delivery, ctx);

      expect(manager.getRepository).toHaveBeenCalledWith(DeliveryOrmEntity);
      expect(txRepo.save).toHaveBeenCalledWith(DeliveryMapper.toOrm(delivery));
      expect(ormRepo.save).not.toHaveBeenCalled();
    });
  });
});
