// src/App.jsx — Root component with routing

import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import useAuthStore from './store/authStore'

// Layout
import Layout from './components/common/Layout'

// Pages
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import HomePage from './pages/HomePage'
import SearchPage from './pages/SearchPage'
import LibraryPage from './pages/LibraryPage'
import PlaylistPage from './pages/PlaylistPage'
import UploadPage from './pages/UploadPage'
import RoomPage from './pages/RoomPage'
import RoomsListPage from './pages/RoomsListPage'
import ProfilePage from './pages/ProfilePage'

// Protected route wrapper
const ProtectedRoute = ({ children }) => {
  const { token } = useAuthStore()
  if (!token) return <Navigate to="/login" replace />
  return children
}

// Auth route wrapper — redirect to home if already logged in
const AuthRoute = ({ children }) => {
  const { token } = useAuthStore()
  if (token) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#222', color: '#fff', border: '1px solid #333' },
          success: { iconTheme: { primary: '#E8472A', secondary: '#fff' } },
        }}
      />
      <Routes>
        {/* Public auth pages */}
        <Route path="/login"  element={<AuthRoute><LoginPage /></AuthRoute>} />
        <Route path="/signup" element={<AuthRoute><SignupPage /></AuthRoute>} />

        {/* Protected app pages with layout */}
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index         element={<HomePage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="library" element={<LibraryPage />} />
          <Route path="playlist/:id" element={<PlaylistPage />} />
          <Route path="upload" element={<UploadPage />} />
          <Route path="rooms"  element={<RoomsListPage />} />
          <Route path="room/:code" element={<RoomPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="profile/:id" element={<ProfilePage />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
