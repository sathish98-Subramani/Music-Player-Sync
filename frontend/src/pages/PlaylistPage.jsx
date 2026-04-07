// src/pages/PlaylistPage.jsx

import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Play, Shuffle, ListMusic, Clock, Trash2, ArrowLeft } from 'lucide-react'
import api from '../api/axios'
import usePlayerStore from '../store/playerStore'
import useAuthStore from '../store/authStore'
import SongRow from '../components/common/SongRow'
import { SongRowSkeleton } from '../components/common/Skeleton'
import toast from 'react-hot-toast'

export default function PlaylistPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { playSong, toggleShuffle } = usePlayerStore()
  const [playlist, setPlaylist] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPlaylist = async () => {
      try {
        const res = await api.get(`/playlists/${id}`)
        setPlaylist(res.data.data)
      } catch {
        toast.error('Playlist not found')
        navigate('/library')
      } finally {
        setLoading(false)
      }
    }
    fetchPlaylist()
  }, [id])

  const handlePlayAll = () => {
    if (!playlist?.songs?.length) return
    playSong(playlist.songs[0], playlist.songs)
  }

  const handleShuffle = () => {
    if (!playlist?.songs?.length) return
    const randomSong = playlist.songs[Math.floor(Math.random() * playlist.songs.length)]
    playSong(randomSong, playlist.songs)
    toggleShuffle()
  }

  const handleRemoveSong = async (songId) => {
    try {
      await api.delete(`/playlists/${id}/songs/${songId}`)
      setPlaylist(prev => ({
        ...prev,
        songs: prev.songs.filter(s => s._id !== songId),
      }))
      toast.success('Song removed')
    } catch {
      toast.error('Failed to remove song')
    }
  }

  const totalDuration = playlist?.songs?.reduce((acc, s) => acc + (s.duration || 0), 0) || 0
  const formatTotal = (s) => {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    if (h > 0) return `${h}h ${m}m`
    return `${m} min`
  }

  if (loading) {
    return (
      <div className="px-6 py-8 space-y-6">
        <div className="flex gap-6">
          <div className="skeleton w-48 h-48 rounded-2xl shrink-0" />
          <div className="space-y-3 flex-1">
            <div className="skeleton h-6 w-48" />
            <div className="skeleton h-10 w-72" />
            <div className="skeleton h-4 w-40" />
          </div>
        </div>
        {Array(6).fill(0).map((_, i) => <SongRowSkeleton key={i} />)}
      </div>
    )
  }

  if (!playlist) return null

  const isOwner = user?._id === playlist.owner?._id ||
    user?.id === playlist.owner?._id ||
    user?.id === playlist.owner?.id

  return (
    <div className="px-6 py-8 space-y-8">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm"
      >
        <ArrowLeft size={16} /> Back
      </button>

      {/* Playlist header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row gap-6"
      >
        {/* Cover art */}
        <div className="w-48 h-48 shrink-0 rounded-2xl overflow-hidden bg-surface-2 flex items-center justify-center shadow-2xl">
          {playlist.songs && playlist.songs.length > 0 ? (
            <div className="grid grid-cols-2 w-full h-full">
              {playlist.songs.slice(0, 4).map((s, i) => (
                <img
                  key={i}
                  src={s.thumbnailUrl || ''}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.style.display = 'none' }}
                />
              ))}
            </div>
          ) : (
            <ListMusic size={48} className="text-zinc-600" />
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col justify-end gap-3">
          <span className="text-xs text-zinc-500 uppercase tracking-wider font-bold">Playlist</span>
          <h1 className="font-display text-4xl font-bold text-white">{playlist.name}</h1>
          {playlist.description && (
            <p className="text-zinc-400 text-sm">{playlist.description}</p>
          )}
          <div className="flex items-center gap-3 text-sm text-zinc-400">
            <img
              src={playlist.owner?.avatar || ''}
              alt={playlist.owner?.username}
              className="w-5 h-5 rounded-full bg-surface-3 object-cover"
            />
            <span className="font-semibold text-white">{playlist.owner?.username}</span>
            <span>•</span>
            <span>{playlist.songs?.length || 0} songs</span>
            {totalDuration > 0 && (
              <>
                <span>•</span>
                <Clock size={13} />
                <span>{formatTotal(totalDuration)}</span>
              </>
            )}
          </div>
          {/* Action buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handlePlayAll}
              disabled={!playlist.songs?.length}
              className="btn-primary flex items-center gap-2 disabled:opacity-50"
            >
              <Play size={16} /> Play All
            </button>
            <button
              onClick={handleShuffle}
              disabled={!playlist.songs?.length}
              className="btn-ghost flex items-center gap-2 border border-surface-4"
            >
              <Shuffle size={16} /> Shuffle
            </button>
          </div>
        </div>
      </motion.div>

      {/* Songs list */}
      <div className="bg-surface-1 rounded-2xl overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-[40px_1fr_1fr_80px] gap-4 px-4 py-3 border-b border-surface-3
          text-xs text-zinc-500 uppercase tracking-wider font-bold">
          <span>#</span>
          <span>Title</span>
          <span className="hidden md:block">Album</span>
          <span className="text-right">Duration</span>
        </div>

        {playlist.songs?.length === 0 ? (
          <div className="text-center py-16">
            <ListMusic size={40} className="text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-400">This playlist is empty</p>
          </div>
        ) : (
          playlist.songs?.map((song, i) => (
            <SongRow
              key={song._id}
              song={song}
              index={i}
              queue={playlist.songs}
              showRemove={isOwner}
              onRemove={handleRemoveSong}
            />
          ))
        )}
      </div>
    </div>
  )
}
