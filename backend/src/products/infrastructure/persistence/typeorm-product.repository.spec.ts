import { EntityManager, Repository } from 'typeorm';
import { TypeOrmTransactionContext } from '../../../common/typeorm-transaction-manager';
import { Product } from '../../domain/product.entity';
import { ProductMapper } from './product.mapper';
import { ProductOrmEntity } from './product.orm-entity';
import { TypeOrmProductRepository } from './typeorm-product.repository';

function createMockOrmRepo(): jest.Mocked<
  Pick<Repository<ProductOrmEntity>, 'find' | 'findOneBy' | 'findBy' | 'save'>
> {
  return {
    find: jest.fn(),
    findOneBy: jest.fn(),
    findBy: jest.fn(),
    save: jest.fn(),
  };
}

function makeOrmEntity(id: string, stock = 10): ProductOrmEntity {
  const orm = new ProductOrmEntity();
  orm.id = id;
  orm.name = 'Widget';
  orm.description = 'A widget.';
  orm.priceInCents = 1000;
  orm.stock = stock;
  orm.imageUrls = ['http://x/widget.jpg'];
  return orm;
}

describe('TypeOrmProductRepository', () => {
  function setup() {
    const ormRepo = createMockOrmRepo();
    const repository = new TypeOrmProductRepository(
      ormRepo as unknown as Repository<ProductOrmEntity>,
    );
    return { ormRepo, repository };
  }

  describe('findPage', () => {
    it('maps every entity returned by the ORM to a domain Product', async () => {
      const { ormRepo, repository } = setup();
      ormRepo.find.mockResolvedValue([
        makeOrmEntity('p1'),
        makeOrmEntity('p2'),
      ]);

      const products = await repository.findPage({ limit: 20 });

      expect(products).toHaveLength(2);
      expect(products[0]).toBeInstanceOf(Product);
      expect(products.map((p) => p.id)).toEqual(['p1', 'p2']);
    });

    it('asks for limit + 1 rows ordered by id, with no where clause on the first page', async () => {
      const { ormRepo, repository } = setup();
      ormRepo.find.mockResolvedValue([]);

      await repository.findPage({ limit: 20 });

      expect(ormRepo.find).toHaveBeenCalledWith({
        where: {},
        order: { id: 'ASC' },
        take: 21,
      });
    });

    it('filters by id greater than the cursor on subsequent pages', async () => {
      const { ormRepo, repository } = setup();
      ormRepo.find.mockResolvedValue([]);

      await repository.findPage({ cursor: 'p2', limit: 20 });

      const call = ormRepo.find.mock.calls[0][0]!;
      expect(call.take).toBe(21);
      expect(call.order).toEqual({ id: 'ASC' });
      // MoreThan(...) builds a FindOperator — just check it targets our cursor.
      expect((call.where as { id: { value: string } }).id.value).toBe('p2');
    });
  });

  describe('findById', () => {
    it('returns a mapped Product when found', async () => {
      const { ormRepo, repository } = setup();
      ormRepo.findOneBy.mockResolvedValue(makeOrmEntity('p1'));

      const product = await repository.findById('p1');

      expect(ormRepo.findOneBy).toHaveBeenCalledWith({ id: 'p1' });
      expect(product?.id).toBe('p1');
    });

    it('returns null when not found', async () => {
      const { ormRepo, repository } = setup();
      ormRepo.findOneBy.mockResolvedValue(null);

      const product = await repository.findById('missing');

      expect(product).toBeNull();
    });
  });

  describe('findByIds', () => {
    it('returns an empty array without querying when given no ids', async () => {
      const { ormRepo, repository } = setup();

      const products = await repository.findByIds([]);

      expect(products).toEqual([]);
      expect(ormRepo.findBy).not.toHaveBeenCalled();
    });

    it('maps every matching entity when given ids', async () => {
      const { ormRepo, repository } = setup();
      ormRepo.findBy.mockResolvedValue([
        makeOrmEntity('p1'),
        makeOrmEntity('p2'),
      ]);

      const products = await repository.findByIds(['p1', 'p2']);

      expect(products.map((p) => p.id)).toEqual(['p1', 'p2']);
    });
  });

  describe('save', () => {
    it('maps the domain product to an ORM entity before saving', async () => {
      const { ormRepo, repository } = setup();
      const product = new Product(
        'p1',
        'Widget',
        'A widget.',
        1000,
        10,
        ['http://x/1.jpg'],
        [],
      );

      await repository.save(product);

      expect(ormRepo.save).toHaveBeenCalledWith(ProductMapper.toOrm(product));
    });
  });

  describe('saveMany', () => {
    it('maps every domain product to an ORM entity before saving', async () => {
      const { ormRepo, repository } = setup();
      const products = [
        new Product(
          'p1',
          'Widget',
          'A widget.',
          1000,
          10,
          ['http://x/1.jpg'],
          [],
        ),
        new Product(
          'p2',
          'Gadget',
          'A gadget.',
          2000,
          5,
          ['http://x/2.jpg'],
          [],
        ),
      ];

      await repository.saveMany(products);

      expect(ormRepo.save).toHaveBeenCalledWith(
        products.map((p) => ProductMapper.toOrm(p)),
      );
    });

    it('saves through the transactional EntityManager when a ctx is passed', async () => {
      const { ormRepo, repository } = setup();
      const products = [
        new Product(
          'p1',
          'Widget',
          'A widget.',
          1000,
          10,
          ['http://x/1.jpg'],
          [],
        ),
      ];
      const txRepo = { save: jest.fn() };
      const manager = {
        getRepository: jest.fn().mockReturnValue(txRepo),
      } as unknown as EntityManager;
      const ctx = new TypeOrmTransactionContext(manager);

      await repository.saveMany(products, ctx);

      expect(manager.getRepository).toHaveBeenCalledWith(ProductOrmEntity);
      expect(txRepo.save).toHaveBeenCalledWith(
        products.map((p) => ProductMapper.toOrm(p)),
      );
      expect(ormRepo.save).not.toHaveBeenCalled();
    });
  });
});
