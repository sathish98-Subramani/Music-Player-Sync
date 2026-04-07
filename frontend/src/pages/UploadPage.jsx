import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Upload, Music, Image as ImageIcon, X, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import api from '../api/axios'

const GENRES = ['Tamil', 'Film', 'Folk', 'Classical', 'Devotional', 'Pop', 'Hip-Hop', 'Other']

export default function UploadPage() {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    title: '',
    artist: '',
    album: '',
    genre: 'Tamil',
  })

  const [audioFile, setAudioFile] = useState(null)
  const [thumbnailFile, setThumbnailFile] = useState(null)
  const [thumbnailPreview, setThumbnailPreview] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleAudioChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const allowedTypes = [
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/x-wav',
      'audio/ogg',
      'audio/flac',
      'audio/x-flac',
      'audio/mp4',
      'audio/x-m4a',
    ]

    const isValidMime = allowedTypes.includes(file.type)
    const isValidExt = /\.(mp3|wav|ogg|flac|m4a)$/i.test(file.name)

    if (!isValidMime && !isValidExt) {
      toast.error('Please select a valid audio file (mp3, wav, ogg, flac, m4a)')
      return
    }

    setAudioFile(file)

    if (!form.title) {
      const fileName = file.name.replace(/\.[^/.]+$/, '')
      setForm((prev) => ({ ...prev, title: fileName }))
    }
  }

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file')
      return
    }

    setThumbnailFile(file)
    setThumbnailPreview(URL.createObjectURL(file))
  }

  const removeAudio = () => {
    setAudioFile(null)
  }

  const removeThumbnail = () => {
    setThumbnailFile(null)
    setThumbnailPreview('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!audioFile) {
      toast.error('Please select an audio file')
      return
    }

    if (!form.title.trim() || !form.artist.trim()) {
      toast.error('Please fill in title and artist')
      return
    }

    try {
      setUploading(true)
      setUploadProgress(0)

      const formData = new FormData()
      formData.append('audio', audioFile)
      if (thumbnailFile) {
        formData.append('thumbnail', thumbnailFile)
      }

      Object.entries(form).forEach(([key, value]) => {
        formData.append(key, value)
      })

      await api.post('/songs', formData, {
        onUploadProgress: (e) => {
          if (e.total) {
            const pct = Math.round((e.loaded * 100) / e.total)
            setUploadProgress(pct)
          }
        },
      })

      toast.success('Song uploaded successfully!')
      navigate('/library')
    } catch (err) {
      console.error(err)
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Upload failed'
      toast.error(message)
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  return (
    <div className="px-6 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="font-display text-4xl font-bold text-white mb-2">Upload Song</h1>
          <p className="text-zinc-400">Share your music with the Tamil Sync community</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-3">
                  Audio File
                </label>

                {!audioFile ? (
                  <label className="border-2 border-dashed border-zinc-700 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:border-brand transition-colors bg-surface-1 min-h-[250px]">
                    <Music size={48} className="text-brand mb-4" />
                    <p className="text-white font-semibold mb-2">Choose audio file</p>
                    <p className="text-zinc-400 text-sm">MP3, WAV, OGG, FLAC, M4A</p>
                    <input
                      type="file"
                      accept=".mp3,.wav,.ogg,.flac,.m4a,audio/*"
                      onChange={handleAudioChange}
                      className="hidden"
                    />
                  </label>
                ) : (
                  <div className="border-2 border-dashed border-brand rounded-2xl p-8 bg-brand/5 min-h-[250px] flex flex-col items-center justify-center text-center relative">
                    <button
                      type="button"
                      onClick={removeAudio}
                      className="absolute top-4 right-4 text-zinc-400 hover:text-white"
                    >
                      <X size={20} />
                    </button>
                    <Music size={48} className="text-brand mb-4" />
                    <p className="text-white font-semibold mb-2">{audioFile.name}</p>
                    <p className="text-zinc-400 text-sm">
                      {(audioFile.size / (1024 * 1024)).toFixed(1)} MB
                    </p>
                    <button
                      type="button"
                      onClick={removeAudio}
                      className="mt-4 text-sm text-red-400 hover:text-red-300"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-3">
                  Cover Art
                </label>

                {!thumbnailPreview ? (
                  <label className="border-2 border-dashed border-zinc-700 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-brand transition-colors bg-surface-1 h-48">
                    <ImageIcon size={36} className="text-zinc-500 mb-3" />
                    <p className="text-zinc-300 font-medium mb-1">Upload cover image</p>
                    <p className="text-zinc-500 text-sm">JPG, PNG, WEBP</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleThumbnailChange}
                      className="hidden"
                    />
                  </label>
                ) : (
                  <div className="relative rounded-2xl overflow-hidden h-48 bg-surface-1">
                    <img
                      src={thumbnailPreview}
                      alt="Thumbnail preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={removeThumbnail}
                      className="absolute top-3 right-3 bg-black/70 text-white p-2 rounded-full hover:bg-black"
                    >
                      <X size={18} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Title</label>
                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="Song title"
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Artist</label>
                <input
                  type="text"
                  name="artist"
                  value={form.artist}
                  onChange={handleChange}
                  placeholder="Artist name"
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Album</label>
                <input
                  type="text"
                  name="album"
                  value={form.album}
                  onChange={handleChange}
                  placeholder="Album (optional)"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Genre</label>
                <select
                  name="genre"
                  value={form.genre}
                  onChange={handleChange}
                  className="input-field"
                >
                  {GENRES.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              {uploading && (
                <div>
                  <div className="flex justify-between text-sm text-zinc-400 mb-2">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-brand h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={uploading}
                className="w-full bg-brand hover:bg-brand/90 disabled:opacity-60 text-white font-semibold py-4 rounded-2xl transition-all duration-200 flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload size={18} />
                    Upload Song
                  </>
                )}
              </button>

              <div className="bg-surface-1 border border-zinc-800 rounded-2xl p-4 text-sm text-zinc-400">
                Upload files that you own or have rights to. All uploads are shared with the community.
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}