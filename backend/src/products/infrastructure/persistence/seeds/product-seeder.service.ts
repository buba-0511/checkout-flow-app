import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductOrmEntity } from '../product.orm-entity';
import { DUMMY_PRODUCTS } from './product-seed-data';


@Injectable()
export class ProductSeederService implements OnApplicationBootstrap {
  private readonly logger = new Logger(ProductSeederService.name);

  constructor(
    @InjectRepository(ProductOrmEntity)
    private readonly repository: Repository<ProductOrmEntity>,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const existingCount = await this.repository.count();
    if (existingCount > 0) {
      this.logger.log(
        `products table already has ${existingCount} row(s) — skipping seed.`,
      );
      return;
    }

    // Browser-facing base URL for both gallery images — MinIO locally,
    // the product-images CloudFront path in production. Set by whoever
    // wires up this environment; no fallback, since a broken image is
    // easy to miss but a startup crash on a missing env var is not.
    const imagesBaseUrl = process.env.PRODUCT_IMAGES_BASE_URL;
    if (!imagesBaseUrl) {
      throw new Error(
        'PRODUCT_IMAGES_BASE_URL is not set — cannot seed product images.',
      );
    }

    const products = DUMMY_PRODUCTS.map(
      ({ bagImageFilename, beansImageFilename, ...rest }) => ({
        ...rest,
        imageUrls: [
          `${imagesBaseUrl}/${bagImageFilename}`,
          `${imagesBaseUrl}/${beansImageFilename}`,
        ],
      }),
    );

    await this.repository.save(products);
    this.logger.log(`Seeded ${products.length} products.`);
  }
}
