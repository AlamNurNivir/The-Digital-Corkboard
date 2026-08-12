import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen corkboard flex items-center justify-center">
        <div className="relative bg-yellow-100 border-2 border-slate-900 shadow-neo px-10 py-8 text-center">
          <div className="push-pin" />
          <p className="font-caveat text-2xl font-bold text-slate-900 mt-2">Loading your board... 📌</p>
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  return <>{children}</>
}
