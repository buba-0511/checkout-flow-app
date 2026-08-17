import { getRepositoryToken } from '@nestjs/typeorm';
import { Test } from '@nestjs/testing';
import { ProductOrmEntity } from '../product.orm-entity';
import { DUMMY_PRODUCTS } from './product-seed-data';
import { ProductSeederService } from './product-seeder.service';

function createMockRepository() {
  return { count: jest.fn(), save: jest.fn() };
}

describe('ProductSeederService', () => {
  const originalEnv = process.env.PRODUCT_IMAGES_BASE_URL;

  afterEach(() => {
    process.env.PRODUCT_IMAGES_BASE_URL = originalEnv;
  });

  async function setup() {
    const repository = createMockRepository();
    const moduleRef = await Test.createTestingModule({
      providers: [
        ProductSeederService,
        { provide: getRepositoryToken(ProductOrmEntity), useValue: repository },
      ],
    }).compile();

    return {
      repository,
      service: moduleRef.get(ProductSeederService),
    };
  }

  it('seeds the dummy products, resolving both gallery images against PRODUCT_IMAGES_BASE_URL', async () => {
    process.env.PRODUCT_IMAGES_BASE_URL =
      'http://localhost:9002/product-images';
    const { repository, service } = await setup();
    repository.count.mockResolvedValue(0);

    await service.onApplicationBootstrap();

    expect(repository.save).toHaveBeenCalledWith(
      DUMMY_PRODUCTS.map(({ bagImageFilename, beansImageFilename, ...rest }) => ({
        ...rest,
        imageUrls: [
          `http://localhost:9002/product-images/${bagImageFilename}`,
          `http://localhost:9002/product-images/${beansImageFilename}`,
        ],
      })),
    );
  });

  it('does nothing when the table already has rows', async () => {
    const { repository, service } = await setup();
    repository.count.mockResolvedValue(3);

    await service.onApplicationBootstrap();

    expect(repository.save).not.toHaveBeenCalled();
  });

  it('throws if PRODUCT_IMAGES_BASE_URL is not set', async () => {
    delete process.env.PRODUCT_IMAGES_BASE_URL;
    const { repository, service } = await setup();
    repository.count.mockResolvedValue(0);

    await expect(service.onApplicationBootstrap()).rejects.toThrow(
      'PRODUCT_IMAGES_BASE_URL is not set',
    );
  });
});
