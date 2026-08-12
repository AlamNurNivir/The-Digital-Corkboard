import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Send, Pencil, Check, X, Plus, Trash2, ExternalLink as ExternalLinkIcon } from 'lucide-react'
import {
  store, getStickyStyle, getMemeRank, getProgress, getProgressColor,
  detectLinkKind, LINK_META,
  type LearningLog, type Fragment, type ExternalLink, type StickyColor,
} from '../lib/store'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import ProgressBar from '../components/ProgressBar'

const REACTIONS = ['🔥', '🗿', '🧠', '💀', '👏']

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60_000)
  if (m < 1)  return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function isValidUrl(str: string): boolean {
  try { new URL(str); return true } catch { return false }
}

// ── External link row ────────────────────────────────────────────────────────
function LinkRow({ link, canDelete, onDelete }: { link: ExternalLink; canDelete: boolean; onDelete: () => void }) {
  const kind = detectLinkKind(link.url)
  const meta = LINK_META[kind]
  return (
    <motion.div
      className="flex items-center gap-3 p-3 bg-white border-2 border-slate-900 group"
      style={{ boxShadow: '2px 2px 0 rgba(15,23,42,0.8)' }}
      initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -8 }}
      whileHover={{ x: 2, y: -1 }}
      transition={{ duration: 0.18 }}
    >
      <span className="text-xl shrink-0">{meta.emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm text-slate-900 truncate leading-tight">{link.title || link.url}</p>
        <p className="font-mono text-[10px] text-slate-400 truncate">{link.url}</p>
      </div>
      <span
        className="font-mono text-[10px] font-bold px-1.5 py-0.5 border shrink-0"
        style={{ color: meta.color, borderColor: meta.color + '55', background: meta.color + '11' }}
      >
        {meta.label}
      </span>
      <a
        href={link.url} target="_blank" rel="noopener noreferrer"
        className="shrink-0 p-1.5 border-2 border-slate-900 bg-slate-50 hover:bg-yellow-100 transition-colors"
        title="Open link"
      >
        <ExternalLinkIcon size={13} className="text-slate-700" />
      </a>
      {canDelete && (
        <button
          onClick={onDelete}
          className="shrink-0 p-1.5 border-2 border-red-400 bg-red-50 hover:bg-red-100 transition-colors opacity-0 group-hover:opacity-100"
          title="Delete link"
        >
          <Trash2 size={13} className="text-red-600" />
        </button>
      )}
    </motion.div>
  )
}

export default function LogDetail() {
  const { id }   = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [log,         setLog]         = useState<LearningLog | null>(null)
  const [fragments,   setFragments]   = useState<Fragment[]>([])
  const [links,       setLinks]       = useState<ExternalLink[]>([])
  const [reactions,   setReactions]   = useState<Record<string, number>>({})
  const [myReactions, setMyReactions] = useState<string[]>([])
  const [owner,       setOwner]       = useState<ReturnType<typeof store.getUser>>(undefined)
  const [poppingKey,  setPoppingKey]  = useState<string | null>(null)

  // fragment
  const [msg,     setMsg]     = useState('')
  const [sending, setSending] = useState(false)
  const msgEndRef = useRef<HTMLDivElement>(null)

  // progress editor
  const [editingProgress, setEditingProgress] = useState(false)
  const [progressInput,   setProgressInput]   = useState(0)

  // link form
  const [showLinkForm, setShowLinkForm] = useState(false)
  const [linkUrl,      setLinkUrl]      = useState('')
  const [linkTitle,    setLinkTitle]    = useState('')
  const [linkError,    setLinkError]    = useState('')

  function load() {
    if (!id) return
    const l = store.getLog(id)
    if (!l) { navigate('/feed'); return }
    setLog(l)
    setProgressInput(l.minutes_completed)
    setOwner(store.getUser(l.user_id))
    setFragments(store.getFragments(id))
    setLinks(store.getLinks(id))
    const rxns = store.getReactionsForLog(id)
    const counts: Record<string, number> = {}
    const mine:   string[] = []
    for (const r of rxns) {
      counts[r.reaction_type] = (counts[r.reaction_type] ?? 0) + 1
      if (r.user_id === user?.id) mine.push(r.reaction_type)
    }
    setReactions(counts)
    setMyReactions(mine)
  }

  useEffect(() => { load() }, [id, user])
  useEffect(() => { msgEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [fragments])

  function handleReaction(emoji: string) {
    if (!user || !id) return
    setPoppingKey(emoji)
    setTimeout(() => setPoppingKey(null), 350)
    store.toggleReaction(id, user.id, emoji)
    const alreadyMine = myReactions.includes(emoji)
    setReactions((prev) => ({ ...prev, [emoji]: Math.max((prev[emoji] ?? 0) + (alreadyMine ? -1 : 1), 0) }))
    setMyReactions((prev) => alreadyMine ? prev.filter((e) => e !== emoji) : [...prev, emoji])
  }

  function handleSendFragment(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !id || !msg.trim()) return
    setSending(true)
    store.addFragment(id, user.id, msg.trim())
    setMsg('')
    setFragments(store.getFragments(id))
    setSending(false)
  }

  function handleDeleteFragment(fragId: string) {
    store.deleteFragment(fragId)
    setFragments(store.getFragments(id!))
  }

  function saveProgress() {
    if (!id) return
    store.updateProgress(id, progressInput)
    setEditingProgress(false)
    load()
  }

  function handleAddLink(e: React.FormEvent) {
    e.preventDefault()
    setLinkError('')
    if (!isValidUrl(linkUrl)) { setLinkError('Please enter a valid URL (include https://)'); return }
    if (!user || !id) return
    store.addLink(id, user.id, linkUrl.trim(), linkTitle.trim() || linkUrl.trim())
    setLinkUrl(''); setLinkTitle(''); setShowLinkForm(false)
    setLinks(store.getLinks(id))
  }

  function handleDeleteLink(linkId: string) {
    store.deleteLink(linkId)
    setLinks(store.getLinks(id!))
  }

  if (!log) return null

  const style     = getStickyStyle(log.sticky_color as StickyColor)
  const pct       = getProgress(log)
  const fillColor = getProgressColor(pct)
  const isOwner   = user?.id === log.user_id
  const userMap   = new Map(store.getAllUsers().map((u) => [u.id, u]))

  // auto-detect preview of typed URL
  const previewKind = linkUrl && isValidUrl(linkUrl) ? detectLinkKind(linkUrl) : null
  const previewMeta = previewKind ? LINK_META[previewKind] : null

  return (
    <div className="min-h-screen" style={{ background: '#e8d5b7' }}>
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <Link
          to="/feed"
          className="inline-flex items-center gap-2 mb-6 font-bold text-sm text-slate-700 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft size={16} /> Back to Friend Wall
        </Link>

        {/* ── Main log card ── */}
        <motion.div
          className="relative border-2 border-slate-900 p-7 pt-10 mb-6"
          style={{ background: style.bg, boxShadow: '6px 6px 0px 0px rgba(15,23,42,1)' }}
          initial={{ opacity: 0, y: 24, rotate: -1 }}
          animate={{ opacity: 1, y: 0, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 240, damping: 22 }}
        >
          <div className="push-pin" />

          {/* Owner */}
          {owner && (
            <div className="flex items-center gap-3 mb-4">
              <Link to={`/profile/${owner.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <img src={owner.avatar_url} alt={owner.username} className="w-10 h-10 rounded-full border-2 border-slate-900" />
                <div>
                  <p className="font-bold text-slate-900 hover:underline">{owner.username}</p>
                  <p className="font-caveat text-sm text-slate-600">{getMemeRank(owner.current_streak)}</p>
                </div>
              </Link>
              {owner.current_streak > 0 && (
                <span className="ml-auto font-bold text-lg text-orange-600">
                  <span className="fire-animate">🔥</span> {owner.current_streak}d
                </span>
              )}
            </div>
          )}

          <h1 className="font-caveat text-4xl font-bold text-slate-900 leading-tight mb-3">{log.topic}</h1>

          <div className="flex flex-wrap gap-3 mb-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 border-2 border-slate-900 bg-white/60 font-mono text-sm font-bold text-slate-800">
              ⏱️ {log.minutes_spent >= 60 ? `${Math.floor(log.minutes_spent / 60)}h ${log.minutes_spent % 60}m` : `${log.minutes_spent}m`} goal
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 border-2 border-slate-900 font-mono text-sm font-bold"
              style={{ background: fillColor + '22', borderColor: fillColor, color: fillColor }}>
              ✅ {log.minutes_completed}m done · {pct}%
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/50 border border-slate-400 font-mono text-xs text-slate-600">
              📅 {new Date(log.date_logged).toLocaleDateString('en', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
          </div>

          {log.description && (
            <p className="font-caveat text-lg text-slate-700 leading-relaxed mb-6 border-l-4 pl-4" style={{ borderColor: style.border }}>
              {log.description}
            </p>
          )}

          <ProgressBar log={log} />

          {/* Progress editor — owner only */}
          {isOwner && (
            <div className="mt-4">
              {editingProgress ? (
                <div className="flex items-center gap-3 flex-wrap">
                  <label className="font-mono text-xs text-slate-600 uppercase tracking-wider">Minutes completed:</label>
                  <input
                    type="number" min={0} max={log.minutes_spent} value={progressInput}
                    onChange={(e) => setProgressInput(Number(e.target.value))}
                    className="w-24 px-3 py-1.5 border-2 border-slate-900 font-mono text-sm outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                  <span className="font-mono text-xs text-slate-500">/ {log.minutes_spent}m</span>
                  <button onClick={saveProgress}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white font-bold border-2 border-slate-900 shadow-neo hover:bg-green-700 transition-colors text-sm">
                    <Check size={14} /> Save
                  </button>
                  <button onClick={() => { setEditingProgress(false); setProgressInput(log.minutes_completed) }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-slate-700 font-bold border-2 border-slate-900 shadow-neo hover:bg-slate-50 transition-colors text-sm">
                    <X size={14} /> Cancel
                  </button>
                </div>
              ) : (
                <button onClick={() => setEditingProgress(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-slate-900 shadow-neo hover:shadow-neo-hover hover:-translate-y-0.5 transition-all font-bold text-sm text-slate-800 mt-2">
                  <Pencil size={14} /> Update Progress
                </button>
              )}
            </div>
          )}

          {/* Reactions */}
          <div className="flex flex-wrap gap-2 mt-6 pt-5 border-t-2 border-black/10">
            {REACTIONS.map((emoji) => {
              const count = reactions[emoji] ?? 0
              const mine  = myReactions.includes(emoji)
              return (
                <motion.button key={emoji} onClick={() => handleReaction(emoji)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 border-2 font-bold text-sm transition-colors ${
                    mine ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-400 bg-white/70 text-slate-700 hover:border-slate-800'
                  }`}
                  animate={poppingKey === emoji ? { scale: [1, 1.45, 1] } : {}}
                  transition={{ duration: 0.28 }}
                >
                  <span>{emoji}</span>
                  {count > 0 && <span className="font-mono text-xs">{count}</span>}
                </motion.button>
              )
            })}
          </div>
        </motion.div>

        {/* ── External Links ── */}
        <div className="relative bg-white border-2 border-slate-900 shadow-neo overflow-hidden mb-6">
          <div className="flex items-center gap-2 px-6 py-4 border-b-2 border-slate-900 bg-slate-800">
            <span className="text-lg">🔗</span>
            <h2 className="font-caveat text-xl font-bold text-yellow-300">Study Resources</h2>
            <span className="ml-auto font-mono text-xs text-slate-400">{links.length} link{links.length !== 1 ? 's' : ''}</span>
            {isOwner && (
              <button
                onClick={() => setShowLinkForm(!showLinkForm)}
                className="flex items-center gap-1.5 ml-2 px-3 py-1.5 bg-yellow-300 text-slate-900 border-2 border-slate-900 font-bold text-xs hover:bg-yellow-200 transition-colors shadow-neo"
              >
                <Plus size={13} /> Add Link
              </button>
            )}
          </div>

          {/* Add link form */}
          <AnimatePresence>
            {showLinkForm && isOwner && (
              <motion.form
                onSubmit={handleAddLink}
                className="px-6 py-4 border-b-2 border-slate-200 bg-yellow-50 space-y-3"
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono font-bold text-slate-600 uppercase tracking-wider mb-1">
                      URL *
                    </label>
                    <div className="relative">
                      <input
                        value={linkUrl} onChange={(e) => { setLinkUrl(e.target.value); setLinkError('') }}
                        placeholder="https://youtube.com/watch?v=..."
                        className="w-full px-3 py-2 border-2 border-slate-900 bg-white font-mono text-sm outline-none focus:ring-2 focus:ring-yellow-400 pr-20"
                      />
                      {previewMeta && (
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold font-mono"
                          style={{ color: previewMeta.color }}>
                          {previewMeta.emoji} {previewMeta.label}
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-mono font-bold text-slate-600 uppercase tracking-wider mb-1">
                      Title (optional)
                    </label>
                    <input
                      value={linkTitle} onChange={(e) => setLinkTitle(e.target.value)}
                      placeholder="e.g. React Server Components Tutorial"
                      className="w-full px-3 py-2 border-2 border-slate-900 bg-white font-mono text-sm outline-none focus:ring-2 focus:ring-yellow-400"
                    />
                  </div>
                </div>
                {linkError && <p className="font-mono text-xs text-red-600 font-bold">{linkError}</p>}
                <div className="flex gap-2">
                  <button type="submit"
                    className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-yellow-300 font-bold border-2 border-slate-900 shadow-neo hover:shadow-neo-hover hover:-translate-y-0.5 transition-all text-sm">
                    <Plus size={14} /> Add Resource
                  </button>
                  <button type="button" onClick={() => { setShowLinkForm(false); setLinkUrl(''); setLinkTitle(''); setLinkError('') }}
                    className="px-4 py-2 bg-white text-slate-700 font-bold border-2 border-slate-900 shadow-neo hover:bg-slate-50 transition-all text-sm">
                    Cancel
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          <div className="p-4 space-y-2">
            {links.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-3xl mb-2">📎</p>
                <p className="font-caveat text-lg text-slate-500">No resources yet</p>
                {isOwner && (
                  <p className="font-caveat text-sm text-slate-400 mt-1">Add YouTube links, Google Drive docs, GitHub repos, and more.</p>
                )}
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {links.map((link) => (
                  <LinkRow
                    key={link.id}
                    link={link}
                    canDelete={isOwner}
                    onDelete={() => handleDeleteLink(link.id)}
                  />
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* ── Fragment Messages ── */}
        <div className="relative bg-white border-2 border-slate-900 shadow-neo overflow-hidden">
          <div className="flex items-center gap-2 px-6 py-4 border-b-2 border-slate-900 bg-slate-900">
            <span className="text-lg">💬</span>
            <h2 className="font-caveat text-xl font-bold text-yellow-300">Fragment Messages</h2>
            <span className="ml-auto font-mono text-xs text-slate-400">
              {fragments.length} {fragments.length === 1 ? 'note' : 'notes'}
            </span>
          </div>

          <div className="max-h-[420px] overflow-y-auto p-6 space-y-4 scrollbar-hide">
            {fragments.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-4xl mb-2">📝</p>
                <p className="font-caveat text-xl text-slate-500">No messages yet</p>
                <p className="font-caveat text-sm text-slate-400 mt-1">Be the first to drop a fragment!</p>
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {fragments.map((frag, i) => {
                  const author     = userMap.get(frag.user_id)
                  const isMe       = frag.user_id === user?.id
                  const isLogOwner = frag.user_id === log.user_id
                  return (
                    <motion.div key={frag.id}
                      className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}
                      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }} transition={{ delay: i * 0.03 }}
                    >
                      <Link to={`/profile/${frag.user_id}`}>
                        <img
                          src={author?.avatar_url ?? `https://api.dicebear.com/7.x/bottts/svg?seed=${frag.user_id}`}
                          alt={author?.username}
                          className="w-8 h-8 rounded-full border-2 border-slate-900 shrink-0 mt-1 hover:opacity-80 transition-opacity"
                        />
                      </Link>
                      <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                        <div className="flex items-center gap-2">
                          <Link to={`/profile/${frag.user_id}`}
                            className="font-bold text-xs text-slate-700 hover:text-slate-900 hover:underline">
                            {author?.username ?? 'unknown'}
                          </Link>
                          {isLogOwner && (
                            <span className="px-1.5 py-0.5 bg-yellow-200 border border-yellow-500 text-yellow-800 font-mono text-[10px] font-bold">OP</span>
                          )}
                          <span className="font-mono text-[10px] text-slate-400">{timeAgo(frag.created_at)}</span>
                        </div>
                        <div
                          className={`px-4 py-3 border-2 border-slate-900 group relative ${isMe ? 'bg-yellow-100' : 'bg-slate-50'}`}
                          style={{ boxShadow: '2px 2px 0 rgba(15,23,42,1)' }}
                        >
                          <p className="font-caveat text-base text-slate-900 leading-snug">{frag.message}</p>
                          {isMe && (
                            <button onClick={() => handleDeleteFragment(frag.id)}
                              className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity w-5 h-5 bg-red-500 border border-slate-900 flex items-center justify-center">
                              <X size={10} className="text-white" />
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            )}
            <div ref={msgEndRef} />
          </div>

          {user ? (
            <form onSubmit={handleSendFragment} className="flex gap-3 p-4 border-t-2 border-slate-900 bg-yellow-50">
              <Link to={`/profile/${user.id}`}>
                <img src={user.avatar_url} alt={user.username}
                  className="w-9 h-9 rounded-full border-2 border-slate-900 shrink-0 hover:opacity-80 transition-opacity" />
              </Link>
              <input value={msg} onChange={(e) => setMsg(e.target.value)}
                placeholder="Drop a fragment message..."
                className="flex-1 px-4 py-2.5 bg-white border-2 border-slate-900 text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-yellow-400 font-caveat text-base"
              />
              <button type="submit" disabled={!msg.trim() || sending}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-yellow-300 font-bold border-2 border-slate-900 shadow-neo hover:shadow-neo-hover hover:-translate-y-0.5 transition-all disabled:opacity-40">
                <Send size={15} />
              </button>
            </form>
          ) : (
            <div className="p-4 border-t-2 border-slate-200 text-center">
              <p className="font-caveat text-base text-slate-500">
                <Link to="/login" className="font-bold text-yellow-700 underline">Sign in</Link> to leave a fragment message
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
