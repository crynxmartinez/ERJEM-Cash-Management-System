export interface User {
  id: string
  email: string
  displayName: string
  createdAt: string | Date
}

export interface Branch {
  id: string
  name: string
  displayName: string
  createdAt: string | Date
  createdBy: string
  isActive: boolean
  currency?: string
  fiscalYearStart?: number
  settings?: {
    currency: string
    fiscalYearStart: number
  }
}

export interface Transaction {
  id: string
  userId: string
  branchId: string
  branchName?: string
  date: string | Date
  type: 'income' | 'expense'
  category?: string
  amount: number
  description?: string
  source?: string
  isPersonal: boolean
  entryMethod?: 'bulk' | 'manual' | 'daily-upload'
  createdAt: string | Date
  updatedAt: string | Date
}

export interface UserBranch {
  id: string
  userId: string
  branchId: string
  role: 'admin' | 'editor' | 'viewer'
  createdAt: string | Date
}

export interface Category {
  id: string
  name: string
  type: 'income' | 'expense' | 'both'
  userId: string
  isDefault: boolean
}

export interface KPICard {
  title: string
  value: number
  change: number
  trend: 'up' | 'down'
  icon: string
}

export interface MonthlyData {
  month: string
  income: number
  expenses: number
  profit: number
  profitToSaving: number
}

export interface YearlyData {
  year: number
  totalIncome: number
  totalExpenses: number
  totalProfit: number
  totalSavings: number
  monthlyData: MonthlyData[]
}
