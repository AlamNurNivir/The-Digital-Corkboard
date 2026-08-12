import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Crown, Medal, Award } from 'lucide-react'
import { store, getMemeRank } from '../lib/store'
import Navbar from '../components/Navbar'

type Filter = 'week' | 'month' | 'all'

interface LeaderEntry {
  id: string
  username: string
  avatar_url: string
  current_streak: number
  total_minutes: number
  total_sessions: number
}

const PODIUM = [
  {
    rank: 1,
    bg: '#fef9c3',
    barBg: '#fde047',
    icon: <Crown size={26} className="text-yellow-600" />,
    tag: 'Giga Brain 🧠',
    barH: 'h-28',
  },
  {
    rank: 2,
    bg: '#f1f5f9',
    barBg: '#cbd5e1',
    icon: <Medal size={22} className="text-slate-500" />,
    tag: '2nd Place 🥈',
    barH: 'h-20',
  },
  {
    rank: 3,
    bg: '#fef3c7',
    barBg: '#fbbf24',
    icon: <Award size={20} className="text-amber-700" />,
    tag: '3rd Place 🥉',
    barH: 'h-14',
  },
]

function fmtTime(mins: number) {
  return `${Math.floor(mins / 60)}h ${mins % 60}m`
}

export default function Leaderboard() {
  const [filter, setFilter] = useState<Filter>('all')
  const [entries, setEntries] = useState<LeaderEntry[]>([])

  useEffect(() => {
    setEntries(store.getLeaderboard(filter))
  }, [filter])

  const top3 = entries.slice(0, 3)
  const rest = entries.slice(3)

  // Render 2nd, 1st, 3rd for visual podium order
  const podiumOrder: (LeaderEntry | undefined)[] = [top3[1], top3[0], top3[2]]

  return (
    <div className="min-h-screen" style={{ background: '#e8d5b7' }}>
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="font-caveat text-5xl font-bold text-slate-900">Hall of Fame 🏆</h1>
          <p className="font-caveat text-xl text-slate-600 mt-1">Claim your throne, big brain</p>
        </div>

        {/* Filter bar */}
        <div className="flex justify-center mb-10">
          <div className="flex border-2 border-slate-900 shadow-neo bg-white overflow-hidden">
            {(['week', 'month', 'all'] as Filter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-6 py-2.5 font-bold text-sm transition-colors ${
                  filter === f
                    ? 'bg-slate-900 text-yellow-300'
                    : 'text-slate-700 hover:bg-yellow-50'
                }`}
              >
                {f === 'week' ? 'This Week' : f === 'month' ? 'This Month' : 'All Time'}
              </button>
            ))}
          </div>
        </div>

        {entries.length === 0 ? (
          <div className="text-center py-20 bg-white border-2 border-slate-900 shadow-neo">
            <p className="text-6xl mb-4">👻</p>
            <p className="font-caveat text-2xl font-bold text-slate-900">Nobody here yet</p>
            <p className="font-caveat text-lg text-slate-600 mt-1">
              Claim Top Spot 🏆 — be the first to log!
            </p>
          </div>
        ) : (
          <>
            {/* ── Podium ── */}
            {top3.length > 0 && (
              <div className="flex items-end justify-center gap-3 sm:gap-5 mb-12">
                {podiumOrder.map((entry, idx) => {
                  if (!entry) return <div key={idx} className="w-32 sm:w-36" />
                  const actualRank = top3.indexOf(entry) + 1
                  const conf = PODIUM[actualRank - 1]
                  const avatarSize = actualRank === 1 ? 72 : actualRank === 2 ? 60 : 52

                  return (
                    <motion.div
                      key={entry.id}
                      className="flex flex-col items-center"
                      initial={{ opacity: 0, y: 50 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.12, type: 'spring', stiffness: 200, damping: 20 }}
                    >
                      <div className="mb-2">{conf.icon}</div>

                      <img
                        src={entry.avatar_url}
                        alt={entry.username}
                        className="rounded-full border-2 border-slate-900 mb-3"
                        style={{ width: avatarSize, height: avatarSize }}
                      />

                      {/* Sticky note card */}
                      <div
                        className="border-2 border-slate-900 p-3 text-center w-32 sm:w-36 mb-0"
                        style={{ background: conf.bg, boxShadow: '4px 4px 0px 0px rgba(15,23,42,1)' }}
                      >
                        <p className="font-bold text-sm text-slate-900 truncate">{entry.username}</p>
                        <p className="font-mono text-xs text-slate-600 mt-0.5">{fmtTime(entry.total_minutes)}</p>
                        <p className="font-caveat text-xs text-slate-700 mt-1 leading-tight">{conf.tag}</p>
                        {entry.current_streak > 0 && (
                          <p className="font-mono text-xs text-orange-600 mt-1">
                            <span className="fire-animate inline-block">🔥</span> {entry.current_streak}d
                          </p>
                        )}
                      </div>

                      {/* Podium base */}
                      <div
                        className={`w-32 sm:w-36 ${conf.barH} border-2 border-t-0 border-slate-900`}
                        style={{ background: conf.barBg }}
                      />
                    </motion.div>
                  )
                })}
              </div>
            )}

            {/* ── Ranks 4+ table ── */}
            {rest.length > 0 && (
              <div className="border-2 border-slate-900 shadow-neo overflow-hidden">
                <div className="px-6 py-3 border-b-2 border-slate-900 bg-slate-900 flex items-center gap-2">
                  <Trophy size={15} className="text-yellow-300" />
                  <span className="font-mono text-sm font-bold text-yellow-300 uppercase tracking-widest">
                    The Rest of the Greats
                  </span>
                </div>

                {rest.map((entry, i) => (
                  <motion.div
                    key={entry.id}
                    className="flex items-center gap-4 px-6 py-4 border-b border-slate-100 transition-colors hover:bg-yellow-50"
                    style={{ background: i % 2 === 0 ? '#fafafa' : '#ffffff' }}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <span className="font-mono text-xl font-bold text-slate-400 w-8 text-center shrink-0">
                      #{i + 4}
                    </span>

                    <img
                      src={entry.avatar_url}
                      alt={entry.username}
                      className="w-10 h-10 rounded-full border-2 border-slate-900 shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 truncate">{entry.username}</p>
                      <p className="font-caveat text-sm text-slate-500">{getMemeRank(entry.current_streak)}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="font-mono text-sm font-bold text-slate-900">{fmtTime(entry.total_minutes)}</p>
                      <p className="font-mono text-xs text-slate-500">{entry.total_sessions} sessions</p>
                    </div>

                    {entry.current_streak > 0 && (
                      <div className="hidden sm:flex items-center gap-1 px-2 py-1 bg-orange-50 border border-orange-200 text-xs font-bold text-orange-700 shrink-0">
                        <span className="fire-animate">🔥</span>
                        <span className="font-mono">{entry.current_streak}</span>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
