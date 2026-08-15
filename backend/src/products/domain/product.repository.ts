import { Product } from './product.entity';

export interface FindPageParams {
  // Last product id seen on the previous page. Omit for the first page.
  cursor?: string;
  limit: number;
}

// The port — what the application layer needs from persistence, with zero
// knowledge of TypeORM/Postgres. Implemented by
// infrastructure/persistence/typeorm-product.repository.ts.
export interface ProductRepository {
  // Returns up to `limit + 1` products ordered by id — the extra row is how
  // the caller (ListProductsUseCase) detects whether there's a next page
  // without a separate COUNT query.
  findPage(params: FindPageParams): Promise<Product[]>;
  findById(id: string): Promise<Product | null>;
  findByIds(ids: string[]): Promise<Product[]>;
  save(product: Product): Promise<void>;
  saveMany(products: Product[]): Promise<void>;
}

// DI token — TS interfaces don't exist at runtime, Nest needs something
// concrete to bind the port to an adapter with @Inject/useClass.
export const PRODUCT_REPOSITORY = Symbol('PRODUCT_REPOSITORY');
