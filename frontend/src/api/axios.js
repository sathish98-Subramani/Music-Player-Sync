import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api`
    : 'http://localhost:5000/api',
  withCredentials: true,
})

// Attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ts_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('ts_token')
      localStorage.removeItem('ts_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api