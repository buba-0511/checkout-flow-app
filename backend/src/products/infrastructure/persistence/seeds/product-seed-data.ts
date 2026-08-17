import { ProductOrmEntity } from '../product.orm-entity';

// Both filenames get resolved to full URLs by ProductSeederService
// (PRODUCT_IMAGES_BASE_URL + filename) — this file stays environment
// -agnostic, and both gallery images are self-hosted (no more external
// Unsplash hotlink for the second slot).
export interface ProductSeedEntry
  extends Omit<ProductOrmEntity, 'id' | 'transactionItems' | 'imageUrls'> {
  bagImageFilename: string;
  beansImageFilename: string;
}

export const DUMMY_PRODUCTS: ProductSeedEntry[] = [
  {
    name: 'Yirgacheffe',
    description:
      'Bright and floral with notes of jasmine, bergamot, and stone fruit. 340g whole bean.',
    priceInCents: 4290000,
    stock: 12,
    bagImageFilename: 'yirgacheffe.webp',
    beansImageFilename: 'yirgacheffe-beans.webp',
    tags: ['Ethiopia', 'Light roast'],
  },
  {
    name: 'Huila Reserve',
    description:
      'Balanced and sweet — caramel, red apple, and a clean cocoa finish. 340g whole bean.',
    priceInCents: 3490000,
    stock: 8,
    bagImageFilename: 'huila-reserve.webp',
    beansImageFilename: 'huila-reserve-beans.webp',
    tags: ['Colombia', 'Medium roast'],
  },
  {
    name: 'Mandheling',
    description:
      'Full-bodied and earthy with dark chocolate, cedar, and molasses. 340g whole bean.',
    priceInCents: 3690000,
    stock: 5,
    bagImageFilename: 'mandheling.webp',
    beansImageFilename: 'mandheling-beans.webp',
    tags: ['Sumatra', 'Dark roast'],
  },
  {
    name: 'Nyeri AA',
    description:
      'Juicy and vibrant — blackcurrant, grapefruit, and brown sugar. 340g whole bean.',
    priceInCents: 4690000,
    stock: 3,
    bagImageFilename: 'nyeri-aa.webp',
    beansImageFilename: 'nyeri-aa-beans.webp',
    tags: ['Kenya', 'Light roast'],
  },
  {
    name: 'Cerrado',
    description:
      'Smooth and nutty with toasted almond, milk chocolate, and honey. 340g whole bean.',
    priceInCents: 3190000,
    stock: 15,
    bagImageFilename: 'cerrado.webp',
    beansImageFilename: 'cerrado-beans.webp',
    tags: ['Brazil', 'Medium-Dark roast'],
  },
  {
    name: 'Antigua',
    description:
      'Rich and rounded — baking spice, dark cherry, and roasted cocoa. 340g whole bean.',
    priceInCents: 3890000,
    stock: 0,
    bagImageFilename: 'antigua.webp',
    beansImageFilename: 'antigua-beans.webp',
    tags: ['Guatemala', 'Medium roast'],
  },
];
