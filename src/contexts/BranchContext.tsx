import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { Branch } from '../types'
import { useAuth } from './AuthContext'
import toast from 'react-hot-toast'

interface BranchContextType {
  currentBranch: Branch | null
  availableBranches: Branch[]
  loading: boolean
  switchBranch: (branchId: string) => void
  refreshBranches: () => Promise<void>
}

const BranchContext = createContext<BranchContextType | undefined>(undefined)

export function useBranch() {
  const context = useContext(BranchContext)
  if (!context) {
    throw new Error('useBranch must be used within a BranchProvider')
  }
  return context
}

interface BranchProviderProps {
  children: ReactNode
}

export function BranchProvider({ children }: BranchProviderProps) {
  const { currentUser } = useAuth()
  const [currentBranch, setCurrentBranch] = useState<Branch | null>(null)
  const [availableBranches, setAvailableBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)

  // Initialize default branches if none exist
  const initializeDefaultBranches = async () => {
    if (!currentUser) return

    const branchesRef = collection(db, 'branches')
    const snapshot = await getDocs(branchesRef)

    if (snapshot.empty) {
      // Create default branches
      const defaultBranches = [
        {
          id: 'erjem-glass',
          name: 'ERJEM Glass',
          displayName: 'ERJEM Glass',
          createdAt: new Date(),
          createdBy: currentUser.uid,
          isActive: true,
          settings: {
            currency: 'PHP',
            fiscalYearStart: 1,
          },
        },
        {
          id: 'erjem-machine-shop',
          name: 'ERJEM Machine Shop',
          displayName: 'ERJEM Machine Shop',
          createdAt: new Date(),
          createdBy: currentUser.uid,
          isActive: true,
          settings: {
            currency: 'PHP',
            fiscalYearStart: 1,
          },
        },
      ]

      for (const branch of defaultBranches) {
        await setDoc(doc(db, 'branches', branch.id), branch)
        
        // Grant user access to this branch
        await setDoc(doc(db, 'userBranches', `${currentUser.uid}_${branch.id}`), {
          userId: currentUser.uid,
          branchId: branch.id,
          role: 'admin',
          createdAt: new Date(),
        })
      }

      toast.success('Default branches created!')
    }
  }

  const fetchBranches = async () => {
    if (!currentUser) {
      setLoading(false)
      return
    }

    try {
      // Initialize default branches if needed
      await initializeDefaultBranches()

      // Get user's branch access
      const userBranchesRef = collection(db, 'userBranches')
      const userBranchesQuery = query(userBranchesRef, where('userId', '==', currentUser.uid))
      const userBranchesSnapshot = await getDocs(userBranchesQuery)

      const branchIds = userBranchesSnapshot.docs.map((doc) => doc.data().branchId)

      if (branchIds.length === 0) {
        setLoading(false)
        return
      }

      // Get branches
      const branchesRef = collection(db, 'branches')
      const branchesSnapshot = await getDocs(branchesRef)
      const branches = branchesSnapshot.docs
        .map((doc) => ({ ...doc.data(), id: doc.id } as Branch))
        .filter((branch) => branchIds.includes(branch.id) && branch.isActive)

      setAvailableBranches(branches)

      // Set current branch from localStorage or first available
      const savedBranchId = localStorage.getItem('currentBranchId')
      const savedBranch = branches.find((b) => b.id === savedBranchId)

      if (savedBranch) {
        setCurrentBranch(savedBranch)
      } else if (branches.length > 0) {
        setCurrentBranch(branches[0])
        localStorage.setItem('currentBranchId', branches[0].id)
      }
    } catch (error) {
      console.error('Error fetching branches:', error)
      toast.error('Failed to load branches')
    } finally {
      setLoading(false)
    }
  }

  const switchBranch = (branchId: string) => {
    const branch = availableBranches.find((b) => b.id === branchId)
    if (branch) {
      setCurrentBranch(branch)
      localStorage.setItem('currentBranchId', branchId)
      toast.success(`Switched to ${branch.displayName}`)
    }
  }

  const refreshBranches = async () => {
    setLoading(true)
    await fetchBranches()
  }

  useEffect(() => {
    if (currentUser) {
      fetchBranches()
    } else {
      setCurrentBranch(null)
      setAvailableBranches([])
      setLoading(false)
    }
  }, [currentUser])

  const value: BranchContextType = {
    currentBranch,
    availableBranches,
    loading,
    switchBranch,
    refreshBranches,
  }

  return <BranchContext.Provider value={value}>{children}</BranchContext.Provider>
}
