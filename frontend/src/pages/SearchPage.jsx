import React, { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, X } from 'lucide-react'
import api from '../api/axios'
import SongCard from '../components/common/SongCard'
import { SongCardSkeleton } from '../components/common/Skeleton'

const GENRES = ['All', 'Tamil', 'Film', 'Folk', 'Classical', 'Devotional', 'Pop', 'Hip-Hop', 'Other']

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [genre, setGenre] = useState(searchParams.get('genre') || 'All')
  const [songs, setSongs] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const fetchSongs = useCallback(async (q, g) => {
    setLoading(true)

    try {
      let url = '/songs?limit=40'

      if (q && q.trim()) {
        url = `/songs/search?q=${encodeURIComponent(q.trim())}`
      } else if (g && g !== 'All') {
        url = `/songs?genre=${encodeURIComponent(g)}&limit=40`
      }

      const res = await api.get(url)
      const data = Array.isArray(res.data) ? res.data : res.data?.data || []

      setSongs(data)
      setSearched(true)
    } catch (err) {
      console.error(err)
      setSongs([])
      setSearched(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const q = searchParams.get('q') || ''
    const g = searchParams.get('genre') || 'All'

    setQuery(q)
    setGenre(g)
    fetchSongs(q, g)
  }, [searchParams, fetchSongs])

  const handleSearch = (e) => {
    e.preventDefault()

    const trimmed = query.trim()

    if (trimmed) {
      setSearchParams({ q: trimmed })
    } else if (genre !== 'All') {
      setSearchParams({ genre })
    } else {
      setSearchParams({})
    }
  }

  const handleGenre = (g) => {
    setGenre(g)
    setQuery('')

    if (g !== 'All') {
      setSearchParams({ genre: g })
    } else {
      setSearchParams({})
    }
  }

  const clearSearch = () => {
    setQuery('')

    if (genre !== 'All') {
      setSearchParams({ genre })
    } else {
      setSearchParams({})
    }
  }

  return (
    <div className="px-6 py-8 space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold text-white mb-2">Search</h1>
        <p className="text-zinc-400">Find your favourite Tamil songs</p>
      </div>

      <form onSubmit={handleSearch} className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input
          type="text"
          placeholder="Search songs, artists, albums..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="input-field pl-12 pr-12 text-base"
        />
        {query && (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
          >
            <X size={18} />
          </button>
        )}
      </form>

      <div className="flex gap-2 flex-wrap">
        {GENRES.map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => handleGenre(g)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
              genre === g && !query
                ? 'bg-brand text-white'
                : 'bg-surface-2 text-zinc-300 hover:bg-surface-3 hover:text-white'
            }`}
          >
            {g}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {Array(12).fill(0).map((_, i) => (
            <SongCardSkeleton key={i} />
          ))}
        </div>
      ) : searched && songs.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🎵</div>
          <h3 className="text-xl font-bold text-white mb-2">No songs found</h3>
          <p className="text-zinc-400">Try different keywords or browse by genre</p>
        </div>
      ) : (
        <>
          {searched && (
            <p className="text-zinc-400 text-sm">
              {songs.length} {songs.length === 1 ? 'result' : 'results'}
              {query ? ` for "${query}"` : genre !== 'All' ? ` in ${genre}` : ''}
            </p>
          )}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
          >
            {songs.map((song) => (
              <SongCard key={song._id} song={song} queue={songs} />
            ))}
          </motion.div>
        </>
      )}
    </div>
  )
}