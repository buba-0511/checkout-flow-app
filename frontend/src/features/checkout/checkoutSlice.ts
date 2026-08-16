import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { createTransaction, getTransaction } from '../../api/transactions/transactions';
import type { ApiError } from '../../api/types';
import {
  TransactionSource,
  TransactionStatus,
  type CustomerInput,
  type DeliveryInput,
  type Product,
  type Transaction,
} from '../../api/resources';

export interface CartLine {
  productId: string;
  name: string;
  priceInCents: number;
  imageUrl: string;
  quantity: number;
}

// Steps 2-4 of the 5-step flow — step 1 is view: 'catalog', step 5 returns to it.
export type CheckoutView = 'catalog' | 'checkout';
export type CheckoutStep = 'details' | 'summary' | 'result';

export interface CheckoutState {
  view: CheckoutView;
  step: CheckoutStep;
  source: TransactionSource | null;
  cart: CartLine[];
  customer: CustomerInput | null;
  delivery: DeliveryInput | null;
  cardToken: string | null;
  installments: number;
  transaction: Transaction | null;
  status: 'idle' | 'submitting' | 'polling' | 'error';
  error: ApiError | null;
}

export const initialState: CheckoutState = {
  view: 'catalog',
  step: 'details',
  source: null,
  cart: [],
  customer: null,
  delivery: null,
  cardToken: null,
  installments: 1,
  transaction: null,
  status: 'idle',
  error: null,
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const POLL_INTERVAL_MS = 2000;
const POLL_MAX_ATTEMPTS = 30;

// Webhook resolution is async — polls our own GET /transactions/:id until
// it's no longer PENDING, or POLL_MAX_ATTEMPTS is reached.
export const pollTransactionUntilResolved = createAsyncThunk<
  Transaction,
  string,
  { rejectValue: ApiError }
>('checkout/pollTransactionUntilResolved', async (transactionId, { rejectWithValue }) => {
  try {
    for (let attempt = 0; attempt < POLL_MAX_ATTEMPTS; attempt++) {
      const transaction = await getTransaction(transactionId);
      if (transaction.status !== TransactionStatus.PENDING) {
        return transaction;
      }
      await sleep(POLL_INTERVAL_MS);
    }
    return await getTransaction(transactionId);
  } catch (err) {
    return rejectWithValue(err as ApiError);
  }
});

export const submitTransaction = createAsyncThunk<
  Transaction,
  void,
  { state: { checkout: CheckoutState }; rejectValue: ApiError }
>('checkout/submitTransaction', async (_, { getState, rejectWithValue, dispatch }) => {
  const { checkout } = getState();
  if (!checkout.customer || !checkout.delivery || !checkout.cardToken || !checkout.source) {
    return rejectWithValue({
      code: 'INCOMPLETE_CHECKOUT',
      message: 'Missing customer, delivery, or payment details.',
    });
  }

  try {
    const transaction = await createTransaction({
      customer: checkout.customer,
      delivery: checkout.delivery,
      items: checkout.cart.map((line) => ({
        productId: line.productId,
        quantity: line.quantity,
      })),
      source: checkout.source,
      paymentMethod: {
        cardToken: checkout.cardToken,
        installments: checkout.installments,
      },
    });
    void dispatch(pollTransactionUntilResolved(transaction.id));
    return transaction;
  } catch (err) {
    return rejectWithValue(err as ApiError);
  }
});

const checkoutSlice = createSlice({
  name: 'checkout',
  initialState,
  reducers: {
    // "Buy now" from a product page — one SKU, quantity chosen there.
    startBuyNow(state, action: PayloadAction<{ product: Product; quantity: number }>) {
      const { product, quantity } = action.payload;
      state.source = TransactionSource.BUY_NOW;
      state.cart = [
        {
          productId: product.id,
          name: product.name,
          priceInCents: product.priceInCents,
          imageUrl: product.imageUrl,
          quantity,
        },
      ];
      state.view = 'checkout';
      state.step = 'details';
    },
    addToCart(state, action: PayloadAction<{ product: Product; quantity: number }>) {
      const { product, quantity } = action.payload;
      const existing = state.cart.find((line) => line.productId === product.id);
      if (existing) {
        existing.quantity += quantity;
      } else {
        state.cart.push({
          productId: product.id,
          name: product.name,
          priceInCents: product.priceInCents,
          imageUrl: product.imageUrl,
          quantity,
        });
      }
    },
    updateCartQuantity(state, action: PayloadAction<{ productId: string; quantity: number }>) {
      const line = state.cart.find((item) => item.productId === action.payload.productId);
      if (line) {
        line.quantity = action.payload.quantity;
      }
    },
    removeFromCart(state, action: PayloadAction<string>) {
      state.cart = state.cart.filter((line) => line.productId !== action.payload);
    },
    startCartCheckout(state) {
      state.source = TransactionSource.CART;
      state.view = 'checkout';
      state.step = 'details';
    },
    setCustomer(state, action: PayloadAction<CustomerInput>) {
      state.customer = action.payload;
    },
    setDelivery(state, action: PayloadAction<DeliveryInput>) {
      state.delivery = action.payload;
    },
    setPaymentMethod(state, action: PayloadAction<{ cardToken: string; installments: number }>) {
      state.cardToken = action.payload.cardToken;
      state.installments = action.payload.installments;
    },
    goToStep(state, action: PayloadAction<CheckoutStep>) {
      state.step = action.payload;
    },
    // Step 5 — back to catalog, clear everything so the next checkout starts fresh.
    resetCheckout() {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(submitTransaction.pending, (state) => {
        state.status = 'submitting';
        state.error = null;
      })
      .addCase(submitTransaction.fulfilled, (state, action) => {
        state.transaction = action.payload;
        state.step = 'result';
        state.status = 'polling';
      })
      .addCase(submitTransaction.rejected, (state, action) => {
        state.status = 'error';
        state.error = action.payload ?? { code: 'UNKNOWN', message: 'Something went wrong.' };
      })
      .addCase(pollTransactionUntilResolved.fulfilled, (state, action) => {
        state.transaction = action.payload;
        state.status = 'idle';
      })
      .addCase(pollTransactionUntilResolved.rejected, (state, action) => {
        state.status = 'error';
        state.error = action.payload ?? { code: 'UNKNOWN', message: 'Something went wrong.' };
      });
  },
});

export const {
  startBuyNow,
  addToCart,
  updateCartQuantity,
  removeFromCart,
  startCartCheckout,
  setCustomer,
  setDelivery,
  setPaymentMethod,
  goToStep,
  resetCheckout,
} = checkoutSlice.actions;

export default checkoutSlice.reducer;
