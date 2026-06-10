import {
  createContext,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { useSelector } from 'react-redux'
 
import dashboardApi from '../api/dashboard.api'
import { useAuth } from './AuthContext'
import { selectAccessToken } from '../features/auth/authSlice'

import { useDispatch } from 'react-redux'
import { setStatus, removeConnection } from '../features/ws/wsSlice'
 
export const BadgeContext = createContext(null)



// tiny audio notify 
function playNotificationSound() {
  try {
    // if (document.hidden) return -- beep audio on all tabs
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(880, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.08)
    gain.gain.setValueAtTime(0.18, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.12)
    osc.onended = () => ctx.close()
  } catch {
    // AudioContext blocked — silently skip
  }
}


export function BadgeProvider({ children }) {
  const { user } = useAuth()
  const accessToken = useSelector(selectAccessToken)
  const dispatch = useDispatch()
 
  // sidebar badges (clients / requests counts)
  const [badges, setBadges] = useState({ clients: 0, requests: 0 })
  const [loading, setLoading] = useState(false)
 
  // notification bell unread count
  const [unreadCount, setUnreadCount] = useState(0)
 
  // shared notification list (bell dropdown reads this)
  const [notifications, setNotifications] = useState([])
  const [notifLoaded, setNotifLoaded] = useState(false)
 
  // callbacks registered by consumers (e.g. LiveFeed)
  const activityListenersRef = useRef([])
 
  // ── Sidebar badges polling ─────────────────────────────────────────────────
  const loadBadges = useCallback(async () => {
    if (!user) return
    try {
      setLoading(true)
      const res = await dashboardApi.getBadges()
      setBadges(res.data?.data || { clients: 0, requests: 0 })
    } catch (error) {
      console.log('failed to load badges:', error)
    } finally {
      setLoading(false)
    }
  }, [user])
 
  useEffect(() => {
    loadBadges()
    const interval = setInterval(loadBadges, 30_000)
    return () => clearInterval(interval)
  }, [loadBadges])
 
  // ── Notification list helpers ──────────────────────────────────────────────
  const loadNotifications = useCallback(async () => {
    if (!user) return
    try {
      const { default: notificationsApi } = await import('../api/notifications.api')
      const res = await notificationsApi.list()
      const data = Array.isArray(res.data) ? res.data : []
      setNotifications(data)
      setUnreadCount(data.filter((n) => !n.is_read).length)
      setNotifLoaded(true)
    } catch {
      setNotifLoaded(true)
    }
  }, [user])
 
  const markRead = useCallback(async (id) => {
    try {
      const { default: notificationsApi } = await import('../api/notifications.api')
      await notificationsApi.markRead(id)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      )
      setUnreadCount((c) => Math.max(0, c - 1))
    } catch { /* non-critical */ }
  }, [])
 
  const markAllRead = useCallback(async () => {
    try {
      const { default: notificationsApi } = await import('../api/notifications.api')
      await notificationsApi.markAllRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch { /* non-critical */ }
  }, [])
 
  // ── Shared WS feed connection (one socket for entire app) ──────────────────
  const wsRef      = useRef(null)
  const retryRef   = useRef(null)
  const delayRef   = useRef(1000)
  const unmounted  = useRef(false)
 
  const connectFeed = useCallback(() => {
    if (unmounted.current || !accessToken || !user) return
 
    const wsHost = window.location.hostname
    const tenant = wsHost.split('.')[0]
    const url = `ws://${wsHost}:8000/ws/feed/?token=${accessToken}&tenant=${tenant}`
 
    const ws = new WebSocket(url)
    wsRef.current = ws
 
    ws.onopen = () => {
      if (unmounted.current) return ws.close()
      delayRef.current = 1000
      dispatch(setStatus({ key: 'feed', status: 'connected' })) 
    }
 
    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data)
 
        if (msg.type === 'notification') {
          const newNotif = {
            id:                 msg.notification_id,
            event_type:         msg.event_type,
            title:              msg.title,
            body:               msg.body,
            related_request_id: msg.related_request_id,
            related_client_id:  msg.related_client_id,
            is_read:            false,
            created_at:         msg.created_at,
          }
          setNotifications((prev) => [newNotif, ...prev].slice(0, 50))
          setUnreadCount((c) => c + 1)
          playNotificationSound()
        }
 
        if (msg.type === 'activity') {
          // forward to all registered listeners (e.g. LiveFeed on dashboard)
          activityListenersRef.current.forEach((cb) => cb(msg))
        }
      } catch { /* malformed frame */ }
    }
 
    ws.onclose = () => {
      if (unmounted.current) return
      dispatch(setStatus({ key: 'feed', status: 'disconnected' }))
      const delay = delayRef.current
      delayRef.current = Math.min(delay * 2, 30000)
      retryRef.current = setTimeout(connectFeed, delay)
    }
 
    ws.onerror = () => ws.close()
  }, [accessToken, user, dispatch])
 
  useEffect(() => {
    unmounted.current = false
    if (user && accessToken) {
      connectFeed()
      loadNotifications()
    }
    return () => {
      unmounted.current = true
      clearTimeout(retryRef.current)
      wsRef.current?.close()
      dispatch(removeConnection('feed'))
    }
  }, [user, accessToken, connectFeed, loadNotifications])
 
  // ── Activity listener registration (for LiveFeed component) ───────────────
  const registerActivityListener = useCallback((cb) => {
    activityListenersRef.current.push(cb)
    return () => {
      activityListenersRef.current = activityListenersRef.current.filter((fn) => fn !== cb)
    }
  }, [])
 
  const value = {
    // sidebar
    badges,
    loading,
    loadBadges,
    setBadges,
    // bell
    unreadCount,
    notifications,
    notifLoaded,
    markRead,
    markAllRead,
    loadNotifications,
    // feed forwarding
    registerActivityListener,
  }
 
  return (
    <BadgeContext.Provider value={value}>
      {children}
    </BadgeContext.Provider>
  )
}