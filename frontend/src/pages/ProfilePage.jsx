import React, { useEffect, useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Camera, Save, Lock, Music2, Clock } from 'lucide-react'
import api from '../api/axios'
import useAuthStore from '../store/authStore'
import SongCard from '../components/common/SongCard'
import { SongCardSkeleton } from '../components/common/Skeleton'
import toast from 'react-hot-toast'

export default function ProfilePage() {
  const { id } = useParams()
  const { user, setUser } = useAuthStore()
  const avatarRef = useRef(null)

  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('uploads')
  const [songs, setSongs] = useState([])
  const [history, setHistory] = useState([])
  const [songsLoading, setSongsLoading] = useState(false)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ username: '', bio: '' })
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [saving, setSaving] = useState(false)
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' })
  const [changingPass, setChangingPass] = useState(false)

  const targetId = id || user?.id || user?._id
  const isOwnProfile = !id || id === user?.id || id === user?._id

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get(`/users/${targetId}`)
        const profileData = res?.data?.data || res?.data || null

        setProfile(profileData)

        if (profileData) {
          setForm({
            username: profileData.username || '',
            bio: profileData.bio || '',
          })
        }
      } catch (err) {
        console.error(err)
        toast.error('Profile not found')
      } finally {
        setLoading(false)
      }
    }

    if (targetId) fetchProfile()
  }, [targetId])

  useEffect(() => {
    if (!profile) return

    setSongsLoading(true)

    const fetchContent = async () => {
      try {
        if (tab === 'uploads') {
          const res = await api.get(`/songs?uploadedBy=${profile._id}&limit=20`)
          const songsData = Array.isArray(res.data) ? res.data : res.data?.data || []
          setSongs(songsData)
        } else if (tab === 'history' && isOwnProfile) {
          const res = await api.get('/history')
          const historyData = Array.isArray(res.data) ? res.data : res.data?.data || []
          setHistory(historyData.map((h) => h.song).filter(Boolean))
        }
      } catch (err) {
        console.error(err)
        if (tab === 'uploads') setSongs([])
        if (tab === 'history') setHistory([])
      } finally {
        setSongsLoading(false)
      }
    }

    fetchContent()
  }, [tab, profile, isOwnProfile])

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setAvatarFile(file)

    const reader = new FileReader()
    reader.onload = (event) => setAvatarPreview(event.target?.result)
    reader.readAsDataURL(file)
  }

  const saveProfile = async () => {
    setSaving(true)

    try {
      const fd = new FormData()
      fd.append('username', form.username)
      fd.append('bio', form.bio)
      if (avatarFile) fd.append('avatar', avatarFile)

      const res = await api.put('/users/profile', fd)
      const updatedProfile = res?.data?.data || res?.data

      setProfile(updatedProfile)
      setUser(updatedProfile)
      setEditing(false)
      setAvatarFile(null)
      toast.success('Profile updated!')
    } catch (err) {
      console.error(err)
      toast.error(err?.response?.data?.message || 'Update failed')
    } finally {
      setSaving(false)
    }
  }

  const changePassword = async (e) => {
    e.preventDefault()

    if (passwordForm.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters')
      return
    }

    setChangingPass(true)

    try {
      await api.put('/users/password', passwordForm)
      toast.success('Password changed successfully')
      setPasswordForm({ currentPassword: '', newPassword: '' })
    } catch (err) {
      console.error(err)
      toast.error(err?.response?.data?.message || 'Failed to change password')
    } finally {
      setChangingPass(false)
    }
  }

  if (loading) {
    return (
      <div className="px-6 py-8 space-y-6 max-w-4xl mx-auto">
        <div className="flex gap-6">
          <div className="skeleton w-28 h-28 rounded-full" />
          <div className="space-y-3 flex-1">
            <div className="skeleton h-8 w-48" />
            <div className="skeleton h-4 w-64" />
          </div>
        </div>
      </div>
    )
  }

  if (!profile) return null

  const displayAvatar = avatarPreview || profile.avatar
  const currentList = tab === 'uploads' ? songs : history
  const safeList = Array.isArray(currentList) ? currentList : []

  return (
    <div className="px-6 py-8 space-y-8 max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row gap-6 items-start"
      >
        <div className="relative shrink-0">
          <div className="w-28 h-28 rounded-full overflow-hidden bg-surface-2">
            {displayAvatar ? (
              <img src={displayAvatar} alt={profile.username} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-brand text-white font-display text-4xl font-bold">
                {profile.username?.[0]?.toUpperCase()}
              </div>
            )}
          </div>

          {isOwnProfile && editing && (
            <>
              <button
                onClick={() => avatarRef.current?.click()}
                className="absolute bottom-0 right-0 w-8 h-8 bg-brand rounded-full flex items-center justify-center shadow-lg hover:bg-brand-dark transition-colors"
              >
                <Camera size={14} className="text-white" />
              </button>
              <input
                ref={avatarRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </>
          )}
        </div>

        <div className="flex-1 space-y-3">
          {editing ? (
            <>
              <input
                type="text"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="input-field text-xl font-bold"
                placeholder="Username"
              />
              <textarea
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                className="input-field resize-none"
                rows={3}
                placeholder="Tell us about yourself..."
                maxLength={200}
              />
              <div className="flex gap-3">
                <button onClick={saveProfile} disabled={saving} className="btn-primary flex items-center gap-2">
                  <Save size={15} /> {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => {
                    setEditing(false)
                    setAvatarPreview(null)
                  }}
                  className="btn-ghost border border-surface-4"
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <>
              <h1 className="font-display text-3xl font-bold text-white">{profile.username}</h1>
              <p className="text-zinc-400">{profile.bio || 'No bio yet.'}</p>
              <p className="text-xs text-zinc-600">
                Member since{' '}
                {profile.createdAt
                  ? new Date(profile.createdAt).toLocaleDateString('en-US', {
                      month: 'long',
                      year: 'numeric',
                    })
                  : 'Unknown'}
              </p>
              {isOwnProfile && (
                <button onClick={() => setEditing(true)} className="btn-ghost border border-surface-4 text-sm">
                  Edit Profile
                </button>
              )}
            </>
          )}
        </div>
      </motion.div>

      <div className="flex gap-1 bg-surface-2 p-1 rounded-xl w-fit">
        <button
          onClick={() => setTab('uploads')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            tab === 'uploads' ? 'bg-brand text-white' : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Music2 size={15} /> Uploads
        </button>

        {isOwnProfile && (
          <button
            onClick={() => setTab('history')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              tab === 'history' ? 'bg-brand text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Clock size={15} /> History
          </button>
        )}

        {isOwnProfile && (
          <button
            onClick={() => setTab('security')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              tab === 'security' ? 'bg-brand text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Lock size={15} /> Security
          </button>
        )}
      </div>

      {(tab === 'uploads' || tab === 'history') && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {songsLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {Array(5)
                .fill(0)
                .map((_, i) => (
                  <SongCardSkeleton key={i} />
                ))}
            </div>
          ) : safeList.length === 0 ? (
            <div className="text-center py-16">
              <Music2 size={40} className="text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-400">{tab === 'uploads' ? 'No uploads yet' : 'No history yet'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {safeList.map((song) => (
                <SongCard key={song._id} song={song} queue={safeList} />
              ))}
            </div>
          )}
        </motion.div>
      )}

      {tab === 'security' && isOwnProfile && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-md">
          <div className="bg-surface-1 rounded-2xl p-6 space-y-5">
            <h3 className="font-display text-lg font-bold text-white">Change Password</h3>
            <form onSubmit={changePassword} className="space-y-4">
              <input
                type="password"
                placeholder="Current password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                className="input-field"
                required
              />
              <input
                type="password"
                placeholder="New password (min 6 chars)"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                className="input-field"
                minLength={6}
                required
              />
              <button type="submit" disabled={changingPass} className="btn-primary w-full">
                {changingPass ? 'Changing...' : 'Change Password'}
              </button>
            </form>
          </div>
        </motion.div>
      )}
    </div>
  )
}