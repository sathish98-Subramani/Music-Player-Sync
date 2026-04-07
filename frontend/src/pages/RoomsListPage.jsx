// src/pages/RoomsListPage.jsx

import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Radio, Plus, Users, Music2, ArrowRight, Hash } from 'lucide-react'
import api from '../api/axios'
import toast from 'react-hot-toast'

export default function RoomsListPage() {
  const navigate = useNavigate()
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [showJoin, setShowJoin] = useState(false)
  const [roomName, setRoomName] = useState('')
  const [joinCode, setJoinCode] = useState('')

  useEffect(() => {
    fetchRooms()
  }, [])

  const fetchRooms = async () => {
    try {
      const res = await api.get('/rooms')
      setRooms(res.data.data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const createRoom = async (e) => {
    e.preventDefault()
    if (!roomName.trim()) return
    try {
      const res = await api.post('/rooms', { name: roomName })
      toast.success(`Room created! Code: ${res.data.data.code}`)
      navigate(`/room/${res.data.data.code}`)
    } catch {
      toast.error('Failed to create room')
    }
  }

  const joinRoom = async (e) => {
    e.preventDefault()
    const code = joinCode.trim().toUpperCase()
    if (!code) return
    try {
      await api.get(`/rooms/${code}`)
      navigate(`/room/${code}`)
    } catch {
      toast.error('Room not found. Check the code and try again.')
    }
  }

  return (
    <div className="px-6 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold text-white flex items-center gap-3">
          <Radio size={28} className="text-brand" /> Sync Rooms
        </h1>
        <p className="text-zinc-400 mt-2">Listen to music together in real-time</p>
      </div>

      {/* Action buttons */}
      <div className="flex gap-4 flex-wrap">
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Create Room
        </button>
        <button
          onClick={() => setShowJoin(true)}
          className="btn-ghost border border-surface-4 flex items-center gap-2"
        >
          <Hash size={16} /> Join with Code
        </button>
      </div>

      {/* Modals */}
      {(showCreate || showJoin) && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-surface-1 border border-surface-3 rounded-2xl p-6 w-full max-w-md shadow-2xl"
          >
            {showCreate ? (
              <>
                <h3 className="font-display text-xl font-bold text-white mb-4">Create a Room</h3>
                <form onSubmit={createRoom} className="space-y-4">
                  <input
                    type="text"
                    placeholder="Room name (e.g. Kuthu Night 🔥)"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    className="input-field"
                    autoFocus
                    required
                  />
                  <div className="flex gap-3">
                    <button type="submit" className="btn-primary flex-1">Create Room</button>
                    <button type="button" onClick={() => setShowCreate(false)} className="btn-ghost flex-1 border border-surface-4">Cancel</button>
                  </div>
                </form>
              </>
            ) : (
              <>
                <h3 className="font-display text-xl font-bold text-white mb-4">Join a Room</h3>
                <form onSubmit={joinRoom} className="space-y-4">
                  <input
                    type="text"
                    placeholder="Enter 6-character room code"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    className="input-field uppercase tracking-widest text-center text-lg font-bold"
                    maxLength={6}
                    autoFocus
                    required
                  />
                  <div className="flex gap-3">
                    <button type="submit" className="btn-primary flex-1">Join Room</button>
                    <button type="button" onClick={() => setShowJoin(false)} className="btn-ghost flex-1 border border-surface-4">Cancel</button>
                  </div>
                </form>
              </>
            )}
          </motion.div>
        </div>
      )}

      {/* Rooms grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="skeleton h-40 rounded-2xl" />
          ))}
        </div>
      ) : rooms.length === 0 ? (
        <div className="text-center py-20">
          <Radio size={48} className="text-zinc-700 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No active rooms</h3>
          <p className="text-zinc-400 mb-6">Create one and invite your friends!</p>
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            Create First Room
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map((room) => (
            <motion.div
              key={room._id}
              whileHover={{ y: -3 }}
              onClick={() => navigate(`/room/${room.code}`)}
              className="bg-surface-2 rounded-2xl p-5 cursor-pointer hover:bg-surface-3
                transition-colors border border-surface-3 hover:border-brand/30 group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-brand/20 flex items-center justify-center">
                  <Radio size={18} className="text-brand" />
                </div>
                <span className="text-xs font-bold text-zinc-500 bg-surface-3 px-2 py-1 rounded-lg uppercase tracking-widest">
                  {room.code}
                </span>
              </div>

              <h3 className="font-display text-lg font-bold text-white mb-1">{room.name}</h3>
              <div className="flex items-center gap-2 text-sm text-zinc-400 mb-4">
                <img
                  src={room.host?.avatar || ''}
                  alt={room.host?.username}
                  className="w-4 h-4 rounded-full bg-surface-4"
                />
                <span>Host: {room.host?.username}</span>
              </div>

              {room.currentSong && (
                <div className="flex items-center gap-2 bg-surface-1 rounded-lg px-3 py-2 mb-4">
                  <Music2 size={13} className="text-brand shrink-0" />
                  <span className="text-xs text-zinc-300 truncate">
                    {room.currentSong.title} — {room.currentSong.artist}
                  </span>
                </div>
              )}

              <button className="flex items-center gap-1 text-sm text-brand font-semibold
                group-hover:gap-2 transition-all">
                Join Room <ArrowRight size={14} />
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
