import { setAccessToken, clearAuth } from '../../features/auth/authSlice'
import { getSubdomain } from "../../utils/domain"

let isLoggingOut = false

export const setLoggingOut = (value) => {
    isLoggingOut = value
}

let isRefreshing = false
let pendingQueue = []

const resolveQueue = (token) =>
    pendingQueue.forEach(({ resolve }) => resolve(token))

const rejectQueue = (error) =>
    pendingQueue.forEach(({ reject }) => reject(error))

export const authResponseInterceptor = async (_store, api, error) => {

    console.log(error.response?.data)

    if (isLoggingOut) {
        return Promise.reject(error)
    }
    
    const original = error.config

    const is401         = error.response?.status === 401
    const isRetry       = original._retry
    const isRefreshCall = original.url?.includes('/auth/token/refresh/')

    if (!is401 || isRetry || isRefreshCall) {
        return Promise.reject(error)
    }

    if (isRefreshing) {
        return new Promise((resolve, reject) => {
            pendingQueue.push({ resolve, reject })
        }).then((newToken) => {
            original.headers.Authorization = `Bearer ${newToken}`
            return api(original)
        })
    }

    original._retry = true
    isRefreshing    = true

    try {
        const { data } = await api.post('/auth/token/refresh/')
        const newToken = data.access

        _store.dispatch(setAccessToken(newToken))  

        resolveQueue(newToken)

        original.headers.Authorization = `Bearer ${newToken}`
        return api(original)

    } catch (refreshError) {
        rejectQueue(refreshError)

        _store.dispatch(clearAuth())

        if (getSubdomain()) {
            window.location.replace(
                `http://${getSubdomain()}.lvh.me:5173/client-login`
            )
        } else {
            window.location.replace('http://lvh.me:5173/login')
        }

        return Promise.reject(refreshError)

    } finally {
        isRefreshing = false
        pendingQueue = []
    }
}