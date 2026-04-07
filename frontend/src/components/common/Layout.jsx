// src/components/common/Layout.jsx — Main app shell with sidebar + player

import React from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Player from '../player/Player'

export default function Layout() {
  return (
    <div className="flex h-screen bg-surface overflow-hidden">
      {/* Sidebar — fixed left */}
      <Sidebar />

      {/* Main content scrollable area */}
      <main className="flex-1 overflow-y-auto pb-28 ml-0 md:ml-60">
        <div className="min-h-full">
          <Outlet />
        </div>
      </main>

      {/* Sticky bottom music player */}
      <Player />
    </div>
  )
}
