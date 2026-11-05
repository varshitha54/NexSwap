import { api } from './client'

export const authApi = {
  register: (payload) => api.post('/auth/register', payload).then((r) => r.data),
  login: (payload) => api.post('/auth/login', payload).then((r) => r.data),
  logout: () => api.post('/auth/logout').then((r) => r.data),
}

export const userApi = {
  me: () => api.get('/users/me').then((r) => r.data),
  updateProfile: (payload) => api.put('/users/me', payload).then((r) => r.data),
  changePassword: (payload) => api.put('/users/me/password', payload).then((r) => r.data),
}

export const bookApi = {
  search: (params, signal) =>
    api.get('/books', { params, signal }).then((r) => r.data),
  featured: (limit = 8) => api.get('/books/featured', { params: { limit } }).then((r) => r.data),
  categories: () => api.get('/books/categories').then((r) => r.data),
  get: (id) => api.get(`/books/${id}`).then((r) => r.data),
  contact: (id) => api.get(`/books/${id}/contact`).then((r) => r.data),
  myListings: () => api.get('/books/my-listings').then((r) => r.data),
  create: (payload) => api.post('/books', payload).then((r) => r.data),
  update: (id, payload) => api.put(`/books/${id}`, payload).then((r) => r.data),
  remove: (id) => api.delete(`/books/${id}`),
  updateStatus: (id, status) =>
    api.patch(`/books/${id}/status`, { status }).then((r) => r.data),
  uploadImage: (id, file) => {
    const form = new FormData()
    form.append('file', file)
    return api
      .post(`/books/${id}/image`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data)
  },
}

export const exchangeApi = {
  create: (payload) => api.post('/exchanges', payload).then((r) => r.data),
  received: () => api.get('/exchanges/received').then((r) => r.data),
  sent: () => api.get('/exchanges/sent').then((r) => r.data),
  accept: (id) => api.patch(`/exchanges/${id}/accept`).then((r) => r.data),
  reject: (id) => api.patch(`/exchanges/${id}/reject`).then((r) => r.data),
  cancel: (id) => api.patch(`/exchanges/${id}/cancel`).then((r) => r.data),
  complete: (id) => api.patch(`/exchanges/${id}/complete`).then((r) => r.data),
}

export const dashboardApi = {
  stats: () => api.get('/dashboard/stats').then((r) => r.data),
}

export const adminApi = {
  stats: () => api.get('/admin/stats').then((r) => r.data),
  users: () => api.get('/admin/users').then((r) => r.data),
}

export const publicApi = {
  stats: () => api.get('/public/stats').then((r) => r.data),
}
