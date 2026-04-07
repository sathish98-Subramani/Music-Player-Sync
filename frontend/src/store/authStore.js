// src/store/authStore.js — Authentication state with Zustand

import { create } from 'zustand'
import api from '../api/axios'

const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('ts_user') || 'null'),
  token: localStorage.getItem('ts_token') || null,
  loading: false,
  error: null,

  // ─── Register ──────────────────────────────────────────────
  register: async (data) => {
    set({ loading: true, error: null })
    try {
      const res = await api.post('/auth/register', data)
      const { token, user } = res.data
      localStorage.setItem('ts_token', token)
      localStorage.setItem('ts_user', JSON.stringify(user))
      set({ token, user, loading: false })
      return { success: true }
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed'
      set({ error: message, loading: false })
      return { success: false, message }
    }
  },

  // ─── Login ─────────────────────────────────────────────────
  login: async (data) => {
    set({ loading: true, error: null })
    try {
      const res = await api.post('/auth/login', data)
      const { token, user } = res.data
      localStorage.setItem('ts_token', token)
      localStorage.setItem('ts_user', JSON.stringify(user))
      set({ token, user, loading: false })
      return { success: true }
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed'
      set({ error: message, loading: false })
      return { success: false, message }
    }
  },

  // ─── Logout ────────────────────────────────────────────────
  logout: () => {
    localStorage.removeItem('ts_token')
    localStorage.removeItem('ts_user')
    set({ user: null, token: null })
  },

  // ─── Update user in store ──────────────────────────────────
  setUser: (user) => {
    localStorage.setItem('ts_user', JSON.stringify(user))
    set({ user })
  },

  clearError: () => set({ error: null }),
}))

export default useAuthStore
