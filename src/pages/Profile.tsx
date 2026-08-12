import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Pencil, Check, X, Clock, Flame, StickyNote, RefreshCw } from 'lucide-react'
import { store, getStickyStyle, getMemeRank, getProgress, getProgressColor, type LearningLog, type User, type StickyColor } from '../lib/store'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import ProgressBar from '../components/ProgressBar'

const ROTATIONS = ['-rotate-2', 'rotate-1', '-rotate-1', 'rotate-2', '-rotate-2', 'rotate-1']

// A selection of seeds for the avatar picker
const AVATAR_SEEDS = ['pixel', 'nova', 'echo', 'orbit', 'circuit', 'glitch', 'binary', 'pulse', 'forge', 'atlas', 'spark', 'helix']

function StatNote({ bg, icon, label, value, sub }: { bg: string; icon: React.ReactNode; label: string; value: string; sub: string }) {
  return (
    <div className="relative border-2 border-slate-900 shadow-neo p-5 pt-7" style={{ background: bg }}>
      <div className="push-pin" />
      <div className="flex items-center gap-2 mb-1 text-slate-600">
        {icon}
        <span className="font-mono text-[10px] uppercase tracking-widest">{label}</span>
      </div>
      <p className="font-caveat text-3xl font-bold text-slate-900 leading-none">{value}</p>
      <p className="font-caveat text-sm text-slate-600 mt-0.5">{sub}</p>
    </div>
  )
}

export default function Profile() {
  const { userId }  = useParams<{ userId: string }>()
  const { user: me, refreshUser } = useAuth()
  const navigate    = useNavigate()

  const [profile,   setProfile]   = useState<User | null>(null)
  const [logs,      setLogs]      = useState<LearningLog[]>([])
  const [editing,   setEditing]   = useState(false)
  const [saveError, setSaveError] = useState('')

  // edit fields
  const [editUsername,   setEditUsername]   = useState('')
  const [editBio,        setEditBio]        = useState('')
  const [editAvatarSeed, setEditAvatarSeed] = useState('')
  const [customSeed,     setCustomSeed]     = useState('')

  const isOwnProfile = me?.id === userId

  function load() {
    if (!userId) { navigate('/feed'); return }
    const p = store.getUser(userId)
    if (!p) { navigate('/feed'); return }
    setProfile(p)
    setLogs(store.getLogs(userId))
    setEditUsername(p.username)
    setEditBio(p.bio ?? '')
    // extract seed from avatar_url
    const match = p.avatar_url.match(/seed=([^&]+)/)
    setEditAvatarSeed(match ? match[1] : p.username)
    setCustomSeed(match ? match[1] : p.username)
  }

  useEffect(() => { load() }, [userId])

  function handleSave() {
    if (!profile || !me) return
    setSaveError('')
    const result = store.updateProfile(profile.id, {
      username:   editUsername.trim() || undefined,
      bio:        editBio,
      avatarSeed: editAvatarSeed,
    })
    if ('error' in result) { setSaveError(result.error); return }
    setEditing(false)
    load()
    refreshUser()
  }

  function cancelEdit() {
    if (!profile) return
    setEditing(false)
    setSaveError('')
    setEditUsername(profile.username)
    setEditBio(profile.bio ?? '')
    const match = profile.avatar_url.match(/seed=([^&]+)/)
    const seed = match ? match[1] : profile.username
    setEditAvatarSeed(seed)
    setCustomSeed(seed)
  }

  if (!profile) return null

  const streak     = profile.current_streak
  const totalMins  = logs.reduce((s, l) => s + l.minutes_spent, 0)
  const totalHours = Math.floor(totalMins / 60)
  const completedSessions = logs.filter((l) => getProgress(l) >= 100).length

  return (
    <div className="min-h-screen" style={{ background: '#e8d5b7' }}>
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 py-8">

        {/* ── Profile header card ── */}
        <motion.div
          className="relative bg-yellow-100 border-2 border-slate-900 p-7 pt-10 mb-8"
          style={{ boxShadow: '6px 6px 0px 0px rgba(15,23,42,1)' }}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 240, damping: 22 }}
        >
          <div className="push-pin" />

          <div className="flex flex-col sm:flex-row gap-6 items-start">
            {/* Avatar */}
            <div className="shrink-0 relative">
              <img
                src={editing
                  ? `https://api.dicebear.com/7.x/bottts/svg?seed=${editAvatarSeed}`
                  : profile.avatar_url}
                alt={profile.username}
                className="w-24 h-24 rounded-full border-4 border-slate-900 bg-white"
                style={{ boxShadow: '4px 4px 0 rgba(15,23,42,1)' }}
              />
              {streak > 0 && (
                <div className="absolute -bottom-2 -right-2 flex items-center gap-1 px-2 py-0.5 bg-orange-100 border-2 border-slate-900 text-xs font-bold font-mono">
                  <span className="fire-animate">🔥</span>{streak}d
                </div>
              )}
            </div>

            {/* Info / edit form */}
            <div className="flex-1 min-w-0">
              {editing ? (
                <div className="space-y-4">
                  {/* Username */}
                  <div>
                    <label className="block text-xs font-mono font-bold text-slate-600 uppercase tracking-wider mb-1">Username</label>
                    <input value={editUsername} onChange={(e) => setEditUsername(e.target.value)}
                      className="w-full max-w-xs px-3 py-2 border-2 border-slate-900 bg-white font-mono text-sm outline-none focus:ring-2 focus:ring-yellow-400" />
                  </div>

                  {/* Bio */}
                  <div>
                    <label className="block text-xs font-mono font-bold text-slate-600 uppercase tracking-wider mb-1">Bio</label>
                    <textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} rows={2}
                      placeholder="Tell people who you are..."
                      className="w-full px-3 py-2 border-2 border-slate-900 bg-white font-caveat text-base outline-none focus:ring-2 focus:ring-yellow-400 resize-none" />
                  </div>

                  {/* Avatar picker */}
                  <div>
                    <label className="block text-xs font-mono font-bold text-slate-600 uppercase tracking-wider mb-2">Avatar Style</label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {AVATAR_SEEDS.map((seed) => (
                        <button key={seed} type="button" onClick={() => { setEditAvatarSeed(seed); setCustomSeed(seed) }}
                          className={`w-10 h-10 rounded-full border-2 transition-all hover:scale-110 bg-white overflow-hidden ${
                            editAvatarSeed === seed ? 'border-slate-900 scale-110' : 'border-slate-300'
                          }`}
                          style={{ boxShadow: editAvatarSeed === seed ? '2px 2px 0 rgba(15,23,42,1)' : 'none' }}
                        >
                          <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${seed}`} alt={seed} className="w-full h-full" />
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <input value={customSeed}
                        onChange={(e) => { setCustomSeed(e.target.value); setEditAvatarSeed(e.target.value) }}
                        placeholder="or type any seed..."
                        className="px-3 py-1.5 border-2 border-slate-900 bg-white font-mono text-xs outline-none focus:ring-2 focus:ring-yellow-400 w-44" />
                      <button type="button" onClick={() => setEditAvatarSeed(Math.random().toString(36).slice(2))}
                        className="flex items-center gap-1 px-3 py-1.5 border-2 border-slate-900 bg-white font-mono text-xs font-bold hover:bg-yellow-50 transition-colors shadow-neo">
                        <RefreshCw size={11} /> Random
                      </button>
                    </div>
                  </div>

                  {saveError && <p className="font-mono text-xs text-red-600 font-bold">{saveError}</p>}

                  <div className="flex gap-3 pt-1">
                    <button onClick={handleSave}
                      className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-yellow-300 font-bold border-2 border-slate-900 shadow-neo hover:shadow-neo-hover hover:-translate-y-0.5 transition-all">
                      <Check size={15} /> Save Profile
                    </button>
                    <button onClick={cancelEdit}
                      className="flex items-center gap-2 px-4 py-2.5 bg-white text-slate-800 font-bold border-2 border-slate-900 shadow-neo hover:bg-slate-50 transition-all">
                      <X size={15} /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-start gap-3 flex-wrap">
                    <div>
                      <h1 className="font-caveat text-4xl font-bold text-slate-900 leading-tight">{profile.username}</h1>
                      <p className="font-caveat text-lg text-slate-600 mt-0.5">{getMemeRank(streak)}</p>
                    </div>
                    {isOwnProfile && (
                      <button onClick={() => setEditing(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-slate-900 shadow-neo hover:shadow-neo-hover hover:-translate-y-0.5 transition-all font-bold text-sm text-slate-800 mt-1">
                        <Pencil size={14} /> Edit Profile
                      </button>
                    )}
                  </div>
                  {profile.bio ? (
                    <p className="font-caveat text-lg text-slate-700 mt-3 max-w-xl leading-relaxed">{profile.bio}</p>
                  ) : isOwnProfile ? (
                    <p className="font-caveat text-base text-slate-400 mt-3 italic">No bio yet — add one to let people know who you are!</p>
                  ) : null}
                  <p className="font-mono text-xs text-slate-400 mt-3">
                    Member since {new Date(profile.created_at).toLocaleDateString('en', { month: 'long', year: 'numeric' })}
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* ── Stats row ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
          <StatNote bg="#fef9c3" icon={<Clock size={15} />} label="Total Hours" value={`${totalHours}h`} sub="of focused study" />
          <StatNote bg="#d1fae5" icon={<Flame size={15} />} label="Current Streak" value={streak > 0 ? `🔥 ${streak} days` : '0 days'} sub={getMemeRank(streak)} />
          <StatNote bg="#ede9fe" icon={<StickyNote size={15} />} label="Sessions" value={`${logs.length}`} sub={`${completedSessions} fully completed`} />
        </div>

        {/* ── Study Board ── */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-caveat text-3xl font-bold text-slate-900">
            {isOwnProfile ? 'My Study Board 📋' : `${profile.username}'s Study Board 📋`}
          </h2>
          {isOwnProfile && (
            <Link to="/dashboard"
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-yellow-300 font-bold border-2 border-slate-900 shadow-neo hover:shadow-neo-hover hover:-translate-y-0.5 transition-all text-sm">
              + Add New Log
            </Link>
          )}
        </div>

        {logs.length === 0 ? (
          <div className="text-center py-20 bg-white border-2 border-slate-900 shadow-neo">
            <p className="text-6xl mb-4">🌿</p>
            <p className="font-caveat text-2xl font-bold text-slate-900">No logs yet</p>
            <p className="font-caveat text-lg text-slate-600 mt-1">
              {isOwnProfile ? 'Go to your dashboard and slap a log! 📌' : 'This person is still getting started.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {logs.map((log, i) => {
              const s   = getStickyStyle(log.sticky_color as StickyColor)
              const pct = getProgress(log)
              const col = getProgressColor(pct)
              return (
                <motion.div
                  key={log.id}
                  className={`relative border-2 border-slate-900 p-5 pt-8 ${ROTATIONS[i % ROTATIONS.length]} hover:rotate-0 hover:scale-[1.03] hover:z-10 transition-all duration-300`}
                  style={{ background: s.bg, boxShadow: '4px 4px 0px 0px rgba(15,23,42,1)' }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, type: 'spring', stiffness: 260, damping: 22 }}
                >
                  <div className="push-pin" />

                  <Link to={`/log/${log.id}`}>
                    <h3 className="font-caveat text-lg font-bold text-slate-900 leading-snug mb-2 hover:underline decoration-2 underline-offset-2 line-clamp-2">
                      {log.topic}
                    </h3>
                  </Link>

                  <div className="inline-flex items-center gap-1.5 px-2 py-1 border border-slate-700 mb-2"
                    style={{ background: 'rgba(255,255,255,0.55)' }}>
                    <span className="text-xs">⏱️</span>
                    <span className="font-mono text-xs font-bold text-slate-800">
                      {log.minutes_spent >= 60
                        ? `${Math.floor(log.minutes_spent / 60)}h ${log.minutes_spent % 60}m`
                        : `${log.minutes_spent}m`}
                    </span>
                  </div>

                  {log.description && (
                    <p className="font-caveat text-sm text-slate-700 leading-relaxed mb-2 line-clamp-2">{log.description}</p>
                  )}

                  <ProgressBar log={log} compact />

                  <div className="flex items-center justify-between mt-3">
                    <p className="font-mono text-xs text-slate-400">
                      {new Date(log.date_logged).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                    </p>
                    {pct >= 100 && (
                      <span className="font-mono text-xs font-bold" style={{ color: col }}>✅ Done</span>
                    )}
                    <Link to={`/log/${log.id}`}
                      className="font-mono text-xs font-bold text-slate-500 hover:text-slate-900 underline transition-colors">
                      View →
                    </Link>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
