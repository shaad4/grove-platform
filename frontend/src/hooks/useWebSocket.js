import { useEffect, useRef, useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { setStatus, removeConnection } from '../features/ws/wsSlice'

const BASE_DELAY = 1000
const MAX_DELAY  = 30000

export function useWebSocket(url, onMessage, key = 'default', socketRef = null) {
  const dispatch   = useDispatch()
  const wsRef      = useRef(null)
  const retryTimer = useRef(null)
  const delayRef   = useRef(BASE_DELAY)
  const unmounted  = useRef(false)
  const onMessageRef = useRef(onMessage)

  // Keep onMessage ref current without re-triggering connect
  useEffect(() => { onMessageRef.current = onMessage }, [onMessage])

  const connect = useCallback(() => {
    if (unmounted.current || !url) return

    dispatch(setStatus({ key, status: 'reconnecting' }))

    const ws = new WebSocket(url)
    wsRef.current = ws

    if (socketRef) socketRef.current = ws

    ws.onopen = () => {
      if (unmounted.current) return ws.close()
      delayRef.current = BASE_DELAY
      dispatch(setStatus({ key, status: 'connected' }))
    }

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data)
        onMessageRef.current?.(msg)
      } catch { /* ignore malformed frames */ }
    }

    ws.onclose = () => {
      if (unmounted.current) return
      dispatch(setStatus({ key, status: 'disconnected' }))

      // Exponential backoff
      const delay = delayRef.current
      delayRef.current = Math.min(delay * 2, MAX_DELAY)
      retryTimer.current = setTimeout(connect, delay)
    }

    ws.onerror = () => ws.close() 
  }, [url, key, dispatch])

  useEffect(() => {
    unmounted.current = false
    connect()

    return () => {
      unmounted.current = true
      clearTimeout(retryTimer.current)
      wsRef.current?.close()
      dispatch(removeConnection(key))
    }
  }, [connect])
}