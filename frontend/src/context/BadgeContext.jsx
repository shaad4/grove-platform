import { createContext, useCallback, useContext, useEffect, useState } from "react";

import dashboardApi from "../api/dashboard.api";
import { useAuth } from "./AuthContext";

export const BadgeContext = createContext(null)

export function BadgeProvider({children}){
    const { user } = useAuth()

    const [badges, setBadges] = useState({
        clients: 0,
        requests : 0,
    })

    const [loading, setLoading] = useState(false)

    const loadBadges = useCallback(
        async () => {
            if (!user) return

            try{
                setLoading(true)

                const res = await dashboardApi.getBadges()

                setBadges(
                    res.data?.data || {
                        clients : 0,
                        requests: 0,
                    }
                )
            }catch(error){
                console.log("failed to load badges : ", error)
            }finally{
                setLoading(false)
            }
        }, [user]
    )

    useEffect(() => {
        loadBadges()
        const interval = setInterval(loadBadges, 30_000)
        return () => clearInterval(interval)
    }, [loadBadges])

    const values = {badges, loading, loadBadges, setBadges}

    return (
        <BadgeContext.Provider value={values}>
            {children}
        </BadgeContext.Provider>
    )
}