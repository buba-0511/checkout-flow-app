import { api } from '../api';
import type { Product, ProductPage } from '../resources';

export function listProducts(params?: { cursor?: string; limit?: number }): Promise<ProductPage> {
  return api.get<ProductPage>('/products', { params });
}

export function getProduct(id: string): Promise<Product> {
  return api.get<Product>(`/products/${id}`);
}
