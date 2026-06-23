import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { store } from './app/store.js'
import { injectStore } from './api/client.js'
import { Provider } from 'react-redux'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { injectAdminStore } from './api/adminClient'


injectStore(store)
injectAdminStore(store)


const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID


createRoot(document.getElementById('root')).render(

  <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
    <Provider store={store}>
      <App />
    </Provider>
  </GoogleOAuthProvider>
)
