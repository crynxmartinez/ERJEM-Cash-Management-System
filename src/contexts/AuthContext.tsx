import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import {
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'
import { User } from '../types'
import toast from 'react-hot-toast'

interface AuthContextType {
  currentUser: FirebaseUser | null
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
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null)
  const [userProfile, setUserProfile] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  async function register(email: string, password: string, displayName: string) {
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password)
      await updateProfile(user, { displayName })

      // Create user profile in Firestore
      const userDoc: User = {
        id: user.uid,
        email: user.email!,
        displayName,
        createdAt: new Date() as any,
      }

      await setDoc(doc(db, 'users', user.uid), userDoc)
      toast.success('Account created successfully!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to create account')
      throw error
    }
  }

  async function login(email: string, password: string) {
    try {
      await signInWithEmailAndPassword(auth, email, password)
      toast.success('Logged in successfully!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to log in')
      throw error
    }
  }

  async function logout() {
    try {
      await signOut(auth)
      toast.success('Logged out successfully!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to log out')
      throw error
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user)

      if (user) {
        // Fetch user profile from Firestore
        const userDoc = await getDoc(doc(db, 'users', user.uid))
        if (userDoc.exists()) {
          setUserProfile(userDoc.data() as User)
        }
      } else {
        setUserProfile(null)
      }

      setLoading(false)
    })

    return unsubscribe
  }, [])

  const value: AuthContextType = {
    currentUser,
    userProfile,
    loading,
    register,
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
