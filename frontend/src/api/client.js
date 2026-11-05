import axios from 'axios'

const TOKEN_KEY = 'nexswap_token'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 20000,
  headers: {
    Accept: 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const url = error.config?.url || ''
    const isAuthAttempt = url.includes('/auth/login') || url.includes('/auth/register')
    if (status === 401 && !isAuthAttempt) {
      window.dispatchEvent(new CustomEvent('nexswap:unauthorized'))
    }
    return Promise.reject(error)
  },
)

export function getApiError(error) {
  if (error?.code === 'ECONNABORTED') {
    return 'The request took too long. Please check that the API is running.'
  }
  if (!error?.response) {
    return 'Unable to reach the NexSwap API. Please check your connection and try again.'
  }
  const data = error.response.data
  if (data?.fieldErrors) {
    const first = Object.values(data.fieldErrors)[0]
    if (first) return first
  }
  return data?.message || data?.error || 'Something went wrong. Please try again.'
}

export function getFieldErrors(error) {
  return error?.response?.data?.fieldErrors || {}
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export { TOKEN_KEY }
