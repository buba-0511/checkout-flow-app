import { DataSource } from 'typeorm';
import { ProductOrmEntity } from '../product.orm-entity';

// TODO: imageUrl points at the eventual MinIO/S3 path convention, but
// nothing uploads these images yet — the S3 client module doesn't exist
// yet. Swap these for real uploaded URLs once that's built.
const DUMMY_PRODUCTS: Omit<ProductOrmEntity, 'id'>[] = [
  {
    name: 'Wireless Headphones',
    description:
      'Noise-cancelling over-ear headphones with 30-hour battery life.',
    priceInCents: 12999,
    stock: 25,
    imageUrl: 'http://localhost:9000/product-images/wireless-headphones.jpg',
  },
  {
    name: 'Mechanical Keyboard',
    description: 'Compact 75% mechanical keyboard with hot-swappable switches.',
    priceInCents: 8999,
    stock: 15,
    imageUrl: 'http://localhost:9000/product-images/mechanical-keyboard.jpg',
  },
  {
    name: 'USB-C Hub',
    description:
      '7-in-1 USB-C hub with HDMI, SD card reader, and 100W passthrough.',
    priceInCents: 4499,
    stock: 40,
    imageUrl: 'http://localhost:9000/product-images/usb-c-hub.jpg',
  },
  {
    name: 'Portable SSD 1TB',
    description: 'Rugged 1TB external SSD, USB 3.2 Gen 2, up to 1050MB/s.',
    priceInCents: 10999,
    stock: 18,
    imageUrl: 'http://localhost:9000/product-images/portable-ssd.jpg',
  },
  {
    name: 'Webcam 1080p',
    description: 'Full HD webcam with autofocus and built-in privacy shutter.',
    priceInCents: 3999,
    stock: 0,
    imageUrl: 'http://localhost:9000/product-images/webcam.jpg',
  },
];

async function seed() {
  const dataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    // Glob, not [ProductOrmEntity] — ProductOrmEntity now has a @OneToMany
    // back to TransactionItemOrmEntity, and TypeORM needs every entity on
    // both sides of a relation registered on the same DataSource to build
    // its metadata, even in this standalone script.
    entities: [__dirname + '/../../../../**/*.orm-entity{.ts,.js}'],
  });

  await dataSource.initialize();
  const repo = dataSource.getRepository(ProductOrmEntity);

  const existingCount = await repo.count();
  if (existingCount > 0) {
    console.log(
      `products table already has ${existingCount} row(s) — skipping seed.`,
    );
    await dataSource.destroy();
    return;
  }

  await repo.save(DUMMY_PRODUCTS);
  console.log(`Seeded ${DUMMY_PRODUCTS.length} products.`);
  await dataSource.destroy();
}

seed().catch((err: unknown) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
