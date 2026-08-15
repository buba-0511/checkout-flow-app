import { useDispatch, useSelector } from 'react-redux'
import type { RootState, AppDispatch } from './store'

// Typed versions of useDispatch/useSelector — use these instead of the
// plain react-redux hooks everywhere in the app.
export const useAppDispatch = useDispatch.withTypes<AppDispatch>()
export const useAppSelector = useSelector.withTypes<RootState>()
