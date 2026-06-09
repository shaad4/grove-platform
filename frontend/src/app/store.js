import { configureStore } from '@reduxjs/toolkit'
import authReducer from '../features/auth/authSlice'
import wsReducer from '../features/ws/wsSlice'


export const store = configureStore({
  reducer: {
    auth: authReducer,
    ws: wsReducer,
  },
  devTools: import.meta.env.DEV,
})

