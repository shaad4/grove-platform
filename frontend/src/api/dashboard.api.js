import api from './client'

const dashboardApi = {
    getStats: () => api.get('/dashboard/stats/'),
}

export default dashboardApi
