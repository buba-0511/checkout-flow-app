import { useEffect, useState } from 'react';
import { getProduct } from '../../api/products/products';
import type { ApiError } from '../../api/types';
import type { Product } from '../../api/resources';

interface UseProductResult {
  product: Product | null;
  loading: boolean;
  error: ApiError | null;
}

interface FetchedFor {
  id: string;
  product: Product | null;
  error: ApiError | null;
}

// Component-local state, not Redux — re-fetches whenever id changes (e.g.
// navigating directly from one product page to another). loading is derived
// by comparing the id a result was fetched for against the current id,
// rather than tracked as its own state — avoids resetting state
// synchronously inside the effect on every id change.
export function useProduct(id: string): UseProductResult {
  const [fetched, setFetched] = useState<FetchedFor>({ id: '', product: null, error: null });

  useEffect(() => {
    let cancelled = false;

    getProduct(id)
      .then((product) => {
        if (!cancelled) setFetched({ id, product, error: null });
      })
      .catch((err: unknown) => {
        if (!cancelled) setFetched({ id, product: null, error: err as ApiError });
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const loading = fetched.id !== id;
  return {
    product: loading ? null : fetched.product,
    loading,
    error: loading ? null : fetched.error,
  };
}
