import { useEffect, useState } from 'react';
import { listProducts } from '../../api/products/products';
import type { ApiError } from '../../api/types';
import type { Product } from '../../api/resources';

interface UseProductsResult {
  products: Product[];
  loading: boolean;
  error: ApiError | null;
}

// Plain component-local state, not Redux — the catalog is always fetched
// fresh, nothing about it needs to survive a refresh.
export function useProducts(): UseProductsResult {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    let cancelled = false;

    listProducts({ limit: 50 })
      .then((page) => {
        if (!cancelled) setProducts(page.items);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err as ApiError);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { products, loading, error };
}
