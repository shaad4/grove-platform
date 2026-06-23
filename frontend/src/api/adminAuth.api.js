import adminApi from './adminClient'

const adminAuthApi = {

  login: (data) => adminApi.post('/login/', data),

  refresh: () => adminApi.post('/token/refresh/'),

}

export default adminAuthApi