// src/components/common/Sidebar.jsx

import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home, Search, Library, Upload, Radio,
  Heart, History, User, LogOut, Music, Menu, X
} from 'lucide-react'
import useAuthStore from '../../store/authStore'
import toast from 'react-hot-toast'

const navItems = [
  { to: '/',        icon: Home,    label: 'Home' },
  { to: '/search',  icon: Search,  label: 'Search' },
  { to: '/library', icon: Library, label: 'Library' },
  { to: '/rooms',   icon: Radio,   label: 'Sync Rooms' },
  { to: '/upload',  icon: Upload,  label: 'Upload' },
]

export default function Sidebar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = () => {
    logout()
    toast.success('Logged out')
    navigate('/login')
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-6 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-brand flex items-center justify-center">
          <Music size={18} className="text-white" />
        </div>
        <span className="font-display font-bold text-xl text-white tracking-tight">
          Tamil<span className="text-brand">Sync</span>
        </span>
      </div>

      {/* Main Nav */}
      <nav className="px-3 flex-1 space-y-1">
        <p className="px-3 py-2 text-xs text-zinc-500 uppercase tracking-widest font-bold">Menu</p>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active text-white bg-surface-2' : ''}`
            }
            onClick={() => setMobileOpen(false)}
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}

        <div className="pt-4">
          <p className="px-3 py-2 text-xs text-zinc-500 uppercase tracking-widest font-bold">Your Music</p>
          <NavLink
            to="/library"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            onClick={() => setMobileOpen(false)}
          >
            <Heart size={18} />
            Favorites
          </NavLink>
        </div>
      </nav>

      {/* User profile + logout */}
      {user && (
        <div className="px-3 pb-6 border-t border-surface-3 pt-4 space-y-1">
          <NavLink
            to="/profile"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            onClick={() => setMobileOpen(false)}
          >
            {user.avatar ? (
              <img src={user.avatar} alt={user.username} className="w-6 h-6 rounded-full object-cover" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-brand flex items-center justify-center text-xs text-white font-bold">
                {user.username[0].toUpperCase()}
              </div>
            )}
            <span className="truncate">{user.username}</span>
          </NavLink>
          <button
            onClick={handleLogout}
            className="sidebar-link w-full text-left text-red-400 hover:text-red-300 hover:bg-red-950/30"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      )}
    </div>
  )

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 bg-surface-2 p-2 rounded-lg text-white"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 bg-black/60 z-40"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="md:hidden fixed left-0 top-0 bottom-0 w-64 bg-surface-1 z-50 overflow-y-auto"
          >
            <SidebarContent />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop sidebar — always visible */}
      <aside className="hidden md:flex flex-col w-60 bg-surface-1 h-screen overflow-y-auto shrink-0 fixed left-0 top-0 bottom-0">
        <SidebarContent />
      </aside>
    </>
  )
}
