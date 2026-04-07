// src/components/common/SongCard.jsx — Song grid card

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Play, Pause, Heart, MoreVertical, PlusCircle } from 'lucide-react'
import usePlayerStore from '../../store/playerStore'
import api from '../../api/axios'
import toast from 'react-hot-toast'

const DEFAULT_THUMB = 'https://res.cloudinary.com/demo/image/upload/v1/samples/music.jpg'

export default function SongCard({ song, queue = [], showMenu = true }) {
  const { currentSong, isPlaying, playSong, togglePlay, addToQueue } = usePlayerStore()
  const [favorited, setFavorited] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const isActive = currentSong?._id === song._id

  const handlePlay = (e) => {
    e.stopPropagation()
    if (isActive) {
      togglePlay()
    } else {
      playSong(song, queue.length ? queue : [song])
    }
  }

  const handleFavorite = async (e) => {
    e.stopPropagation()
    try {
      const res = await api.post('/favorites/toggle', { songId: song._id })
      setFavorited(res.data.favorited)
      toast.success(res.data.message)
    } catch {
      toast.error('Please login to favorite songs')
    }
  }

  const handleAddToQueue = (e) => {
    e.stopPropagation()
    addToQueue(song)
    toast.success('Added to queue')
    setMenuOpen(false)
  }

  const formatDuration = (s) => {
    if (!s) return '—'
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className={`relative group bg-surface-2 rounded-xl p-4 cursor-pointer
        hover:bg-surface-3 transition-colors duration-200
        ${isActive ? 'ring-1 ring-brand' : ''}`}
      onClick={() => playSong(song, queue.length ? queue : [song])}
    >
      {/* Thumbnail */}
      <div className="relative mb-4 aspect-square rounded-lg overflow-hidden">
        <img
          src={song.thumbnailUrl || DEFAULT_THUMB}
          alt={song.title}
          className="w-full h-full object-cover"
          onError={(e) => { e.target.src = DEFAULT_THUMB }}
        />
        {/* Play overlay */}
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          whileHover={{ scale: 1.05 }}
          animate={isActive ? { opacity: 1, scale: 1 } : {}}
          className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-brand
            flex items-center justify-center shadow-lg
            opacity-0 group-hover:opacity-100 transition-all duration-200"
          onClick={handlePlay}
        >
          {isActive && isPlaying
            ? <Pause size={16} className="text-white" />
            : <Play size={16} className="text-white ml-0.5" />
          }
        </motion.button>
        {/* Active indicator */}
        {isActive && isPlaying && (
          <div className="absolute top-2 left-2 flex gap-0.5 items-end h-4">
            {[1,2,3].map((i) => (
              <div
                key={i}
                className="w-1 bg-brand rounded-full animate-pulse"
                style={{ height: `${8 + i * 4}px`, animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="space-y-1">
        <p className={`font-semibold text-sm truncate ${isActive ? 'text-brand' : 'text-white'}`}>
          {song.title}
        </p>
        <p className="text-xs text-zinc-400 truncate">{song.artist}</p>
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-zinc-500">{formatDuration(song.duration)}</span>
          <div className="flex items-center gap-1">
            <button
              onClick={handleFavorite}
              className={`p-1 rounded transition-colors ${favorited ? 'text-brand' : 'text-zinc-500 hover:text-white'}`}
            >
              <Heart size={14} fill={favorited ? 'currentColor' : 'none'} />
            </button>
            {showMenu && (
              <div className="relative">
                <button
                  onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen) }}
                  className="p-1 text-zinc-500 hover:text-white transition-colors"
                >
                  <MoreVertical size={14} />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 bottom-6 bg-surface-3 border border-surface-4 rounded-lg
                    shadow-xl z-10 w-40 py-1 text-sm">
                    <button
                      onClick={handleAddToQueue}
                      className="flex items-center gap-2 w-full px-3 py-2 hover:bg-surface-4 text-left"
                    >
                      <PlusCircle size={14} />
                      Add to Queue
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
