import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, ChevronDown, Users } from 'lucide-react'
import { store, getStickyStyle, getMemeRank, type LearningLog, type StickyColor } from '../lib/store'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import ProgressBar from '../components/ProgressBar'

const REACTIONS = ['🔥', '🗿', '🧠', '💀', '👏']
const ROTATIONS = ['-rotate-1', 'rotate-1', '-rotate-2', 'rotate-2', '-rotate-1', 'rotate-1']

interface FeedItem extends LearningLog {
  username: string
  avatar_url: string
  user_streak: number
  reactionCounts: Record<string, number>
  myReactions: string[]
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60_000)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default function Feed() {
  const { user } = useAuth()
  const [items,      setItems]      = useState<FeedItem[]>([])
  const [poppingKey, setPoppingKey] = useState<string | null>(null)

  // search + filter
  const [query,          setQuery]          = useState('')
  const [selectedUserId, setSelectedUserId] = useState<string>('all')
  const [userDropOpen,   setUserDropOpen]   = useState(false)

  const allUsers = useMemo(() => store.getAllUsers(), [])

  const buildFeed = useCallback(() => {
    const logs      = store.getLogs()
    const users     = store.getAllUsers()
    const reactions = store.getReactions()
    const userMap   = new Map(users.map((u) => [u.id, u]))

    const feed: FeedItem[] = logs.map((log) => {
      const u         = userMap.get(log.user_id)
      const logRxns   = reactions.filter((r) => r.log_id === log.id)
      const reactionCounts: Record<string, number> = {}
      const myReactions: string[] = []
      for (const r of logRxns) {
        reactionCounts[r.reaction_type] = (reactionCounts[r.reaction_type] ?? 0) + 1
        if (r.user_id === user?.id) myReactions.push(r.reaction_type)
      }
      return {
        ...log,
        username:    u?.username    ?? 'unknown',
        avatar_url:  u?.avatar_url  ?? `https://api.dicebear.com/7.x/bottts/svg?seed=${log.user_id}`,
        user_streak: u?.current_streak ?? 0,
        reactionCounts,
        myReactions,
      }
    })
    setItems(feed)
  }, [user])

  useEffect(() => { buildFeed() }, [buildFeed])

  // Filtered items
  const filtered = useMemo(() => {
    let list = items
    if (selectedUserId !== 'all') list = list.filter((i) => i.user_id === selectedUserId)
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter(
        (i) =>
          i.topic.toLowerCase().includes(q) ||
          i.description?.toLowerCase().includes(q) ||
          i.username.toLowerCase().includes(q),
      )
    }
    return list
  }, [items, query, selectedUserId])

  function handleReaction(logId: string, emoji: string) {
    if (!user) return
    const key = `${logId}-${emoji}`
    setPoppingKey(key)
    setTimeout(() => setPoppingKey(null), 350)
    store.toggleReaction(logId, user.id, emoji)
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== logId) return item
        const alreadyMine = item.myReactions.includes(emoji)
        const newCounts   = { ...item.reactionCounts }
        const newMine     = [...item.myReactions]
        if (alreadyMine) {
          newCounts[emoji] = Math.max((newCounts[emoji] ?? 1) - 1, 0)
          newMine.splice(newMine.indexOf(emoji), 1)
        } else {
          newCounts[emoji] = (newCounts[emoji] ?? 0) + 1
          newMine.push(emoji)
        }
        return { ...item, reactionCounts: newCounts, myReactions: newMine }
      }),
    )
  }

  const selectedUser = allUsers.find((u) => u.id === selectedUserId)

  return (
    <div className="min-h-screen" style={{ background: '#e8d5b7' }}>
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Page header */}
        <div className="mb-6">
          <h1 className="font-caveat text-4xl font-bold text-slate-900">Friend Wall 🧱</h1>
          <p className="font-caveat text-xl text-slate-600 mt-1">See what your fellow grinders are up to</p>
        </div>

        {/* ── Search + Filter bar ── */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8 p-4 bg-white border-2 border-slate-900 shadow-neo">
          {/* Search */}
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search topics, notes, or usernames..."
              className="w-full pl-9 pr-9 py-2.5 bg-slate-50 border-2 border-slate-900 text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-yellow-400 font-mono text-sm"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* User filter dropdown */}
          <div className="relative shrink-0">
            <button
              onClick={() => setUserDropOpen(!userDropOpen)}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border-2 border-slate-900 font-bold text-sm text-slate-800 hover:bg-yellow-50 transition-colors min-w-[180px]"
            >
              {selectedUserId === 'all' ? (
                <><Users size={15} /> <span>All Friends</span></>
              ) : (
                <>
                  <img src={selectedUser?.avatar_url} alt="" className="w-5 h-5 rounded-full border border-slate-700" />
                  <span className="truncate max-w-[110px]">{selectedUser?.username}</span>
                </>
              )}
              <ChevronDown size={14} className={`ml-auto transition-transform ${userDropOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {userDropOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setUserDropOpen(false)} />
                  <motion.div
                    className="absolute right-0 top-full mt-1 w-56 bg-white border-2 border-slate-900 shadow-neo-lg z-40 overflow-hidden"
                    initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.15 }}
                  >
                    <button
                      onClick={() => { setSelectedUserId('all'); setUserDropOpen(false) }}
                      className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm font-bold transition-colors border-b-2 border-slate-100 ${
                        selectedUserId === 'all' ? 'bg-yellow-100 text-slate-900' : 'text-slate-700 hover:bg-yellow-50'
                      }`}
                    >
                      <Users size={15} /> All Friends
                    </button>
                    {allUsers.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => { setSelectedUserId(u.id); setUserDropOpen(false) }}
                        className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm font-bold transition-colors border-b border-slate-100 ${
                          selectedUserId === u.id ? 'bg-yellow-100 text-slate-900' : 'text-slate-700 hover:bg-yellow-50'
                        }`}
                      >
                        <img src={u.avatar_url} alt={u.username} className="w-6 h-6 rounded-full border border-slate-700 shrink-0" />
                        <span className="truncate">{u.username}</span>
                        {u.current_streak > 0 && (
                          <span className="ml-auto font-mono text-xs text-orange-600 shrink-0">🔥{u.current_streak}</span>
                        )}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Result count */}
        {(query || selectedUserId !== 'all') && (
          <div className="flex items-center gap-3 mb-5">
            <p className="font-mono text-sm text-slate-600">
              <span className="font-bold text-slate-900">{filtered.length}</span> result{filtered.length !== 1 ? 's' : ''}
              {query && <span> for "<span className="font-bold text-yellow-700">{query}</span>"</span>}
              {selectedUserId !== 'all' && <span> by <span className="font-bold">{selectedUser?.username}</span></span>}
            </p>
            <button
              onClick={() => { setQuery(''); setSelectedUserId('all') }}
              className="flex items-center gap-1 px-3 py-1 bg-white border-2 border-slate-900 shadow-neo text-xs font-bold hover:bg-yellow-50 transition-colors"
            >
              <X size={11} /> Clear
            </button>
          </div>
        )}

        {/* Cards */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 bg-white border-2 border-slate-900 shadow-neo">
            <p className="text-6xl mb-4">{items.length === 0 ? '👻' : '🔍'}</p>
            <p className="font-caveat text-2xl font-bold text-slate-900">
              {items.length === 0 ? 'The wall is empty' : 'No results found'}
            </p>
            <p className="font-caveat text-lg text-slate-600 mt-1">
              {items.length === 0
                ? "Nobody has logged anything yet. Be the first! 🏆"
                : "Try a different search or clear the filters."}
            </p>
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-6">
            {filtered.map((item, i) => {
              const s      = getStickyStyle((item.sticky_color ?? 'bg-yellow-100') as StickyColor)
              const rot    = ROTATIONS[i % ROTATIONS.length]
              const isOwn  = item.user_id === user?.id

              return (
                <motion.div
                  key={item.id}
                  className={`relative border-2 border-slate-900 p-5 pt-8 mb-6 break-inside-avoid group ${rot} hover:rotate-0 hover:scale-[1.02] hover:z-10 transition-all duration-300`}
                  style={{ background: s.bg, boxShadow: '4px 4px 0px 0px rgba(15,23,42,1)' }}
                  initial={{ opacity: 0, y: 28 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.045, 0.4), type: 'spring', stiffness: 200, damping: 22 }}
                >
                  <div className="push-pin" />

                  {/* User header */}
                  <div className="flex items-center gap-2 mb-3">
                    <img src={item.avatar_url} alt={item.username} className="w-8 h-8 rounded-full border-2 border-slate-900 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-sm text-slate-900 truncate leading-tight">
                        {item.username}
                        {isOwn && <span className="ml-1.5 text-xs font-mono text-slate-400 font-normal">(you)</span>}
                      </p>
                      <p className="font-mono text-xs text-slate-500">{timeAgo(item.created_at)}</p>
                    </div>
                    {item.user_streak > 0 && (
                      <span className="shrink-0 text-sm font-bold text-orange-600">
                        <span className="fire-animate">🔥</span>{item.user_streak}
                      </span>
                    )}
                  </div>

                  {/* Topic — links to detail */}
                  <Link to={`/log/${item.id}`}>
                    <h3 className="font-caveat text-xl font-bold text-slate-900 leading-snug mb-2 hover:underline decoration-2 underline-offset-2">
                      {item.topic}
                    </h3>
                  </Link>

                  {/* Duration */}
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 border border-slate-700 mb-2"
                    style={{ background: 'rgba(255,255,255,0.5)' }}>
                    <span className="text-xs">⏱️</span>
                    <span className="font-mono text-xs font-bold text-slate-800">
                      {item.minutes_spent >= 60
                        ? `${Math.floor(item.minutes_spent / 60)}h ${item.minutes_spent % 60}m`
                        : `${item.minutes_spent} mins`} goal
                    </span>
                  </div>

                  {item.description && (
                    <p className="font-caveat text-sm text-slate-700 leading-relaxed mb-2 line-clamp-2">
                      {item.description}
                    </p>
                  )}

                  <p className="font-mono text-xs text-slate-400 italic mb-2">
                    {getMemeRank(item.user_streak)}
                  </p>

                  {/* Progress bar */}
                  <ProgressBar log={item} compact />

                  {/* Reaction bar */}
                  <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t-2 border-black/10">
                    {REACTIONS.map((emoji) => {
                      const count = item.reactionCounts[emoji] ?? 0
                      const mine  = item.myReactions.includes(emoji)
                      const key   = `${item.id}-${emoji}`
                      return (
                        <AnimatePresence key={emoji} mode="wait">
                          <motion.button
                            key={`${emoji}-${mine}`}
                            onClick={() => handleReaction(item.id, emoji)}
                            className={`flex items-center gap-1 px-2 py-1 border-2 text-xs font-bold transition-colors ${
                              mine
                                ? 'border-slate-900 bg-slate-900 text-white'
                                : 'border-slate-400 bg-white/60 text-slate-700 hover:border-slate-700 hover:bg-white'
                            }`}
                            animate={poppingKey === key ? { scale: [1, 1.45, 1] } : {}}
                            transition={{ duration: 0.28 }}
                          >
                            <span>{emoji}</span>
                            {count > 0 && <span className="font-mono">{count}</span>}
                          </motion.button>
                        </AnimatePresence>
                      )
                    })}

                    <Link
                      to={`/log/${item.id}`}
                      className="ml-auto flex items-center gap-1 px-2 py-1 border-2 border-slate-400 bg-white/60 text-xs font-bold text-slate-600 hover:border-slate-900 hover:text-slate-900 transition-colors"
                    >
                      💬 View
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
