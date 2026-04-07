// src/store/playerStore.js — Global music player state

import { create } from 'zustand'
import api from '../api/axios'

const usePlayerStore = create((set, get) => ({
  currentSong: null,
  queue: [],
  queueIndex: 0,
  isPlaying: false,
  volume: 0.8,
  currentTime: 0,
  duration: 0,
  shuffle: false,
  repeat: 'none', // 'none' | 'one' | 'all'
  audioRef: null,

  // Set the audio element ref from the Player component
  setAudioRef: (ref) => set({ audioRef: ref }),

  // Play a specific song (optionally set a queue)
  playSong: async (song, queue = null) => {
    const { audioRef } = get()
    if (queue) {
      const idx = queue.findIndex((s) => s._id === song._id)
      set({ queue, queueIndex: idx >= 0 ? idx : 0 })
    }
    set({ currentSong: song, isPlaying: true, currentTime: 0 })
    // Track play count
    try { await api.post(`/songs/${song._id}/play`) } catch (_) {}
  },

  // Toggle play/pause
  togglePlay: () => {
    const { audioRef, isPlaying } = get()
    if (!audioRef?.current) return
    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    set({ isPlaying: !isPlaying })
  },

  setIsPlaying: (val) => set({ isPlaying: val }),
  setCurrentTime: (t) => set({ currentTime: t }),
  setDuration: (d) => set({ duration: d }),
  setVolume: (v) => {
    const { audioRef } = get()
    if (audioRef?.current) audioRef.current.volume = v
    set({ volume: v })
  },

  // Seek to a specific time
  seekTo: (time) => {
    const { audioRef } = get()
    if (audioRef?.current) audioRef.current.currentTime = time
    set({ currentTime: time })
  },

  // Next song
  playNext: () => {
    const { queue, queueIndex, shuffle, repeat, playSong } = get()
    if (!queue.length) return

    if (repeat === 'one') {
      const song = queue[queueIndex]
      playSong(song)
      return
    }

    let nextIdx
    if (shuffle) {
      nextIdx = Math.floor(Math.random() * queue.length)
    } else {
      nextIdx = queueIndex + 1
      if (nextIdx >= queue.length) {
        if (repeat === 'all') nextIdx = 0
        else { set({ isPlaying: false }); return }
      }
    }
    set({ queueIndex: nextIdx })
    playSong(queue[nextIdx])
  },

  // Previous song
  playPrev: () => {
    const { queue, queueIndex, currentTime, playSong } = get()
    if (!queue.length) return
    // If more than 3s in, restart current song
    if (currentTime > 3) {
      playSong(queue[queueIndex])
      return
    }
    const prevIdx = queueIndex > 0 ? queueIndex - 1 : queue.length - 1
    set({ queueIndex: prevIdx })
    playSong(queue[prevIdx])
  },

  toggleShuffle: () => set((s) => ({ shuffle: !s.shuffle })),
  toggleRepeat: () => set((s) => {
    const map = { none: 'all', all: 'one', one: 'none' }
    return { repeat: map[s.repeat] }
  }),

  addToQueue: (song) => {
    const { queue } = get()
    if (!queue.find((s) => s._id === song._id)) {
      set({ queue: [...queue, song] })
    }
  },

  clearQueue: () => set({ queue: [], queueIndex: 0 }),
}))

export default usePlayerStore
