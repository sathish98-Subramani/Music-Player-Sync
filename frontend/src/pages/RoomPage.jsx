import React, { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Play, Pause, SkipForward, SkipBack, Users,
  Send, Music2, Crown, LogOut, Radio, Hash
} from 'lucide-react'
import { io } from 'socket.io-client'
import api from '../api/axios'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'
const DEFAULT_THUMB = 'https://res.cloudinary.com/demo/image/upload/v1/samples/music.jpg'

const formatTime = (s) => {
  if (!s || isNaN(s)) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

export default function RoomPage() {
  const { code } = useParams()
  const navigate = useNavigate()
  const { user, token } = useAuthStore()

  const socketRef = useRef(null)
  const audioRef = useRef(null)
  const chatBottomRef = useRef(null)
  const syncIntervalRef = useRef(null)

  const [room, setRoom] = useState(null)
  const [loading, setLoading] = useState(true)
  const [connected, setConnected] = useState(false)
  const [activeUsers, setActiveUsers] = useState([])
  const [messages, setMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [currentSong, setCurrentSong] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [songs, setSongs] = useState([])
  const [showSongs, setShowSongs] = useState(false)

  const isHost = room?.host?._id === user?.id || room?.host?._id === user?._id

  useEffect(() => {
    const init = async () => {
      try {
        const roomRes = await api.get(`/rooms/${code}`)
        const roomData = roomRes?.data?.data || roomRes?.data || null
        setRoom(roomData)

        if (!roomData?._id) {
          throw new Error('Room not found')
        }

        const msgRes = await api.get(`/rooms/${roomData._id}/messages`)
        const messagesData = Array.isArray(msgRes.data) ? msgRes.data : msgRes.data?.data || []
        setMessages(messagesData)

        const songsRes = await api.get('/songs?limit=50')
        const songsData = Array.isArray(songsRes.data) ? songsRes.data : songsRes.data?.data || []
        setSongs(songsData)
      } catch (err) {
        console.error(err)
        toast.error('Room not found')
        navigate('/rooms')
        return
      } finally {
        setLoading(false)
      }

      const socket = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket'],
      })

      socketRef.current = socket

      socket.on('connect', () => {
        setConnected(true)
        socket.emit('join-room', { roomCode: code })
      })

      socket.on('disconnect', () => setConnected(false))

      socket.on('room-state', ({ currentSong, currentTime, isPlaying, users }) => {
        if (currentSong) {
          setCurrentSong(currentSong)
          setIsPlaying(isPlaying)
          setCurrentTime(currentTime)

          if (audioRef.current) {
            audioRef.current.src = currentSong.audioUrl
            audioRef.current.currentTime = currentTime
            if (isPlaying) audioRef.current.play().catch(() => {})
          }
        }
        if (Array.isArray(users)) setActiveUsers(users)
      })

      socket.on('user-joined', ({ user: u, users }) => {
        if (Array.isArray(users)) setActiveUsers(users)
        toast.success(`${u.username} joined the room`)
      })

      socket.on('user-left', ({ username, users }) => {
        if (Array.isArray(users)) setActiveUsers(users)
        toast(`${username} left the room`, { icon: '👋' })
      })

      socket.on('playback-update', ({ action, currentTime: t, isPlaying: playing, song }) => {
        if (action === 'change-song' && song) {
          setCurrentSong(song)
          setIsPlaying(true)
          if (audioRef.current) {
            audioRef.current.src = song.audioUrl
            audioRef.current.currentTime = 0
            audioRef.current.play().catch(() => {})
          }
        }

        if (action === 'play') {
          setIsPlaying(true)
          if (audioRef.current) {
            audioRef.current.currentTime = t
            audioRef.current.play().catch(() => {})
          }
        }

        if (action === 'pause') {
          setIsPlaying(false)
          if (audioRef.current) {
            audioRef.current.currentTime = t
            audioRef.current.pause()
          }
        }

        if (action === 'seek') {
          if (audioRef.current) audioRef.current.currentTime = t
          setCurrentTime(t)
        }
      })

      socket.on('new-message', (msg) => {
        setMessages((prev) => [...prev, msg])
      })

      socket.on('queue-updated', ({ queue }) => {
        setRoom((prev) => (prev ? { ...prev, queue: Array.isArray(queue) ? queue : [] } : prev))
      })

      socket.on('error', ({ message }) => toast.error(message))
    }

    init()

    return () => {
      socketRef.current?.emit('leave-room', { roomCode: code })
      socketRef.current?.disconnect()
      if (syncIntervalRef.current) clearInterval(syncIntervalRef.current)
    }
  }, [code, token, navigate])

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleTimeUpdate = () => {
    if (audioRef.current) setCurrentTime(audioRef.current.currentTime)
  }

  const handleLoadedMetadata = () => {
    if (audioRef.current) setDuration(audioRef.current.duration)
  }

  const emitPlayback = (action, extra = {}) => {
    if (!isHost) return
    socketRef.current?.emit('playback-control', {
      roomCode: code,
      action,
      currentTime: audioRef.current?.currentTime || 0,
      ...extra,
    })
  }

  const handlePlayPause = () => {
    if (!isHost) return toast.error('Only the host can control playback')

    if (isPlaying) {
      audioRef.current?.pause()
      emitPlayback('pause')
      setIsPlaying(false)
    } else {
      audioRef.current?.play().catch(() => {})
      emitPlayback('play')
      setIsPlaying(true)
    }
  }

  const handleSeek = (e) => {
    if (!isHost) return
    const t = parseFloat(e.target.value)
    if (audioRef.current) audioRef.current.currentTime = t
    setCurrentTime(t)
    emitPlayback('seek', { currentTime: t })
  }

  const playSongInRoom = (song) => {
    if (!isHost) return toast.error('Only the host can change songs')

    setCurrentSong(song)
    setIsPlaying(true)

    if (audioRef.current) {
      audioRef.current.src = song.audioUrl
      audioRef.current.currentTime = 0
      audioRef.current.play().catch(() => {})
    }

    emitPlayback('change-song', { song })
    setShowSongs(false)
  }

  const sendMessage = (e) => {
    e.preventDefault()
    if (!chatInput.trim()) return

    socketRef.current?.emit('send-message', {
      roomCode: code,
      text: chatInput.trim(),
    })

    setChatInput('')
  }

  const handleLeave = () => {
    socketRef.current?.emit('leave-room', { roomCode: code })
    navigate('/rooms')
  }

  const progress = duration ? (currentTime / duration) * 100 : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-3">
          <Radio size={40} className="text-brand mx-auto animate-pulse" />
          <p className="text-zinc-400">Connecting to room...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-80px)] gap-0">
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        crossOrigin="anonymous"
      />

      <div className="flex-1 flex flex-col p-6 overflow-y-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-xs text-zinc-400">{connected ? 'Connected' : 'Connecting...'}</span>
            </div>
            <h1 className="font-display text-2xl font-bold text-white">{room?.name || 'Room'}</h1>
            <div className="flex items-center gap-2 text-sm text-zinc-400 mt-1">
              <Hash size={13} />
              <span className="font-mono font-bold tracking-widest">{code}</span>
              <span>•</span>
              <Crown size={13} className="text-yellow-500" />
              <span>Host: {room?.host?.username || 'Unknown'}</span>
            </div>
          </div>
          <button onClick={handleLeave} className="btn-ghost flex items-center gap-2 text-red-400 hover:text-red-300">
            <LogOut size={16} /> Leave
          </button>
        </div>

        <div className="bg-surface-1 rounded-2xl p-6 flex flex-col items-center text-center space-y-4">
          {currentSong ? (
            <>
              <div className={`w-40 h-40 rounded-2xl overflow-hidden shadow-2xl shadow-brand/20 ${isPlaying ? 'vinyl-spin' : 'vinyl-spin paused'}`}>
                <img
                  src={currentSong.thumbnailUrl || DEFAULT_THUMB}
                  alt={currentSong.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = DEFAULT_THUMB
                  }}
                />
              </div>

              <div>
                <h2 className="font-display text-2xl font-bold text-white">{currentSong.title}</h2>
                <p className="text-zinc-400">{currentSong.artist}</p>
              </div>

              <div className="w-full space-y-2">
                <input
                  type="range"
                  min={0}
                  max={duration || 0}
                  value={currentTime}
                  onChange={handleSeek}
                  disabled={!isHost}
                  className="w-full accent-brand disabled:opacity-50"
                  style={{
                    background: `linear-gradient(to right, #E8472A ${progress}%, #444 ${progress}%)`,
                  }}
                />
                <div className="flex justify-between text-xs text-zinc-500">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <button disabled={!isHost} className="text-zinc-400 hover:text-white disabled:opacity-30 transition-colors">
                  <SkipBack size={22} />
                </button>

                <button
                  onClick={handlePlayPause}
                  disabled={!isHost}
                  className="w-14 h-14 rounded-full bg-brand flex items-center justify-center hover:bg-brand-dark active:scale-95 transition-all disabled:opacity-50"
                >
                  {isPlaying ? <Pause size={22} className="text-white" /> : <Play size={22} className="text-white ml-1" />}
                </button>

                <button disabled={!isHost} className="text-zinc-400 hover:text-white disabled:opacity-30 transition-colors">
                  <SkipForward size={22} />
                </button>
              </div>

              {!isHost && (
                <p className="text-xs text-zinc-500 bg-surface-2 px-3 py-1.5 rounded-full">
                  🎵 Listening — host controls playback
                </p>
              )}
            </>
          ) : (
            <div className="py-10 space-y-4">
              <Music2 size={48} className="text-zinc-700 mx-auto" />
              <p className="text-zinc-400">No song playing</p>
              {isHost && (
                <button onClick={() => setShowSongs(true)} className="btn-primary">
                  Pick a Song
                </button>
              )}
            </div>
          )}
        </div>

        <div className="bg-surface-1 rounded-2xl p-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
            <Users size={16} className="text-brand" />
            In Room ({activeUsers.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {Array.isArray(activeUsers) &&
              activeUsers.map((u) => (
                <div key={u.socketId} className="flex items-center gap-2 bg-surface-2 px-3 py-1.5 rounded-full text-sm">
                  {u.avatar ? (
                    <img src={u.avatar} alt={u.username} className="w-5 h-5 rounded-full object-cover" />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-brand flex items-center justify-center text-xs text-white font-bold">
                      {u.username?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <span className="text-zinc-300">{u.username}</span>
                  {room?.host?._id === u.userId && <Crown size={11} className="text-yellow-500" />}
                </div>
              ))}
          </div>
        </div>

        {isHost && (
          <button
            onClick={() => setShowSongs(!showSongs)}
            className="btn-ghost border border-surface-4 w-full flex items-center justify-center gap-2"
          >
            <Music2 size={16} /> {showSongs ? 'Hide' : 'Change Song'}
          </button>
        )}

        {showSongs && (
          <div className="bg-surface-1 rounded-2xl p-4 max-h-64 overflow-y-auto space-y-1">
            {Array.isArray(songs) &&
              songs.map((song) => (
                <div
                  key={song._id}
                  onClick={() => playSongInRoom(song)}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-2 cursor-pointer"
                >
                  <img
                    src={song.thumbnailUrl || DEFAULT_THUMB}
                    alt={song.title}
                    className="w-10 h-10 rounded-lg object-cover"
                    onError={(e) => {
                      e.target.src = DEFAULT_THUMB
                    }}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{song.title}</p>
                    <p className="text-xs text-zinc-400 truncate">{song.artist}</p>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-surface-3 flex flex-col h-80 lg:h-full">
        <div className="px-4 py-3 border-b border-surface-3">
          <h3 className="font-bold text-white text-sm">Room Chat</h3>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {messages.length === 0 && (
            <p className="text-zinc-600 text-xs text-center mt-4">No messages yet. Say hi! 👋</p>
          )}

          {Array.isArray(messages) &&
            messages.map((msg) => {
              const isMe = msg.sender?._id === user?.id || msg.sender?._id === user?._id

              return (
                <div key={msg._id} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                  <div className="w-7 h-7 rounded-full bg-brand/30 flex items-center justify-center text-xs font-bold text-brand shrink-0">
                    {msg.sender?.username?.[0]?.toUpperCase()}
                  </div>

                  <div className={`max-w-[200px] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                    {!isMe && <span className="text-xs text-zinc-500">{msg.sender?.username}</span>}
                    <div className={`px-3 py-2 rounded-2xl text-sm ${isMe ? 'bg-brand text-white rounded-tr-sm' : 'bg-surface-2 text-zinc-200 rounded-tl-sm'}`}>
                      {msg.text}
                    </div>
                  </div>
                </div>
              )
            })}

          <div ref={chatBottomRef} />
        </div>

        <form onSubmit={sendMessage} className="px-3 py-3 border-t border-surface-3 flex gap-2">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Type a message..."
            maxLength={500}
            className="flex-1 bg-surface-2 text-white text-sm rounded-xl px-3 py-2 placeholder-zinc-500 border border-surface-4 focus:border-brand transition-colors"
          />
          <button
            type="submit"
            disabled={!chatInput.trim()}
            className="p-2 bg-brand rounded-xl text-white hover:bg-brand-dark disabled:opacity-40 active:scale-95 transition-all"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  )
}