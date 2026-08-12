import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Plus, Trash2, Clock, Flame, StickyNote } from 'lucide-react'
import { store, STICKY_COLORS, getStickyStyle, getMemeRank, type LearningLog, type StickyColor } from '../lib/store'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'

const BAR_COLORS = ['#fde68a', '#6ee7b7', '#c4b5fd', '#fbcfe8', '#7dd3fc', '#fed7aa', '#a5f3fc']

function SlapAnimation({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    const t = setTimeout(onComplete, 750)
    return () => clearTimeout(t)
  }, [onComplete])
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <motion.div
        initial={{ scale: 0, rotate: -25, y: -220 }}
        animate={{ scale: 1.15, rotate: 2, y: 0 }}
        transition={{ type: 'spring', stiffness: 420, damping: 14 }}
        className="bg-yellow-200 border-4 border-slate-900 px-10 py-5 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)]"
      >
        <p className="font-caveat text-4xl font-bold text-slate-900">📌 Log Slapped!</p>
      </motion.div>
    </motion.div>
  )
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-yellow-100 border-2 border-slate-900 shadow-neo px-3 py-2">
      <p className="font-caveat font-bold text-slate-900">{label}</p>
      <p className="font-mono text-sm text-slate-700">{payload[0].value} mins</p>
    </div>
  )
}

const ROTATIONS = ['-rotate-2', 'rotate-1', '-rotate-1', 'rotate-2', '-rotate-2', 'rotate-1']

export default function Dashboard() {
  const { user, refreshUser } = useAuth()
  const [logs, setLogs] = useState<LearningLog[]>([])
  const [showForm, setShowForm] = useState(false)
  const [showSlap, setShowSlap] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  // form fields
  const [topic, setTopic] = useState('')
  const [minutes, setMinutes] = useState(30)
  const [description, setDescription] = useState('')
  const [color, setColor] = useState<StickyColor>('bg-yellow-100')

  function loadLogs() {
    if (user) setLogs(store.getLogs(user.id))
  }

  useEffect(() => { loadLogs() }, [user])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    store.addLog({
      user_id: user.id,
      topic,
      description,
      minutes_spent: minutes,
      sticky_color: color,
      date_logged: new Date().toISOString().split('T')[0],
    })
    setShowSlap(true)
    setTopic(''); setMinutes(30); setDescription(''); setColor('bg-yellow-100')
    setShowForm(false)
    loadLogs()
    refreshUser()
  }

  function handleDelete(id: string) {
    store.deleteLog(id)
    setDeleteId(null)
    loadLogs()
  }

  // 7-day chart
  const weeklyData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const dateStr = d.toISOString().split('T')[0]
    const mins = logs.filter((l) => l.date_logged === dateStr).reduce((s, l) => s + l.minutes_spent, 0)
    return { day: d.toLocaleDateString('en', { weekday: 'short' }), mins }
  })

  const totalMins = logs.reduce((s, l) => s + l.minutes_spent, 0)
  const totalHours = Math.floor(totalMins / 60)
  const streak = user?.current_streak ?? 0

  return (
    <div className="min-h-screen" style={{ background: '#e8d5b7' }}>
      <Navbar />

      <AnimatePresence>
        {showSlap && <SlapAnimation onComplete={() => setShowSlap(false)} />}
      </AnimatePresence>

      <main className="max-w-7xl mx-auto px-4 py-8">

        {/* ── Stat sticky notes ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
          {[
            {
              bg: '#fef9c3', icon: <Clock size={18} className="text-yellow-700" />,
              label: 'Total Hours', labelColor: 'text-yellow-800',
              value: `${totalHours}h`, sub: 'logged lifetime',
            },
            {
              bg: '#d1fae5', icon: <Flame size={18} className="text-emerald-700" />,
              label: 'Current Streak', labelColor: 'text-emerald-800',
              value: streak > 0 ? `🔥 ${streak} days` : '0 days',
              sub: getMemeRank(streak),
            },
            {
              bg: '#ede9fe', icon: <StickyNote size={18} className="text-purple-700" />,
              label: 'Total Sessions', labelColor: 'text-purple-800',
              value: `${logs.length}`, sub: 'notes pinned to board',
            },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              className="relative border-2 border-slate-900 shadow-neo p-6 pt-8"
              style={{ background: s.bg }}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, type: 'spring', stiffness: 260, damping: 22 }}
            >
              <div className="push-pin" />
              <div className={`flex items-center gap-2 mb-1 ${s.labelColor}`}>
                {s.icon}
                <span className="font-mono text-xs uppercase tracking-widest">{s.label}</span>
              </div>
              <p className="font-caveat text-4xl font-bold text-slate-900 leading-none">{s.value}</p>
              <p className="font-caveat text-base text-slate-600 mt-1">{s.sub}</p>
            </motion.div>
          ))}
        </div>

        {/* ── Header + form toggle ── */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-caveat text-3xl font-bold text-slate-900">My Study Board 📋</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-yellow-300 font-bold border-2 border-slate-900 shadow-neo hover:shadow-neo-hover hover:-translate-y-0.5 transition-all"
          >
            <Plus size={18} />
            Slap a Log 📝
          </button>
        </div>

        {/* ── Log form ── */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              className="relative bg-yellow-50 border-2 border-slate-900 shadow-neo-lg p-6 mb-8"
              initial={{ opacity: 0, scale: 0.94, rotate: -2, y: -16 }}
              animate={{ opacity: 1, scale: 1, rotate: 0, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            >
              <div className="tape-strip" />
              <h3 className="font-caveat text-2xl font-bold text-slate-900 mb-5 mt-2 text-center">
                What did you grind today? ⚡
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                      Topic Title *
                    </label>
                    <input
                      value={topic} onChange={(e) => setTopic(e.target.value)}
                      placeholder="e.g. React Server Components"
                      required
                      className="w-full px-4 py-2.5 bg-white border-2 border-slate-900 text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-yellow-400 font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                      Minutes: <span className="text-yellow-700">{minutes}</span>
                    </label>
                    <input
                      type="range" min={5} max={480} step={5} value={minutes}
                      onChange={(e) => setMinutes(Number(e.target.value))}
                      className="w-full accent-yellow-500 mt-1"
                    />
                    <div className="flex justify-between text-xs font-mono text-slate-400 mt-1">
                      <span>5m</span><span>8h</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Notes / Description
                  </label>
                  <textarea
                    value={description} onChange={(e) => setDescription(e.target.value)}
                    placeholder="What did you actually learn? Be honest..."
                    rows={3}
                    className="w-full px-4 py-2.5 bg-white border-2 border-slate-900 text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-yellow-400 font-mono text-sm resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-slate-600 uppercase tracking-wider mb-2">
                    Note Color
                  </label>
                  <div className="flex gap-3 flex-wrap">
                    {STICKY_COLORS.map((sc) => (
                      <button
                        key={sc.value} type="button" onClick={() => setColor(sc.value)}
                        title={sc.label}
                        className="w-9 h-9 border-2 transition-all hover:scale-110"
                        style={{
                          background: sc.bg,
                          borderColor: color === sc.value ? '#0f172a' : '#94a3b8',
                          boxShadow: color === sc.value ? '3px 3px 0 rgba(15,23,42,1)' : 'none',
                          transform: color === sc.value ? 'scale(1.18)' : undefined,
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-slate-900 text-yellow-300 font-bold border-2 border-slate-900 shadow-neo hover:shadow-neo-hover hover:-translate-y-0.5 transition-all"
                  >
                    📌 Pin It to the Board
                  </button>
                  <button
                    type="button" onClick={() => setShowForm(false)}
                    className="px-6 py-3 bg-white text-slate-900 font-bold border-2 border-slate-900 shadow-neo hover:bg-slate-50 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Main grid: log wall + chart ── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

          {/* Log wall */}
          <div className="xl:col-span-2">
            {logs.length === 0 ? (
              <div className="text-center py-20 bg-white border-2 border-slate-900 shadow-neo">
                <p className="text-6xl mb-4">🌿</p>
                <p className="font-caveat text-2xl font-bold text-slate-900">No logs yet?</p>
                <p className="font-caveat text-lg text-slate-600 mt-1">
                  Go touch grass... or start studying!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {logs.map((log, i) => {
                  const s = getStickyStyle(log.sticky_color)
                  return (
                    <motion.div
                      key={log.id}
                      className={`relative border-2 border-slate-900 p-5 pt-8 group cursor-default ${ROTATIONS[i % ROTATIONS.length]} hover:rotate-0 transition-transform duration-300`}
                      style={{ background: s.bg, boxShadow: '4px 4px 0px 0px rgba(15,23,42,1)' }}
                      initial={{ opacity: 0, scale: 0.85, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ delay: i * 0.04, type: 'spring', stiffness: 280, damping: 22 }}
                      whileHover={{ scale: 1.03, zIndex: 10 }}
                    >
                      <div className="push-pin" />

                      <h3 className="font-caveat text-xl font-bold text-slate-900 leading-tight mb-2">
                        {log.topic}
                      </h3>

                      <div
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 border border-slate-700 mb-2"
                        style={{ background: 'rgba(255,255,255,0.55)' }}
                      >
                        <span className="text-xs">⏱️</span>
                        <span className="font-mono text-xs font-bold text-slate-800">
                          {log.minutes_spent >= 60
                            ? `${Math.floor(log.minutes_spent / 60)}h ${log.minutes_spent % 60}m`
                            : `${log.minutes_spent}m`}
                        </span>
                      </div>

                      {log.description && (
                        <p className="font-caveat text-sm text-slate-700 leading-relaxed mb-3">
                          {log.description}
                        </p>
                      )}

                      <p className="font-mono text-xs text-slate-500">
                        {new Date(log.date_logged).toLocaleDateString('en', {
                          month: 'short', day: 'numeric', year: 'numeric',
                        })}
                      </p>

                      <button
                        onClick={() => setDeleteId(log.id)}
                        className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 bg-red-100 border border-red-400 hover:bg-red-200"
                      >
                        <Trash2 size={13} className="text-red-700" />
                      </button>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Weekly chart */}
          <div className="xl:col-span-1">
            <div className="relative bg-white border-2 border-slate-900 shadow-neo p-5 pt-8 sticky top-24">
              <div className="tape-strip" />
              <h3 className="font-caveat text-xl font-bold text-slate-900 mb-4">This Week 📊</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={weeklyData} margin={{ top: 0, right: 0, left: -24, bottom: 0 }}>
                  <XAxis
                    dataKey="day"
                    tick={{ fontFamily: 'JetBrains Mono', fontSize: 11, fill: '#64748b' }}
                    axisLine={false} tickLine={false}
                  />
                  <YAxis
                    tick={{ fontFamily: 'JetBrains Mono', fontSize: 10, fill: '#94a3b8' }}
                    axisLine={false} tickLine={false}
                  />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
                  <Bar dataKey="mins" radius={[4, 4, 0, 0]}>
                    {weeklyData.map((_, idx) => (
                      <Cell key={idx} fill={BAR_COLORS[idx % BAR_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <p className="font-mono text-xs text-slate-400 text-center mt-2">daily minutes logged</p>

              {/* Total this week */}
              <div className="mt-4 pt-4 border-t-2 border-dashed border-slate-200 flex justify-between items-center">
                <span className="font-mono text-xs text-slate-500 uppercase tracking-wider">Week total</span>
                <span className="font-caveat text-lg font-bold text-slate-900">
                  {Math.floor(weeklyData.reduce((s, d) => s + d.mins, 0) / 60)}h{' '}
                  {weeklyData.reduce((s, d) => s + d.mins, 0) % 60}m
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── Delete confirm ── */}
      <AnimatePresence>
        {deleteId && (
          <motion.div
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setDeleteId(null)}
          >
            <motion.div
              className="relative bg-pink-100 border-2 border-slate-900 shadow-neo-lg p-6 max-w-sm w-full"
              style={{ transform: 'rotate(-1.2deg)' }}
              initial={{ scale: 0.8, rotate: -6 }} animate={{ scale: 1, rotate: -1.2 }}
              exit={{ scale: 0.8 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="push-pin" />
              <h3 className="font-caveat text-2xl font-bold text-slate-900 mt-4 mb-1">Delete this log? 🗑️</h3>
              <p className="font-caveat text-lg text-slate-700 mb-6">Gone forever. No cap.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => handleDelete(deleteId!)}
                  className="flex-1 py-2.5 bg-red-600 text-white font-bold border-2 border-slate-900 shadow-neo hover:bg-red-700 transition-colors"
                >
                  Delete It 💀
                </button>
                <button
                  onClick={() => setDeleteId(null)}
                  className="flex-1 py-2.5 bg-white text-slate-900 font-bold border-2 border-slate-900 shadow-neo hover:bg-slate-50 transition-colors"
                >
                  Keep It
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
