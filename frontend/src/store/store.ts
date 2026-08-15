import { configureStore } from '@reduxjs/toolkit'

// Empty until the checkout flow's state shape is designed (cart, card/delivery
// form, transaction reference — see README's Architecture section). Slices
// get added here as each piece of the 5-step flow is built.
export const store = configureStore({
  reducer: {},
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
