import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { store, type User } from '../lib/store'

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (username: string, password: string) => { error?: string }
  signUp: (username: string, password: string) => { error?: string }
  signOut: () => void
  refreshUser: () => void
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: () => ({}),
  signUp: () => ({}),
  signOut: () => {},
  refreshUser: () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    store.init()
    setUser(store.getCurrentUser())
    setLoading(false)
  }, [])

  function refreshUser() {
    setUser(store.getCurrentUser())
  }

  function signIn(username: string, password: string) {
    const result = store.signIn(username, password)
    if ('error' in result) return { error: result.error }
    setUser(result.user)
    return {}
  }

  function signUp(username: string, password: string) {
    const result = store.signUp(username, password)
    if ('error' in result) return { error: result.error }
    setUser(result.user)
    return {}
  }

  function signOut() {
    store.signOut()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
