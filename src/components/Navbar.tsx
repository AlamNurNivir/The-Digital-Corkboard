import { useState } from 'react'
import { NavLink, Link, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Users, Trophy, LogOut, ChevronDown, UserCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getMemeRank } from '../lib/store'

export default function Navbar() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [dropdownOpen, setDropdownOpen] = useState(false)

  function handleLogout() {
    signOut()
    navigate('/login')
  }

  const streak = user?.current_streak ?? 0
  const rank   = getMemeRank(streak)

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 px-4 py-2 font-semibold border-2 border-slate-900 text-sm transition-all duration-150 ${
      isActive
        ? 'bg-yellow-300 shadow-neo -translate-y-0.5'
        : 'bg-white hover:bg-yellow-100 hover:shadow-neo hover:-translate-y-0.5'
    }`

  return (
    <header
      className="sticky top-0 z-50 border-b-4 border-slate-900"
      style={{ background: '#fef3c7', boxShadow: '0 4px 0 0 rgba(15,23,42,1)' }}
    >
      <nav className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <NavLink to="/dashboard" className="flex items-center gap-2 shrink-0">
          <span className="text-2xl font-caveat font-bold text-slate-900 tracking-tight">
            Learn<span className="text-yellow-500">Track</span>
          </span>
          <span className="text-xl">📌</span>
        </NavLink>

        {/* Nav links */}
        <div className="flex items-center gap-2">
          <NavLink to="/dashboard" className={navLinkClass}>
            <LayoutDashboard size={16} />
            <span className="hidden sm:inline">My Board</span>
          </NavLink>
          <NavLink to="/feed" className={navLinkClass}>
            <Users size={16} />
            <span className="hidden sm:inline">Friend Wall</span>
          </NavLink>
          <NavLink to="/leaderboard" className={navLinkClass}>
            <Trophy size={16} />
            <span className="hidden sm:inline">Hall of Fame</span>
          </NavLink>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3 shrink-0">
          {streak > 0 && (
            <div className="hidden sm:flex items-center gap-1 px-3 py-1.5 bg-orange-100 border-2 border-slate-900 shadow-neo text-sm font-bold text-slate-900">
              <span className="fire-animate">🔥</span>
              <span className="font-mono">{streak}d</span>
            </div>
          )}

          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 px-3 py-2 bg-white border-2 border-slate-900 shadow-neo hover:shadow-neo-hover hover:-translate-y-0.5 transition-all duration-150"
            >
              <img
                src={user?.avatar_url ?? 'https://api.dicebear.com/7.x/bottts/svg?seed=default'}
                alt="avatar"
                className="w-7 h-7 rounded-full border border-slate-900"
              />
              <span className="text-sm font-semibold text-slate-900 max-w-[80px] truncate hidden sm:inline">
                {user?.username ?? 'User'}
              </span>
              <ChevronDown size={14} className={`transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {dropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                <div className="absolute right-0 top-full mt-2 w-60 bg-white border-2 border-slate-900 shadow-neo-lg z-50 overflow-hidden">
                  {/* User info */}
                  <div className="px-4 py-3 border-b-2 border-slate-200 flex items-center gap-3">
                    <img
                      src={user?.avatar_url ?? 'https://api.dicebear.com/7.x/bottts/svg?seed=default'}
                      alt="avatar"
                      className="w-10 h-10 rounded-full border-2 border-slate-900 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-slate-900 truncate">{user?.username}</p>
                      <p className="font-caveat text-sm text-slate-600 leading-tight">{rank}</p>
                    </div>
                  </div>

                  {/* View profile */}
                  {user && (
                    <Link
                      to={`/profile/${user.id}`}
                      onClick={() => setDropdownOpen(false)}
                      className="w-full flex items-center gap-2 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-yellow-50 transition-colors border-b border-slate-100"
                    >
                      <UserCircle size={15} />
                      View Profile
                    </Link>
                  )}

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut size={15} />
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  )
}
