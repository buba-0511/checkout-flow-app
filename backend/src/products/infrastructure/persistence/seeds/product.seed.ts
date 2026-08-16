import { DataSource } from 'typeorm';
import { ProductOrmEntity } from '../product.orm-entity';

// TODO: imageUrl points at Unsplash for now — the S3/MinIO upload module
// doesn't exist yet. Swap these for real uploaded product photos once that's built.
const DUMMY_PRODUCTS: Omit<ProductOrmEntity, 'id'>[] = [
  {
    name: 'Huila Dark Roast',
    description:
      'Full-bodied single-origin from Huila, notes of dark chocolate and toasted nuts. 340g whole bean.',
    priceInCents: 3490000,
    stock: 24,
    imageUrl:
      'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=800&q=75&auto=format&fit=crop',
  },
  {
    name: 'Yirgacheffe Light Roast',
    description:
      'Ethiopian single-origin, bright acidity with notes of jasmine and citrus. 340g whole bean.',
    priceInCents: 4290000,
    stock: 16,
    imageUrl:
      'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&q=75&auto=format&fit=crop',
  },
  {
    name: 'Espresso Blend',
    description:
      'House blend built for espresso — balanced, syrupy body with a cocoa finish. 500g whole bean.',
    priceInCents: 3990000,
    stock: 30,
    imageUrl:
      'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=800&q=75&auto=format&fit=crop',
  },
  {
    name: 'Cold Brew Concentrate',
    description: 'Slow-steeped 18 hours, ready to dilute. 1L bottle, serves up to 6.',
    priceInCents: 2890000,
    stock: 12,
    imageUrl:
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=75&auto=format&fit=crop',
  },
  {
    name: 'Decaf Colombia',
    description:
      'Swiss Water processed, all the flavor without the caffeine. 340g whole bean.',
    priceInCents: 3690000,
    stock: 0,
    imageUrl:
      'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800&q=75&auto=format&fit=crop',
  },
  {
    name: 'Antigua French Press Grind',
    description:
      'Guatemalan beans ground coarse for French press, notes of caramel and spice. 340g.',
    priceInCents: 3790000,
    stock: 4,
    imageUrl:
      'https://images.unsplash.com/photo-1524350876685-274059332603?w=800&q=75&auto=format&fit=crop',
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
