import { configureStore } from '@reduxjs/toolkit'
import authReducer from '../features/auth/authSlice'
import wsReducer from '../features/ws/wsSlice'
import billingReducer from '../features/billing/billingSlice'


export const store = configureStore({
  reducer: {
    auth: authReducer,
    ws: wsReducer,
    billing: billingReducer,
  },
  devTools: import.meta.env.DEV,
})

