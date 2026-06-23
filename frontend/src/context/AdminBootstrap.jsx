import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import adminAuthApi from '../api/adminAuth.api'
import { setAdminCredentials, clearAdminAuth } from '../features/adminAuth/adminAuthSlice'

export default function AdminBootstrap({ children }) {
  const dispatch = useDispatch()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false

    adminAuthApi.refresh()
      .then(({ data }) => {
        if (cancelled) return
        dispatch(setAdminCredentials({ accessToken: data.access, admin: data.admin }))
      })
      .catch(() => {
        if (cancelled) return
        dispatch(clearAdminAuth())
      })
      .finally(() => {
        if (!cancelled) setReady(true)
      })

    return () => { cancelled = true }
  }, [dispatch])

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#070D0A]">
        <div className="h-7 w-7 rounded-full border-2 border-white/10 border-t-[#1D9E75] animate-spin" />
      </div>
    )
  }

  return children
}