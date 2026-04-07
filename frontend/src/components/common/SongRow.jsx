// src/components/common/SongRow.jsx — Song list row

import React, { useState } from 'react'
import { Play, Pause, Heart, MoreVertical, Trash2, PlusCircle, ListMusic } from 'lucide-react'
import usePlayerStore from '../../store/playerStore'
import api from '../../api/axios'
import toast from 'react-hot-toast'

const DEFAULT_THUMB = 'https://res.cloudinary.com/demo/image/upload/v1/samples/music.jpg'

export default function SongRow({ song, index, queue = [], onRemove, showRemove = false }) {
  const { currentSong, isPlaying, playSong, togglePlay, addToQueue } = usePlayerStore()
  const [favorited, setFavorited] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const isActive = currentSong?._id === song._id

  const handlePlay = () => {
    if (isActive) togglePlay()
    else playSong(song, queue.length ? queue : [song])
  }

  const handleFavorite = async (e) => {
    e.stopPropagation()
    try {
      const res = await api.post('/favorites/toggle', { songId: song._id })
      setFavorited(res.data.favorited)
      toast.success(res.data.message)
    } catch { toast.error('Failed') }
  }

  const formatDuration = (s) => {
    if (!s) return '—'
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  return (
    <div
      className={`group flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer
        hover:bg-surface-2 transition-colors duration-150
        ${isActive ? 'bg-surface-2' : ''}`}
      onClick={handlePlay}
    >
      {/* Index / Play indicator */}
      <div className="w-8 text-center shrink-0">
        {isActive && isPlaying ? (
          <div className="flex gap-0.5 items-end justify-center h-4">
            {[1,2,3].map(i => (
              <div key={i} className="w-0.5 bg-brand rounded animate-pulse"
                style={{ height: `${6 + i * 3}px`, animationDelay: `${i*0.15}s` }} />
            ))}
          </div>
        ) : (
          <>
            <span className="text-zinc-500 text-sm group-hover:hidden">{index + 1}</span>
            <button className="hidden group-hover:flex items-center justify-center text-white">
              {isActive ? <Pause size={16} /> : <Play size={14} className="ml-0.5" />}
            </button>
          </>
        )}
      </div>

      {/* Thumbnail */}
      <img
        src={song.thumbnailUrl || DEFAULT_THUMB}
        alt={song.title}
        className="w-12 h-12 rounded-lg object-cover shrink-0"
        onError={(e) => { e.target.src = DEFAULT_THUMB }}
      />

      {/* Title + Artist */}
      <div className="flex-1 min-w-0">
        <p className={`font-semibold text-sm truncate ${isActive ? 'text-brand' : 'text-white'}`}>
          {song.title}
        </p>
        <p className="text-xs text-zinc-400 truncate">{song.artist}</p>
      </div>

      {/* Album */}
      <span className="hidden md:block text-sm text-zinc-500 truncate max-w-[140px]">
        {song.album || '—'}
      </span>

      {/* Duration + Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={handleFavorite}
          className={`p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all
            ${favorited ? 'text-brand opacity-100' : 'text-zinc-500 hover:text-white'}`}
        >
          <Heart size={15} fill={favorited ? 'currentColor' : 'none'} />
        </button>
        <span className="text-sm text-zinc-500 w-10 text-right">{formatDuration(song.duration)}</span>
        <div className="relative">
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen) }}
            className="p-1.5 text-zinc-500 hover:text-white opacity-0 group-hover:opacity-100 transition-all"
          >
            <MoreVertical size={15} />
          </button>
          {menuOpen && (
            <div
              className="absolute right-0 top-8 bg-surface-3 border border-surface-4
                rounded-xl shadow-2xl z-20 w-44 py-1 text-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => { addToQueue(song); toast.success('Added to queue'); setMenuOpen(false) }}
                className="flex items-center gap-2 w-full px-3 py-2.5 hover:bg-surface-4 text-left"
              >
                <ListMusic size={14} /> Add to Queue
              </button>
              {showRemove && (
                <button
                  onClick={() => { onRemove?.(song._id); setMenuOpen(false) }}
                  className="flex items-center gap-2 w-full px-3 py-2.5 hover:bg-surface-4 text-left text-red-400"
                >
                  <Trash2 size={14} /> Remove
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
