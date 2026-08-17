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
  // Snapshotted at add-time, same as priceInCents — the stepper's max bound
  // in the cart sheet doesn't need a fresh product fetch.
  stock: number;
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
  // Desktop nav cart icon / mobile floating bar both open this same sheet.
  cartSheetOpen: boolean;
  customer: CustomerInput | null;
  delivery: DeliveryInput | null;
  cardToken: string | null;
  // Display-only, from the tokenization response — never the full PAN.
  cardBrand: string | null;
  cardLastFour: string | null;
  installments: number;
  transaction: Transaction | null;
  status: 'idle' | 'submitting' | 'awaitingResult' | 'error';
  error: ApiError | null;
  idempotencyKey: string | null;
}

export const initialState: CheckoutState = {
  view: 'catalog',
  step: 'details',
  source: null,
  cart: [],
  cartSheetOpen: false,
  customer: null,
  delivery: null,
  cardToken: null,
  cardBrand: null,
  cardLastFour: null,
  installments: 1,
  transaction: null,
  status: 'idle',
  error: null,
  idempotencyKey: null,
};

// Shared by the socket push and the catch-up fetch below — a snapshot that's
// still PENDING means the payment hasn't actually resolved yet, so keep
// waiting instead of prematurely leaving the "awaitingResult" state.
function applyTransactionSnapshot(state: CheckoutState, transaction: Transaction): void {
  state.transaction = transaction;
  state.status = transaction.status === TransactionStatus.PENDING ? 'awaitingResult' : 'idle';
}

// Webhook resolution is pushed live over the transactions socket (see
// lib/socket.ts + CheckoutResultPage), which also polls this on an
// interval as a fallback — the backend reconciles with the gateway
// directly on each read, so this resolves even if the webhook never
// arrives.
export const syncTransactionStatus = createAsyncThunk<
  Transaction,
  string,
  { rejectValue: ApiError }
>('checkout/syncTransactionStatus', async (transactionId, { rejectWithValue }) => {
  try {
    return await getTransaction(transactionId);
  } catch (err) {
    return rejectWithValue(err as ApiError);
  }
});

export const submitTransaction = createAsyncThunk<
  Transaction,
  void,
  { state: { checkout: CheckoutState }; rejectValue: ApiError }
>('checkout/submitTransaction', async (_, { getState, rejectWithValue }) => {
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
      idempotencyKey: checkout.idempotencyKey ?? undefined,
    });
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
      state.cartSheetOpen = false;
      state.cart = [
        {
          productId: product.id,
          name: product.name,
          priceInCents: product.priceInCents,
          imageUrl: product.imageUrls[0],
          stock: product.stock,
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
        existing.stock = product.stock;
      } else {
        state.cart.push({
          productId: product.id,
          name: product.name,
          priceInCents: product.priceInCents,
          imageUrl: product.imageUrls[0],
          stock: product.stock,
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
      state.cartSheetOpen = false;
      state.view = 'checkout';
      state.step = 'details';
    },
    openCartSheet(state) {
      state.cartSheetOpen = true;
    },
    closeCartSheet(state) {
      state.cartSheetOpen = false;
    },
    setCustomer(state, action: PayloadAction<CustomerInput>) {
      state.customer = action.payload;
    },
    setDelivery(state, action: PayloadAction<DeliveryInput>) {
      state.delivery = action.payload;
    },
    setPaymentMethod(
      state,
      action: PayloadAction<{
        cardToken: string;
        cardBrand: string;
        cardLastFour: string;
        installments: number;
      }>,
    ) {
      state.cardToken = action.payload.cardToken;
      state.cardBrand = action.payload.cardBrand;
      state.cardLastFour = action.payload.cardLastFour;
      state.installments = action.payload.installments;
    },
    goToStep(state, action: PayloadAction<CheckoutStep>) {
      state.step = action.payload;
    },
    // Pushed by the transactions socket once the webhook resolves the
    // payment — see lib/socket.ts + CheckoutResultPage.
    transactionStatusUpdated(state, action: PayloadAction<Transaction>) {
      applyTransactionSnapshot(state, action.payload);
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
        // Reused on a reload/retry of this same attempt; a fresh one is
        // generated once this attempt resolves (see fulfilled below).
        state.idempotencyKey ??= crypto.randomUUID();
      })
      .addCase(submitTransaction.fulfilled, (state, action) => {
        state.transaction = action.payload;
        state.step = 'result';
        state.status = 'awaitingResult';
        state.idempotencyKey = null;
      })
      .addCase(submitTransaction.rejected, (state, action) => {
        state.status = 'error';
        state.error = action.payload ?? { code: 'UNKNOWN', message: 'Something went wrong.' };
      })
      .addCase(syncTransactionStatus.fulfilled, (state, action) => {
        applyTransactionSnapshot(state, action.payload);
      })
      .addCase(syncTransactionStatus.rejected, (state, action) => {
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
  openCartSheet,
  closeCartSheet,
  setCustomer,
  setDelivery,
  setPaymentMethod,
  goToStep,
  transactionStatusUpdated,
  resetCheckout,
} = checkoutSlice.actions;

export default checkoutSlice.reducer;
