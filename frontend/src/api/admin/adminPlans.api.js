import adminApi from './adminClient'

const adminPlansApi = {

  list: () => adminApi.get('/plans/'),

}

export default adminPlansApi