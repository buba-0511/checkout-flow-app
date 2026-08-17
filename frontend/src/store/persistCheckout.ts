import { initialState, type CheckoutState } from '../features/checkout/checkoutSlice';
import { TransactionStatus } from '../api/resources';

const STORAGE_KEY = 'checkout-flow-app:checkout';

// Recovers client progress on refresh (test brief requirement). Merges onto
// initialState so an older/partial stored shape can't leave fields undefined.
export function loadPersistedCheckout(): CheckoutState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState;
    const parsed = JSON.parse(raw) as Partial<CheckoutState>;
    const status =
      parsed.transaction?.status === TransactionStatus.PENDING ? 'awaitingResult' : 'idle';
    return { ...initialState, ...parsed, status, error: null };
  } catch {
    return initialState;
  }
}

export function persistCheckout(state: CheckoutState): void {
  const durable = {
    view: state.view,
    step: state.step,
    source: state.source,
    cart: state.cart,
    customer: state.customer,
    delivery: state.delivery,
    cardToken: state.cardToken,
    installments: state.installments,
    transaction: state.transaction,
    idempotencyKey: state.idempotencyKey,
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(durable));
  } catch {
    // Storage unavailable (private browsing, quota) — checkout still
    // works this session, just won't survive a refresh.
  }
}
