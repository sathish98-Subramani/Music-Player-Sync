// src/pages/HomePage.jsx

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Clock, Music2, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import useAuthStore from '../store/authStore'
import usePlayerStore from '../store/playerStore'
import SongCard from '../components/common/SongCard'
import SongRow from '../components/common/SongRow'
import { SongCardSkeleton, SongRowSkeleton } from '../components/common/Skeleton'

const GREETINGS = ['Good morning', 'Good afternoon', 'Good evening']

const getGreeting = () => {
  const h = new Date().getHours()
  if (h < 12) return GREETINGS[0]
  if (h < 18) return GREETINGS[1]
  return GREETINGS[2]
}

export default function HomePage() {
  const { user } = useAuthStore()
  const { playSong } = usePlayerStore()

  const [trending, setTrending] = useState([])
  const [recent, setRecent] = useState([])
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [trendingRes, recentRes, historyRes] = await Promise.all([
          api.get('/songs/trending'),
          api.get('/songs?limit=12'),
          api.get('/history').catch(() => ({ data: [] })),
        ])

        const trendingData = Array.isArray(trendingRes.data)
          ? trendingRes.data
          : (trendingRes.data?.data || [])

        const recentData = Array.isArray(recentRes.data)
          ? recentRes.data
          : (recentRes.data?.data || [])

        const historyData = Array.isArray(historyRes.data)
          ? historyRes.data
          : (historyRes.data?.data || [])

        setTrending(trendingData)
        setRecent(recentData)
        setHistory(historyData.slice(0, 6))
      } catch (err) {
        console.error('Failed to load home page data:', err)
        setTrending([])
        setRecent([])
        setHistory([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  }

  return (
    <div className="px-6 py-8 space-y-10">
      {/* Header greeting */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="font-display text-3xl font-bold text-white">
            {getGreeting()}, <span className="text-brand">{user?.username || 'User'}</span> 👋
          </h1>
          <p className="text-zinc-400 mt-1">What are you in the mood for today?</p>
        </div>
      </motion.div>

      {/* Quick genre pills */}
      <div className="flex gap-2 flex-wrap">
        {['All', 'Tamil', 'Film', 'Folk', 'Classical', 'Devotional', 'Pop'].map((genre) => (
          <Link
            key={genre}
            to={genre === 'All' ? '/search' : `/search?genre=${genre}`}
            className="px-4 py-2 rounded-full bg-surface-2 hover:bg-brand text-sm font-semibold text-zinc-300 hover:text-white transition-all duration-200"
          >
            {genre}
          </Link>
        ))}
      </div>

      {/* Trending songs */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-bold text-white flex items-center gap-2">
            <TrendingUp size={20} className="text-brand" />
            Trending Now
          </h2>
          <Link to="/search" className="text-sm text-zinc-400 hover:text-white flex items-center gap-1">
            See all <ChevronRight size={14} />
          </Link>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
        >
          {loading
            ? Array(6).fill(0).map((_, i) => <SongCardSkeleton key={i} />)
            : (trending || []).slice(0, 6).map((song) => (
                <motion.div key={song?._id || Math.random()} variants={itemVariants}>
                  <SongCard song={song} queue={trending || []} />
                </motion.div>
              ))}
        </motion.div>
      </section>

      {/* Recently Added */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-bold text-white flex items-center gap-2">
            <Music2 size={20} className="text-brand" />
            Recently Added
          </h2>
        </div>

        <div className="bg-surface-1 rounded-2xl overflow-hidden">
          <div className="grid grid-cols-[40px_1fr_1fr_80px] gap-4 px-4 py-3 border-b border-surface-3 text-xs text-zinc-500 uppercase tracking-wider font-bold">
            <span>#</span>
            <span>Title</span>
            <span className="hidden md:block">Album</span>
            <span className="text-right">Duration</span>
          </div>

          {loading
            ? Array(6).fill(0).map((_, i) => <SongRowSkeleton key={i} />)
            : (recent || []).slice(0, 8).map((song, i) => (
                <SongRow
                  key={song?._id || i}
                  song={song}
                  index={i}
                  queue={recent || []}
                />
              ))}
        </div>
      </section>

      {/* Recently Played */}
      {(history || []).length > 0 && (
        <section>
          <h2 className="font-display text-xl font-bold text-white flex items-center gap-2 mb-4">
            <Clock size={20} className="text-brand" />
            Recently Played
          </h2>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4"
          >
            {(history || []).map((item, index) =>
              item?.song ? (
                <motion.div key={item?._id || index} variants={itemVariants}>
                  <SongCard
                    song={item.song}
                    queue={(history || []).map((h) => h?.song).filter(Boolean)}
                  />
                </motion.div>
              ) : null
            )}
          </motion.div>
        </section>
      )}
    </div>
  )
}