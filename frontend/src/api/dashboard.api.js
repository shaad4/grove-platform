import api from './client'

const dashboardApi = {
    getStats: () => api.get('/dashboard/stats/'),
    getBadges: () => api.get('/dashboard/badges/'),
}

export default dashboardApi
