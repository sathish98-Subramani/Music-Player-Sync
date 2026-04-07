// src/components/player/Player.jsx — Sticky bottom music player

import React, { useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play, Pause, SkipBack, SkipForward,
  Shuffle, Repeat, Repeat1, Volume2, VolumeX, Heart
} from 'lucide-react'
import usePlayerStore from '../../store/playerStore'

const DEFAULT_THUMB = 'https://res.cloudinary.com/demo/image/upload/v1/samples/music.jpg'

const formatTime = (s) => {
  if (isNaN(s) || s === 0) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

export default function Player() {
  const audioRef = useRef(null)
  const {
    currentSong, isPlaying, volume, currentTime, duration,
    shuffle, repeat, setAudioRef, setIsPlaying,
    setCurrentTime, setDuration, setVolume,
    seekTo, playNext, playPrev, toggleShuffle, toggleRepeat,
  } = usePlayerStore()

  // Register audioRef in store on mount
  useEffect(() => {
    setAudioRef(audioRef)
  }, [])

  // Sync play/pause state with audio element
  useEffect(() => {
    if (!audioRef.current || !currentSong) return
    if (isPlaying) {
      audioRef.current.play().catch(() => setIsPlaying(false))
    } else {
      audioRef.current.pause()
    }
  }, [isPlaying, currentSong])

  // Load new song when currentSong changes
  useEffect(() => {
    if (!audioRef.current || !currentSong) return
    audioRef.current.src = currentSong.audioUrl
    audioRef.current.load()
    audioRef.current.volume = volume
    audioRef.current.play().catch(() => setIsPlaying(false))
    setIsPlaying(true)
  }, [currentSong?._id])

  const handleTimeUpdate = () => {
    if (audioRef.current) setCurrentTime(audioRef.current.currentTime)
  }

  const handleLoadedMetadata = () => {
    if (audioRef.current) setDuration(audioRef.current.duration)
  }

  const handleEnded = () => {
    playNext()
  }

  const handleSeek = (e) => {
    const val = parseFloat(e.target.value)
    seekTo(val)
  }

  const handleVolume = (e) => {
    const val = parseFloat(e.target.value)
    setVolume(val)
    if (audioRef.current) audioRef.current.volume = val
  }

  const progress = duration ? (currentTime / duration) * 100 : 0

  const RepeatIcon = repeat === 'one' ? Repeat1 : Repeat

  if (!currentSong) return (
    <>
      <audio ref={audioRef} />
      <div className="fixed bottom-0 left-0 right-0 h-20 bg-surface-1 border-t border-surface-3
        flex items-center justify-center z-40">
        <p className="text-zinc-600 text-sm">No song playing — pick one to start!</p>
      </div>
    </>
  )

  return (
    <>
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        crossOrigin="anonymous"
      />

      <AnimatePresence>
        <motion.div
          initial={{ y: 80 }}
          animate={{ y: 0 }}
          className="fixed bottom-0 left-0 right-0 z-40 bg-surface-1/95 backdrop-blur-xl
            border-t border-surface-3 px-4 py-3"
        >
          {/* Progress bar at very top */}
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-surface-3">
            <div
              className="h-full bg-brand transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="max-w-screen-xl mx-auto flex items-center gap-4">
            {/* Song info */}
            <div className="flex items-center gap-3 w-64 shrink-0">
              <div className={`relative w-12 h-12 rounded-lg overflow-hidden shrink-0 ${isPlaying ? 'vinyl-spin' : 'vinyl-spin paused'}`}>
                <img
                  src={currentSong.thumbnailUrl || DEFAULT_THUMB}
                  alt={currentSong.title}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.src = DEFAULT_THUMB }}
                />
              </div>
              <div className="min-w-0">
                <p className="text-white text-sm font-semibold truncate">{currentSong.title}</p>
                <p className="text-zinc-400 text-xs truncate">{currentSong.artist}</p>
              </div>
              <button className="text-zinc-500 hover:text-brand transition-colors shrink-0">
                <Heart size={16} />
              </button>
            </div>

            {/* Controls */}
            <div className="flex-1 flex flex-col items-center gap-2 max-w-xl">
              {/* Control buttons */}
              <div className="flex items-center gap-4">
                <button
                  onClick={toggleShuffle}
                  className={`transition-colors ${shuffle ? 'text-brand' : 'text-zinc-400 hover:text-white'}`}
                >
                  <Shuffle size={16} />
                </button>
                <button
                  onClick={playPrev}
                  className="text-zinc-300 hover:text-white transition-colors"
                >
                  <SkipBack size={20} />
                </button>
                <button
                  onClick={() => usePlayerStore.getState().togglePlay()}
                  className="w-10 h-10 rounded-full bg-white flex items-center justify-center
                    hover:scale-105 active:scale-95 transition-transform"
                >
                  {isPlaying
                    ? <Pause size={18} className="text-black" />
                    : <Play size={18} className="text-black ml-0.5" />
                  }
                </button>
                <button
                  onClick={playNext}
                  className="text-zinc-300 hover:text-white transition-colors"
                >
                  <SkipForward size={20} />
                </button>
                <button
                  onClick={toggleRepeat}
                  className={`transition-colors ${repeat !== 'none' ? 'text-brand' : 'text-zinc-400 hover:text-white'}`}
                >
                  <RepeatIcon size={16} />
                </button>
              </div>

              {/* Seek bar */}
              <div className="flex items-center gap-2 w-full">
                <span className="text-xs text-zinc-500 w-10 text-right">{formatTime(currentTime)}</span>
                <input
                  type="range"
                  min={0}
                  max={duration || 0}
                  value={currentTime}
                  onChange={handleSeek}
                  className="flex-1 h-1 accent-brand"
                  style={{
                    background: `linear-gradient(to right, #E8472A ${progress}%, #444 ${progress}%)`
                  }}
                />
                <span className="text-xs text-zinc-500 w-10">{formatTime(duration)}</span>
              </div>
            </div>

            {/* Volume */}
            <div className="hidden md:flex items-center gap-2 w-40 justify-end shrink-0">
              <button
                onClick={() => setVolume(volume > 0 ? 0 : 0.8)}
                className="text-zinc-400 hover:text-white transition-colors"
              >
                {volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={volume}
                onChange={handleVolume}
                className="w-24 accent-brand"
                style={{
                  background: `linear-gradient(to right, #E8472A ${volume * 100}%, #444 ${volume * 100}%)`
                }}
              />
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  )
}
