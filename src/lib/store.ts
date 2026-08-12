// All data lives in localStorage. No network required.

export type StickyColor = 'bg-yellow-100' | 'bg-emerald-100' | 'bg-purple-100' | 'bg-pink-100' | 'bg-sky-100'

export interface User {
  id: string
  username: string
  avatar_url: string
  bio: string
  current_streak: number
  created_at: string
}

export interface LearningLog {
  id: string
  user_id: string
  topic: string
  description: string
  minutes_spent: number       // goal / planned minutes
  minutes_completed: number   // actual completed minutes (0 → minutes_spent)
  sticky_color: StickyColor
  date_logged: string
  created_at: string
}

export interface Fragment {
  id: string
  log_id: string
  user_id: string
  message: string
  created_at: string
}

export interface ExternalLink {
  id: string
  log_id: string
  added_by: string  // user_id of person who added (only log owner can add)
  url: string
  title: string
  created_at: string
}

export interface Reaction {
  id: string
  log_id: string
  user_id: string
  reaction_type: string
}

export const STICKY_COLORS: { value: StickyColor; label: string; bg: string; border: string }[] = [
  { value: 'bg-yellow-100',  label: 'Canary',    bg: '#fef9c3', border: '#facc15' },
  { value: 'bg-emerald-100', label: 'Mint',      bg: '#d1fae5', border: '#34d399' },
  { value: 'bg-purple-100',  label: 'Lavender',  bg: '#ede9fe', border: '#a78bfa' },
  { value: 'bg-pink-100',    label: 'Bubblegum', bg: '#fce7f3', border: '#f472b6' },
  { value: 'bg-sky-100',     label: 'Sky',       bg: '#e0f2fe', border: '#38bdf8' },
]

export function getStickyStyle(color: StickyColor) {
  return STICKY_COLORS.find((c) => c.value === color) ?? STICKY_COLORS[0]
}

export function getMemeRank(streak: number): string {
  if (streak === 0) return 'NPC / Smooth Brain Era 🧠'
  if (streak <= 3)  return 'Locked In 🔒'
  if (streak <= 7)  return 'Main Character Energy ⚡'
  if (streak <= 14) return 'Gigachad Scholar 🗿'
  return 'Overclocked Sentient AI 🤖'
}

export function getProgress(log: LearningLog): number {
  if (log.minutes_spent === 0) return 0
  return Math.min(100, Math.round((log.minutes_completed / log.minutes_spent) * 100))
}

export function getProgressColor(pct: number): string {
  if (pct >= 100) return '#22c55e'
  if (pct >= 60)  return '#eab308'
  if (pct >= 30)  return '#f97316'
  return '#ef4444'
}

export type LinkKind = 'youtube' | 'drive' | 'github' | 'notion' | 'figma' | 'twitter' | 'docs' | 'slides' | 'colab' | 'default'

export function detectLinkKind(url: string): LinkKind {
  const u = url.toLowerCase()
  if (u.includes('youtube.com') || u.includes('youtu.be')) return 'youtube'
  if (u.includes('drive.google.com'))  return 'drive'
  if (u.includes('docs.google.com/document')) return 'docs'
  if (u.includes('docs.google.com/presentation')) return 'slides'
  if (u.includes('colab.research.google.com')) return 'colab'
  if (u.includes('github.com'))  return 'github'
  if (u.includes('notion.so'))   return 'notion'
  if (u.includes('figma.com'))   return 'figma'
  if (u.includes('twitter.com') || u.includes('x.com')) return 'twitter'
  return 'default'
}

export const LINK_META: Record<LinkKind, { emoji: string; label: string; color: string }> = {
  youtube: { emoji: '▶️', label: 'YouTube',     color: '#ff0000' },
  drive:   { emoji: '📁', label: 'Google Drive', color: '#4285f4' },
  docs:    { emoji: '📄', label: 'Google Docs',  color: '#4285f4' },
  slides:  { emoji: '📊', label: 'Google Slides',color: '#fbbc05' },
  colab:   { emoji: '🔬', label: 'Colab',        color: '#f9ab00' },
  github:  { emoji: '🐙', label: 'GitHub',       color: '#24292f' },
  notion:  { emoji: '📝', label: 'Notion',       color: '#000000' },
  figma:   { emoji: '🎨', label: 'Figma',        color: '#a259ff' },
  twitter: { emoji: '🐦', label: 'X / Twitter',  color: '#1da1f2' },
  default: { emoji: '🔗', label: 'Link',         color: '#64748b' },
}

function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

// ─── seed data ──────────────────────────────────────────────────────────────

const SEED_USERS: User[] = [
  { id: 'u-alex',   username: 'alex_codes',   avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=alex',   bio: 'Full-stack enjoyer. RSC evangelist. Rust curious.',           current_streak: 12, created_at: '2024-01-01T00:00:00Z' },
  { id: 'u-priya',  username: 'priya_learns', avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=priya',  bio: 'Systems thinker. Database whisperer. Consistent hasher.',     current_streak: 7,  created_at: '2024-01-02T00:00:00Z' },
  { id: 'u-marcus', username: 'marcus_grind', avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=marcus', bio: 'TypeScript or bust. Containerizing everything I own.',         current_streak: 3,  created_at: '2024-01-03T00:00:00Z' },
  { id: 'u-nina',   username: 'nina_nerd',    avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=nina',   bio: 'ML researcher by day, LeetCode grinder by night. 21d streak!', current_streak: 21, created_at: '2024-01-04T00:00:00Z' },
  { id: 'u-carlos', username: 'carlos_dev',   avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=carlos', bio: 'CSS artist. Vim escapee. Still figuring out exits.',           current_streak: 0,  created_at: '2024-01-05T00:00:00Z' },
]

function daysAgo(n: number): string {
  const d = new Date(); d.setDate(d.getDate() - n)
  return d.toISOString().split('T')[0]
}
function hoursAgo(n: number): string {
  return new Date(Date.now() - n * 3_600_000).toISOString()
}

const SEED_LOGS: LearningLog[] = [
  { id: 'l-01', user_id: 'u-alex',   topic: 'React Server Components',      description: 'Deep dived RSC patterns, figured out the data fetching story. Mind = blown.',  minutes_spent: 90,  minutes_completed: 90,  sticky_color: 'bg-yellow-100',  date_logged: daysAgo(0), created_at: hoursAgo(2)  },
  { id: 'l-02', user_id: 'u-priya',  topic: 'System Design: URL Shortener', description: 'Walked through consistent hashing & sharding strategies. Good stuff.',         minutes_spent: 120, minutes_completed: 80,  sticky_color: 'bg-emerald-100', date_logged: daysAgo(0), created_at: hoursAgo(3)  },
  { id: 'l-03', user_id: 'u-marcus', topic: 'TypeScript Generics',           description: 'Finally clicked. Conditional types are actually insane.',                       minutes_spent: 60,  minutes_completed: 45,  sticky_color: 'bg-purple-100',  date_logged: daysAgo(1), created_at: hoursAgo(26) },
  { id: 'l-04', user_id: 'u-nina',   topic: 'Algorithms: Binary Search',     description: 'Solved 8 LeetCode problems. Off-by-one errors are my nemesis 💀',              minutes_spent: 150, minutes_completed: 150, sticky_color: 'bg-pink-100',    date_logged: daysAgo(1), created_at: hoursAgo(28) },
  { id: 'l-05', user_id: 'u-carlos', topic: 'CSS Grid Layout',               description: 'Built a full magazine-style grid. Grid areas are elite.',                      minutes_spent: 45,  minutes_completed: 20,  sticky_color: 'bg-sky-100',     date_logged: daysAgo(2), created_at: hoursAgo(50) },
  { id: 'l-06', user_id: 'u-alex',   topic: 'Rust Ownership Model',          description: 'The borrow checker humbled me. Fought it for 2 hours. Won 3 rounds.',          minutes_spent: 120, minutes_completed: 120, sticky_color: 'bg-emerald-100', date_logged: daysAgo(2), created_at: hoursAgo(52) },
  { id: 'l-07', user_id: 'u-priya',  topic: 'Database Indexing',             description: 'B-trees, covering indexes, EXPLAIN ANALYZE. This is real power.',              minutes_spent: 75,  minutes_completed: 60,  sticky_color: 'bg-yellow-100',  date_logged: daysAgo(3), created_at: hoursAgo(75) },
  { id: 'l-08', user_id: 'u-nina',   topic: 'Machine Learning: Backprop',    description: 'Implemented backpropagation from scratch. My gradients finally flow.',         minutes_spent: 200, minutes_completed: 160, sticky_color: 'bg-purple-100',  date_logged: daysAgo(3), created_at: hoursAgo(76) },
  { id: 'l-09', user_id: 'u-marcus', topic: 'Docker & Containers',           description: 'Containerized my whole dev setup. Ship it everywhere now.',                    minutes_spent: 90,  minutes_completed: 90,  sticky_color: 'bg-sky-100',     date_logged: daysAgo(4), created_at: hoursAgo(98) },
  { id: 'l-10', user_id: 'u-carlos', topic: 'Vim Motions',                   description: 'Spent 30 mins figuring out how to exit. Progress!',                            minutes_spent: 30,  minutes_completed: 10,  sticky_color: 'bg-pink-100',    date_logged: daysAgo(5), created_at: hoursAgo(120) },
  { id: 'l-11', user_id: 'u-nina',   topic: 'Kubernetes Basics',             description: 'Pods, deployments, services. K8s is just Docker with anxiety.',                minutes_spent: 180, minutes_completed: 180, sticky_color: 'bg-emerald-100', date_logged: daysAgo(5), created_at: hoursAgo(121) },
  { id: 'l-12', user_id: 'u-alex',   topic: 'Web Performance Optimization',  description: 'CLS, LCP, INP. Scored 98 on Lighthouse. Gigachad moment.',                   minutes_spent: 105, minutes_completed: 105, sticky_color: 'bg-purple-100',  date_logged: daysAgo(6), created_at: hoursAgo(145) },
]

const SEED_REACTIONS: Reaction[] = [
  { id: 'r-01', log_id: 'l-01', user_id: 'u-priya',  reaction_type: '🔥' },
  { id: 'r-02', log_id: 'l-01', user_id: 'u-nina',   reaction_type: '🧠' },
  { id: 'r-03', log_id: 'l-01', user_id: 'u-marcus', reaction_type: '🔥' },
  { id: 'r-04', log_id: 'l-02', user_id: 'u-alex',   reaction_type: '🗿' },
  { id: 'r-05', log_id: 'l-02', user_id: 'u-nina',   reaction_type: '🔥' },
  { id: 'r-06', log_id: 'l-03', user_id: 'u-priya',  reaction_type: '👏' },
  { id: 'r-07', log_id: 'l-04', user_id: 'u-alex',   reaction_type: '💀' },
  { id: 'r-08', log_id: 'l-04', user_id: 'u-carlos', reaction_type: '🧠' },
  { id: 'r-09', log_id: 'l-08', user_id: 'u-alex',   reaction_type: '🔥' },
  { id: 'r-10', log_id: 'l-08', user_id: 'u-priya',  reaction_type: '🗿' },
  { id: 'r-11', log_id: 'l-11', user_id: 'u-marcus', reaction_type: '💀' },
  { id: 'r-12', log_id: 'l-12', user_id: 'u-nina',   reaction_type: '🔥' },
]

const SEED_FRAGMENTS: Fragment[] = [
  { id: 'f-01', log_id: 'l-01', user_id: 'u-priya',  message: 'RSC is a game changer. Did you try it with Next.js 14?', created_at: hoursAgo(1.5) },
  { id: 'f-02', log_id: 'l-01', user_id: 'u-alex',   message: 'Yeah! The server actions make forms actually fun to write now 🔥', created_at: hoursAgo(1.2) },
  { id: 'f-03', log_id: 'l-01', user_id: 'u-marcus', message: 'Gonna study this tomorrow. Thanks for the inspo!', created_at: hoursAgo(0.8) },
  { id: 'f-04', log_id: 'l-02', user_id: 'u-nina',   message: 'System design interviews are the final boss. Keep grinding 💪', created_at: hoursAgo(2.5) },
  { id: 'f-05', log_id: 'l-02', user_id: 'u-priya',  message: 'Update: finished the hashing section. Consistency is wild 🤯', created_at: hoursAgo(1.8) },
  { id: 'f-06', log_id: 'l-04', user_id: 'u-alex',   message: 'Binary search on a rotated array is where it gets spicy. You done that one?', created_at: hoursAgo(25) },
  { id: 'f-07', log_id: 'l-04', user_id: 'u-nina',   message: 'Did 3 of those! Off-by-one errors haunt my dreams 💀', created_at: hoursAgo(24) },
  { id: 'f-08', log_id: 'l-08', user_id: 'u-priya',  message: 'Backprop from scratch is PEAK brain training. W move.', created_at: hoursAgo(74) },
  { id: 'f-09', log_id: 'l-08', user_id: 'u-carlos', message: 'I tried this once and gave up 😭 respect.', created_at: hoursAgo(73) },
  { id: 'f-10', log_id: 'l-08', user_id: 'u-nina',   message: 'Progress update: 40 more minutes in, gradients actually converging now!', created_at: hoursAgo(70) },
  { id: 'f-11', log_id: 'l-09', user_id: 'u-alex',   message: 'Docker compose or bare containers?', created_at: hoursAgo(96) },
  { id: 'f-12', log_id: 'l-09', user_id: 'u-marcus', message: 'Both! compose for dev, bare for the CI pipeline.', created_at: hoursAgo(95) },
  { id: 'f-13', log_id: 'l-12', user_id: 'u-priya',  message: "98 on Lighthouse?? That's actual witchcraft 🧙", created_at: hoursAgo(143) },
  { id: 'f-14', log_id: 'l-12', user_id: 'u-alex',   message: "It's just lazy loading + font subsetting. Anyone can do it!", created_at: hoursAgo(142) },
]

const SEED_LINKS: ExternalLink[] = [
  { id: 'lk-01', log_id: 'l-01', added_by: 'u-alex',   url: 'https://www.youtube.com/watch?v=g5BGoLyGjY0', title: 'React Server Components Deep Dive', created_at: hoursAgo(1.8) },
  { id: 'lk-02', log_id: 'l-01', added_by: 'u-alex',   url: 'https://github.com/reactjs/rfcs/blob/main/text/0188-server-components.md', title: 'RFC: React Server Components', created_at: hoursAgo(1.6) },
  { id: 'lk-03', log_id: 'l-02', added_by: 'u-priya',  url: 'https://www.youtube.com/watch?v=UF9Ubu1x5Ow', title: 'Consistent Hashing Explained', created_at: hoursAgo(2.8) },
  { id: 'lk-04', log_id: 'l-02', added_by: 'u-priya',  url: 'https://drive.google.com/file/d/example', title: 'System Design Notes (Drive)', created_at: hoursAgo(2.5) },
  { id: 'lk-05', log_id: 'l-04', added_by: 'u-nina',   url: 'https://github.com/neetcode-gh/leetcode', title: 'NeetCode LeetCode Solutions', created_at: hoursAgo(27) },
  { id: 'lk-06', log_id: 'l-08', added_by: 'u-nina',   url: 'https://colab.research.google.com/drive/example', title: 'Backprop Implementation Notebook', created_at: hoursAgo(75) },
  { id: 'lk-07', log_id: 'l-09', added_by: 'u-marcus', url: 'https://docs.google.com/document/d/example', title: 'Docker Cheatsheet', created_at: hoursAgo(97) },
  { id: 'lk-08', log_id: 'l-12', added_by: 'u-alex',   url: 'https://www.youtube.com/watch?v=reG_FNVFONU', title: 'Web Vitals Explained', created_at: hoursAgo(144) },
]

// ─── storage keys ────────────────────────────────────────────────────────────

const KEYS = {
  users:         'lt_users',
  logs:          'lt_logs',
  reactions:     'lt_reactions',
  fragments:     'lt_fragments',
  links:         'lt_links',
  currentUserId: 'lt_current_user_id',
  passwords:     'lt_passwords',
} as const

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch { return fallback }
}
function write(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value))
}

function ensureSeeded() {
  if (!localStorage.getItem('lt_seeded_v3')) {
    write(KEYS.users,     SEED_USERS)
    write(KEYS.logs,      SEED_LOGS)
    write(KEYS.reactions, SEED_REACTIONS)
    write(KEYS.fragments, SEED_FRAGMENTS)
    write(KEYS.links,     SEED_LINKS)
    write(KEYS.passwords, {})
    localStorage.removeItem('lt_seeded')
    localStorage.removeItem('lt_seeded_v2')
    localStorage.setItem('lt_seeded_v3', '1')
  }
}

// ─── public API ──────────────────────────────────────────────────────────────

export const store = {
  init() { ensureSeeded() },

  // ── Auth ─────────────────────────────────────────────────────────────────

  getCurrentUserId(): string | null {
    return localStorage.getItem(KEYS.currentUserId)
  },

  getCurrentUser(): User | null {
    const id = store.getCurrentUserId()
    return id ? (store.getUser(id) ?? null) : null
  },

  signIn(username: string, password: string): { user: User } | { error: string } {
    const users     = read<User[]>(KEYS.users, [])
    const passwords = read<Record<string, string>>(KEYS.passwords, {})
    const user = users.find((u) => u.username.toLowerCase() === username.toLowerCase())
    if (!user) return { error: 'No account with that username.' }
    const stored = passwords[user.id]
    if (stored && stored !== password) return { error: 'Wrong password.' }
    localStorage.setItem(KEYS.currentUserId, user.id)
    return { user }
  },

  signUp(username: string, password: string): { user: User } | { error: string } {
    const users = read<User[]>(KEYS.users, [])
    if (users.some((u) => u.username.toLowerCase() === username.toLowerCase()))
      return { error: 'Username already taken.' }
    const user: User = {
      id: uid(), username,
      avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`,
      bio: '',
      current_streak: 0,
      created_at: new Date().toISOString(),
    }
    users.push(user)
    write(KEYS.users, users)
    const passwords = read<Record<string, string>>(KEYS.passwords, {})
    passwords[user.id] = password
    write(KEYS.passwords, passwords)
    localStorage.setItem(KEYS.currentUserId, user.id)
    return { user }
  },

  signOut() { localStorage.removeItem(KEYS.currentUserId) },

  // ── Users ────────────────────────────────────────────────────────────────

  getUser(id: string): User | undefined {
    return read<User[]>(KEYS.users, []).find((u) => u.id === id)
  },

  getAllUsers(): User[] {
    return read<User[]>(KEYS.users, [])
  },

  updateProfile(userId: string, fields: { username?: string; bio?: string; avatarSeed?: string }) {
    const users = read<User[]>(KEYS.users, [])
    const idx = users.findIndex((u) => u.id === userId)
    if (idx === -1) return { error: 'User not found.' }
    if (fields.username) {
      const taken = users.some((u) => u.id !== userId && u.username.toLowerCase() === fields.username!.toLowerCase())
      if (taken) return { error: 'Username already taken.' }
      users[idx].username = fields.username
    }
    if (fields.bio !== undefined)        users[idx].bio = fields.bio
    if (fields.avatarSeed !== undefined) users[idx].avatar_url = `https://api.dicebear.com/7.x/bottts/svg?seed=${fields.avatarSeed}`
    write(KEYS.users, users)
    return { user: users[idx] }
  },

  updateStreak(userId: string, streak: number) {
    const users = read<User[]>(KEYS.users, [])
    const idx = users.findIndex((u) => u.id === userId)
    if (idx !== -1) { users[idx].current_streak = streak; write(KEYS.users, users) }
  },

  // ── Logs ─────────────────────────────────────────────────────────────────

  getLogs(userId?: string): LearningLog[] {
    const all = read<LearningLog[]>(KEYS.logs, [])
    const logs = userId ? all.filter((l) => l.user_id === userId) : all
    return logs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  },

  getLog(id: string): LearningLog | undefined {
    return read<LearningLog[]>(KEYS.logs, []).find((l) => l.id === id)
  },

  addLog(data: Omit<LearningLog, 'id' | 'created_at' | 'minutes_completed'>): LearningLog {
    const logs = read<LearningLog[]>(KEYS.logs, [])
    const log: LearningLog = { ...data, minutes_completed: 0, id: uid(), created_at: new Date().toISOString() }
    logs.push(log)
    write(KEYS.logs, logs)
    const user = store.getUser(data.user_id)
    if (user) store.updateStreak(data.user_id, user.current_streak + 1)
    return log
  },

  updateProgress(logId: string, minutesCompleted: number) {
    const logs = read<LearningLog[]>(KEYS.logs, [])
    const idx = logs.findIndex((l) => l.id === logId)
    if (idx !== -1) {
      logs[idx].minutes_completed = Math.max(0, Math.min(minutesCompleted, logs[idx].minutes_spent))
      write(KEYS.logs, logs)
    }
  },

  deleteLog(id: string) {
    write(KEYS.logs,      read<LearningLog[]>(KEYS.logs, []).filter((l) => l.id !== id))
    write(KEYS.fragments, read<Fragment[]>(KEYS.fragments, []).filter((f) => f.log_id !== id))
    write(KEYS.reactions, read<Reaction[]>(KEYS.reactions, []).filter((r) => r.log_id !== id))
    write(KEYS.links,     read<ExternalLink[]>(KEYS.links, []).filter((lk) => lk.log_id !== id))
  },

  // ── Fragments ────────────────────────────────────────────────────────────

  getFragments(logId: string): Fragment[] {
    return read<Fragment[]>(KEYS.fragments, [])
      .filter((f) => f.log_id === logId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  },

  addFragment(logId: string, userId: string, message: string): Fragment {
    const fragments = read<Fragment[]>(KEYS.fragments, [])
    const frag: Fragment = { id: uid(), log_id: logId, user_id: userId, message, created_at: new Date().toISOString() }
    fragments.push(frag)
    write(KEYS.fragments, fragments)
    return frag
  },

  deleteFragment(id: string) {
    write(KEYS.fragments, read<Fragment[]>(KEYS.fragments, []).filter((f) => f.id !== id))
  },

  // ── External Links ───────────────────────────────────────────────────────

  getLinks(logId: string): ExternalLink[] {
    return read<ExternalLink[]>(KEYS.links, [])
      .filter((lk) => lk.log_id === logId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  },

  addLink(logId: string, userId: string, url: string, title: string): ExternalLink {
    const links = read<ExternalLink[]>(KEYS.links, [])
    const link: ExternalLink = { id: uid(), log_id: logId, added_by: userId, url, title, created_at: new Date().toISOString() }
    links.push(link)
    write(KEYS.links, links)
    return link
  },

  deleteLink(id: string) {
    write(KEYS.links, read<ExternalLink[]>(KEYS.links, []).filter((lk) => lk.id !== id))
  },

  // ── Reactions ────────────────────────────────────────────────────────────

  getReactions(): Reaction[] {
    return read<Reaction[]>(KEYS.reactions, [])
  },

  getReactionsForLog(logId: string): Reaction[] {
    return read<Reaction[]>(KEYS.reactions, []).filter((r) => r.log_id === logId)
  },

  toggleReaction(logId: string, userId: string, emoji: string): 'added' | 'removed' {
    const reactions = read<Reaction[]>(KEYS.reactions, [])
    const idx = reactions.findIndex((r) => r.log_id === logId && r.user_id === userId && r.reaction_type === emoji)
    if (idx !== -1) { reactions.splice(idx, 1); write(KEYS.reactions, reactions); return 'removed' }
    reactions.push({ id: uid(), log_id: logId, user_id: userId, reaction_type: emoji })
    write(KEYS.reactions, reactions)
    return 'added'
  },

  // ── Leaderboard ──────────────────────────────────────────────────────────

  getLeaderboard(filter: 'week' | 'month' | 'all'): Array<User & { total_minutes: number; total_sessions: number }> {
    const cutoff = filter === 'week'
      ? new Date(Date.now() - 7 * 86_400_000).toISOString().split('T')[0]
      : filter === 'month'
        ? new Date(Date.now() - 30 * 86_400_000).toISOString().split('T')[0]
        : '1970-01-01'

    const logs  = read<LearningLog[]>(KEYS.logs, []).filter((l) => l.date_logged >= cutoff)
    const users = read<User[]>(KEYS.users, [])
    const map   = new Map<string, { total_minutes: number; total_sessions: number }>()

    for (const log of logs) {
      const e = map.get(log.user_id) ?? { total_minutes: 0, total_sessions: 0 }
      e.total_minutes  += log.minutes_completed
      e.total_sessions += 1
      map.set(log.user_id, e)
    }

    return users
      .filter((u) => map.has(u.id))
      .map((u) => ({ ...u, ...map.get(u.id)! }))
      .sort((a, b) => b.total_minutes - a.total_minutes)
  },
}
