import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User } from '../types'
import toast from 'react-hot-toast'

const AUTH_STORAGE_KEY = 'erjem_auth_user'

interface AuthContextType {
  currentUser: User | null
  userProfile: User | null
  loading: boolean
  register: (email: string, password: string, displayName: string) => Promise<void>
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  async function register(email: string, password: string, displayName: string) {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, displayName })
      })
      
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to register')
      }
      
      const user = await res.json()
      setCurrentUser(user)
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user))
      toast.success('Account created successfully!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to create account')
      throw error
    }
  }

  async function login(email: string, password: string) {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to login')
      }
      
      const user = await res.json()
      setCurrentUser(user)
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user))
      toast.success('Logged in successfully!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to log in')
      throw error
    }
  }

  async function logout() {
    try {
      setCurrentUser(null)
      localStorage.removeItem(AUTH_STORAGE_KEY)
      toast.success('Logged out successfully!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to log out')
      throw error
    }
  }

  useEffect(() => {
    // Check for stored user on mount
    const storedUser = localStorage.getItem(AUTH_STORAGE_KEY)
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser))
      } catch {
        localStorage.removeItem(AUTH_STORAGE_KEY)
      }
    }
    setLoading(false)
  }, [])

  const value: AuthContextType = {
    currentUser,
    userProfile: currentUser,
    loading,
    register,
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
