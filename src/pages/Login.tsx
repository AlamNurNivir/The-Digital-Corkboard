import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const navigate = useNavigate()
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const result = mode === 'signin'
      ? signIn(username, password)
      : signUp(username, password)

    if (result.error) {
      setError(result.error)
    } else {
      navigate('/dashboard')
    }
    setLoading(false)
  }

  function switchMode(m: 'signin' | 'signup') {
    setMode(m)
    setError(null)
  }

  return (
    <div className="min-h-screen corkboard flex items-center justify-center p-4">
      {/* Decorative floating notes */}
      <div className="absolute top-16 left-10 bg-pink-100 border-2 border-slate-900 shadow-neo px-4 py-3 hidden lg:block" style={{ transform: 'rotate(-8deg)' }}>
        <span className="font-caveat text-lg font-bold text-pink-900">study streaks 🔥</span>
      </div>
      <div className="absolute top-28 right-14 bg-emerald-100 border-2 border-slate-900 shadow-neo px-4 py-3 hidden lg:block" style={{ transform: 'rotate(6deg)' }}>
        <span className="font-caveat text-lg font-bold text-emerald-900">brain gains 🧠</span>
      </div>
      <div className="absolute bottom-24 left-16 bg-sky-100 border-2 border-slate-900 shadow-neo px-4 py-3 hidden lg:block" style={{ transform: 'rotate(4deg)' }}>
        <span className="font-caveat text-lg font-bold text-sky-900">nerd mode: ON 💀</span>
      </div>
      <div className="absolute bottom-32 right-20 bg-purple-100 border-2 border-slate-900 shadow-neo px-4 py-3 hidden lg:block" style={{ transform: 'rotate(-5deg)' }}>
        <span className="font-caveat text-lg font-bold text-purple-900">giga brain hours 🗿</span>
      </div>
      <div className="absolute top-1/2 left-6 bg-yellow-200 border-2 border-slate-900 shadow-neo px-3 py-2 hidden xl:block" style={{ transform: 'rotate(-3deg) translateY(-50%)' }}>
        <span className="font-caveat text-base font-bold text-yellow-900">log it or lose it ✍️</span>
      </div>

      {/* Main card */}
      <div
        className="relative w-full max-w-md bg-yellow-100 border-2 border-slate-900 p-8 z-10"
        style={{ boxShadow: '8px 8px 0px 0px rgba(15,23,42,1)', transform: 'rotate(-0.8deg)' }}
      >
        <div className="push-pin" />

        <div className="text-center mb-8 mt-4">
          <h1 className="font-caveat text-4xl font-bold text-slate-900 leading-tight">
            Stop scrolling,<br />start logging.
          </h1>
          <p className="font-caveat text-xl text-yellow-700 mt-2">Brain gains await. 🧠</p>
        </div>

        {/* Demo hint */}
        <div className="mb-5 px-4 py-3 bg-white border-2 border-dashed border-slate-400 text-center">
          <p className="font-mono text-xs text-slate-600 leading-relaxed">
            <strong>Demo:</strong> sign in as <code className="bg-yellow-200 px-1">alex_codes</code> with any password,
            or sign up to create a new account.
          </p>
        </div>

        {/* Toggle */}
        <div className="flex border-2 border-slate-900 mb-6 bg-white">
          <button
            onClick={() => switchMode('signin')}
            className={`flex-1 py-2.5 text-sm font-bold transition-colors ${
              mode === 'signin' ? 'bg-slate-900 text-yellow-300' : 'text-slate-700 hover:bg-yellow-50'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => switchMode('signup')}
            className={`flex-1 py-2.5 text-sm font-bold transition-colors ${
              mode === 'signup' ? 'bg-slate-900 text-yellow-300' : 'text-slate-700 hover:bg-yellow-50'
            }`}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="your_epic_username"
              required
              className="w-full px-4 py-3 bg-white border-2 border-slate-900 text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-yellow-400 font-mono text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-4 py-3 bg-white border-2 border-slate-900 text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-yellow-400 font-mono text-sm"
            />
          </div>

          {error && (
            <div className="px-4 py-3 bg-red-100 border-2 border-red-400 text-red-800 text-sm font-semibold">
              ❌ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-slate-900 text-yellow-300 font-bold text-base border-2 border-slate-900 hover:bg-slate-800 active:translate-y-0.5 transition-all disabled:opacity-50 mt-2"
            style={{ boxShadow: '4px 4px 0px 0px rgba(250,204,21,1)' }}
          >
            {loading ? 'Hang on...' : mode === 'signin' ? '🔓 Get Me In' : '🚀 Start My Journey'}
          </button>
        </form>

        <p className="text-center text-xs text-slate-500 mt-6 font-mono">
          {mode === 'signin' ? 'No account? ' : 'Already in? '}
          <button
            onClick={() => switchMode(mode === 'signin' ? 'signup' : 'signin')}
            className="text-yellow-700 font-bold underline hover:text-yellow-900"
          >
            {mode === 'signin' ? 'Sign up free' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  )
}
