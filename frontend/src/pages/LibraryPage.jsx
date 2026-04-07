// src/pages/LibraryPage.jsx

import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, Heart, ListMusic, Trash2 } from 'lucide-react'
import api from '../api/axios'
import SongCard from '../components/common/SongCard'
import { SongCardSkeleton, PlaylistCardSkeleton } from '../components/common/Skeleton'
import toast from 'react-hot-toast'

export default function LibraryPage() {
  const [tab, setTab] = useState('playlists') // 'playlists' | 'favorites'
  const [playlists, setPlaylists] = useState([])
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newPlaylistName, setNewPlaylistName] = useState('')

  useEffect(() => {
    fetchAll()
  }, [])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [plRes, favRes] = await Promise.all([
        api.get('/playlists/mine'),
        api.get('/favorites'),
      ])
      setPlaylists(plRes.data.data)
      setFavorites(favRes.data.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const createPlaylist = async (e) => {
    e.preventDefault()
    if (!newPlaylistName.trim()) return
    try {
      const res = await api.post('/playlists', { name: newPlaylistName })
      setPlaylists([res.data.data, ...playlists])
      setNewPlaylistName('')
      setShowCreate(false)
      toast.success('Playlist created!')
    } catch {
      toast.error('Failed to create playlist')
    }
  }

  const deletePlaylist = async (id) => {
    if (!confirm('Delete this playlist?')) return
    try {
      await api.delete(`/playlists/${id}`)
      setPlaylists(playlists.filter(p => p._id !== id))
      toast.success('Playlist deleted')
    } catch {
      toast.error('Failed to delete')
    }
  }

  const favoriteSongs = favorites.map(f => f.song).filter(Boolean)

  return (
    <div className="px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold text-white">Your Library</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="btn-primary flex items-center gap-2 text-sm"
        >
          <Plus size={16} /> New Playlist
        </button>
      </div>

      {/* Create Playlist Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-surface-1 border border-surface-3 rounded-2xl p-6 w-full max-w-md shadow-2xl"
          >
            <h3 className="font-display text-xl font-bold text-white mb-4">Create Playlist</h3>
            <form onSubmit={createPlaylist} className="space-y-4">
              <input
                type="text"
                placeholder="Playlist name"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                className="input-field"
                autoFocus
              />
              <div className="flex gap-3">
                <button type="submit" className="btn-primary flex-1">Create</button>
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="btn-ghost flex-1 border border-surface-4"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-2 p-1 rounded-xl w-fit">
        {[
          { key: 'playlists', label: 'Playlists', icon: ListMusic },
          { key: 'favorites', label: 'Favorites', icon: Heart },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all
              ${tab === key ? 'bg-brand text-white shadow' : 'text-zinc-400 hover:text-white'}`}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {/* Playlists Tab */}
      {tab === 'playlists' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {Array(6).fill(0).map((_, i) => <PlaylistCardSkeleton key={i} />)}
            </div>
          ) : playlists.length === 0 ? (
            <div className="text-center py-20">
              <ListMusic size={48} className="text-zinc-700 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No playlists yet</h3>
              <p className="text-zinc-400 mb-6">Create your first playlist to get started</p>
              <button onClick={() => setShowCreate(true)} className="btn-primary">
                Create Playlist
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {playlists.map((pl) => (
                <div key={pl._id} className="group relative">
                  <Link to={`/playlist/${pl._id}`}>
                    <div className="bg-surface-2 rounded-xl p-4 hover:bg-surface-3 transition-colors cursor-pointer">
                      {/* Cover art grid */}
                      <div className="aspect-square rounded-lg overflow-hidden mb-3 bg-surface-4 flex items-center justify-center">
                        {pl.songs && pl.songs.length > 0 ? (
                          <div className="grid grid-cols-2 w-full h-full">
                            {pl.songs.slice(0, 4).map((s, i) => (
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
                          <ListMusic size={32} className="text-zinc-600" />
                        )}
                      </div>
                      <p className="font-semibold text-sm text-white truncate">{pl.name}</p>
                      <p className="text-xs text-zinc-400 mt-1">{pl.songs?.length || 0} songs</p>
                    </div>
                  </Link>
                  {/* Delete button */}
                  <button
                    onClick={() => deletePlaylist(pl._id)}
                    className="absolute top-2 right-2 p-1.5 bg-surface-3 rounded-lg
                      text-zinc-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Favorites Tab */}
      {tab === 'favorites' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {Array(6).fill(0).map((_, i) => <SongCardSkeleton key={i} />)}
            </div>
          ) : favoriteSongs.length === 0 ? (
            <div className="text-center py-20">
              <Heart size={48} className="text-zinc-700 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No favorites yet</h3>
              <p className="text-zinc-400">Like songs to save them here</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {favoriteSongs.map((song) => (
                <SongCard key={song._id} song={song} queue={favoriteSongs} />
              ))}
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}
