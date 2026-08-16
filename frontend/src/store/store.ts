import { configureStore } from '@reduxjs/toolkit'
import checkoutReducer from '../features/checkout/checkoutSlice'
import { loadPersistedCheckout, persistCheckout } from './persistCheckout'

export const store = configureStore({
  reducer: { checkout: checkoutReducer },
  preloadedState: { checkout: loadPersistedCheckout() },
})

store.subscribe(() => {
  persistCheckout(store.getState().checkout)
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
