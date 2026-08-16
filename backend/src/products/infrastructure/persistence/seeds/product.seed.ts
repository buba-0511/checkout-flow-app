import { DataSource } from 'typeorm';
import { ProductOrmEntity } from '../product.orm-entity';

// imageUrls point at Unsplash stock photography of loose roasted whole
// beans — the AI-generated packaging labels were unreliable (every bag read
// "Ethiopia"), and mixed subjects (latte art, brewing gear) didn't match a
// whole-bean product. No S3/MinIO upload module exists yet.
//
// TODO: each product only has one real photo today, repeated 5x as a
// placeholder gallery. Swap in the 5 generated shots (hero/close-up/angle/
// flat-lay/lifestyle) per product once they exist.
function placeholderGallery(url: string): string[] {
  return Array.from({ length: 5 }, () => url);
}

const DUMMY_PRODUCTS: Omit<ProductOrmEntity, 'id'>[] = [
  {
    name: 'Yirgacheffe',
    description:
      'Bright and floral with notes of jasmine, bergamot, and stone fruit. 340g whole bean.',
    priceInCents: 4290000,
    stock: 12,
    imageUrls: placeholderGallery(
      'https://images.unsplash.com/photo-1580933073521-dc49ac0d4e6a?w=800&q=75&auto=format&fit=crop',
    ),
    tags: ['Ethiopia', 'Light roast'],
  },
  {
    name: 'Huila Reserve',
    description:
      'Balanced and sweet — caramel, red apple, and a clean cocoa finish. 340g whole bean.',
    priceInCents: 3490000,
    stock: 8,
    imageUrls: placeholderGallery(
      'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=800&q=75&auto=format&fit=crop',
    ),
    tags: ['Colombia', 'Medium roast'],
  },
  {
    name: 'Mandheling',
    description:
      'Full-bodied and earthy with dark chocolate, cedar, and molasses. 340g whole bean.',
    priceInCents: 3690000,
    stock: 5,
    imageUrls: placeholderGallery(
      'https://images.unsplash.com/photo-1612487458970-564127ec86f5?w=800&q=75&auto=format&fit=crop',
    ),
    tags: ['Sumatra', 'Dark roast'],
  },
  {
    name: 'Nyeri AA',
    description:
      'Juicy and vibrant — blackcurrant, grapefruit, and brown sugar. 340g whole bean.',
    priceInCents: 4690000,
    stock: 3,
    imageUrls: placeholderGallery(
      'https://images.unsplash.com/photo-1606486544554-164d98da4889?w=800&q=75&auto=format&fit=crop',
    ),
    tags: ['Kenya', 'Light roast'],
  },
  {
    name: 'Cerrado',
    description:
      'Smooth and nutty with toasted almond, milk chocolate, and honey. 340g whole bean.',
    priceInCents: 3190000,
    stock: 15,
    imageUrls: placeholderGallery(
      'https://images.unsplash.com/photo-1620820186187-fc32e79adb74?w=800&q=75&auto=format&fit=crop',
    ),
    tags: ['Brazil', 'Medium-Dark roast'],
  },
  {
    name: 'Antigua',
    description:
      'Rich and rounded — baking spice, dark cherry, and roasted cocoa. 340g whole bean.',
    priceInCents: 3890000,
    stock: 0,
    imageUrls: placeholderGallery(
      'https://images.unsplash.com/photo-1675306408031-a9aad9f23308?w=800&q=75&auto=format&fit=crop',
    ),
    tags: ['Guatemala', 'Medium roast'],
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
