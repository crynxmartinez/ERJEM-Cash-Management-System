import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Branch } from '../types'
import { useAuth } from './AuthContext'
import toast from 'react-hot-toast'
import { api } from '../lib/api'

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

    try {
      const branches = await api.getBranches()
      
      if (branches.length === 0) {
        // Create default branches in Prisma
        const defaultBranches = [
          {
            id: 'erjem-glass',
            name: 'ERJEM Glass',
            displayName: 'ERJEM Glass',
            createdBy: currentUser.id,
            isActive: true,
            currency: 'PHP',
            fiscalYearStart: 1,
          },
          {
            id: 'erjem-machine-shop',
            name: 'ERJEM Machine Shop',
            displayName: 'ERJEM Machine Shop',
            createdBy: currentUser.id,
            isActive: true,
            currency: 'PHP',
            fiscalYearStart: 1,
          },
        ]

        for (const branch of defaultBranches) {
          await api.createBranch(branch)
        }

        toast.success('Default branches created!')
      }
    } catch (error) {
      console.error('Error initializing branches:', error)
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

      // Get all branches from Prisma
      const branches = await api.getBranches()

      setAvailableBranches(branches)

      // Set current branch from localStorage or first available
      const savedBranchId = localStorage.getItem('currentBranchId')
      const savedBranch = branches.find((b: Branch) => b.id === savedBranchId)

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
