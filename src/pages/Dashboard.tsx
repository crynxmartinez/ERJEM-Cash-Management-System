import { useState, useEffect } from 'react'
import { useBranch } from '../contexts/BranchContext'
import { TrendingUp, TrendingDown, DollarSign, PiggyBank } from 'lucide-react'
import { db } from '../lib/firebase'
import { collection, getDocs } from 'firebase/firestore'

export default function Dashboard() {
  const { currentBranch } = useBranch()
  const currentYear = new Date().getFullYear()
  const [year1, setYear1] = useState(currentYear)
  const [year2, setYear2] = useState(currentYear - 1)
  const [transactions, setTransactions] = useState<any[]>([])

  useEffect(() => {
    if (!currentBranch) return

    const fetchTransactions = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'transactions'))
        const data = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        const filtered = data.filter((t: any) => t.branchId === currentBranch.id)
        setTransactions(filtered)
      } catch (error) {
        console.error('Error fetching transactions:', error)
      }
    }

    fetchTransactions()
  }, [currentBranch])

  // Filter transactions by year1
  const year1Transactions = transactions.filter(t => {
    if (typeof t.date === 'number') {
      const jsDate = new Date((t.date - 25569) * 86400 * 1000)
      return jsDate.getFullYear() === year1
    }
    return false
  })

  const totalIncome = year1Transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + (t.amount || 0), 0)

  const totalExpenses = year1Transactions
    .filter(t => t.type === 'expense' && !t.isPersonal)
    .reduce((sum, t) => sum + (t.amount || 0), 0)

  const personalExpenses = year1Transactions
    .filter(t => t.isPersonal === true)
    .reduce((sum, t) => sum + (t.amount || 0), 0)

  const netProfit = totalIncome - totalExpenses
  const totalSavings = netProfit - personalExpenses

  // Calculate monthly data for line graph
  const monthlyData = Array.from({ length: 12 }, (_, month) => {
    const monthTransactions = year1Transactions.filter(t => {
      if (typeof t.date === 'number') {
        const jsDate = new Date((t.date - 25569) * 86400 * 1000)
        return jsDate.getMonth() === month
      }
      return false
    })
    
    const income = monthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + (t.amount || 0), 0)
    
    const expenses = monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + (t.amount || 0), 0)
    
    return { month, income, expenses }
  })

  const maxValue = Math.max(
    ...monthlyData.map(d => Math.max(d.income, d.expenses)),
    1
  )

  const kpiData = [
    {
      title: 'Total Income',
      value: `₱${totalIncome.toLocaleString()}`,
      change: 0,
      trend: 'up' as const,
      icon: DollarSign,
    },
    {
      title: 'Total Expenses',
      value: `₱${totalExpenses.toLocaleString()}`,
      change: 0,
      trend: 'up' as const,
      icon: TrendingUp,
    },
    {
      title: 'Net Profit',
      value: `₱${netProfit.toLocaleString()}`,
      change: 0,
      trend: netProfit >= 0 ? 'up' as const : 'down' as const,
      icon: TrendingUp,
    },
    {
      title: 'Total Savings',
      value: `₱${totalSavings.toLocaleString()}`,
      change: 0,
      trend: totalSavings >= 0 ? 'up' as const : 'down' as const,
      icon: PiggyBank,
    },
  ]

  const years = Array.from({ length: 10 }, (_, i) => currentYear - i)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {currentBranch?.displayName} - Financial Overview
        </p>
      </div>

      {/* Year Comparison Selectors */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Year-to-Year Comparison
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Year 1
            </label>
            <select
              value={year1}
              onChange={(e) => setYear1(Number(e.target.value))}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Year 2
            </label>
            <select
              value={year2}
              onChange={(e) => setYear2(Number(e.target.value))}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiData.map((kpi, index) => (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-primary-100 dark:bg-primary-900/20 rounded-lg">
                <kpi.icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div
                className={`flex items-center gap-1 text-sm font-medium ${
                  kpi.trend === 'up'
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {kpi.trend === 'up' ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                {kpi.change}%
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {kpi.title}
            </h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
              {kpi.value}
            </p>
          </div>
        ))}
      </div>

      {/* Financial Trends Line Graph */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Financial Trends ({year1})
        </h2>
        <div className="h-80 relative">
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 bottom-12 flex flex-col justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>₱{(maxValue).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            <span>₱{(maxValue * 0.75).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            <span>₱{(maxValue * 0.5).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            <span>₱{(maxValue * 0.25).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            <span>₱0</span>
          </div>
          
          {/* Graph area */}
          <div className="ml-16 h-full relative">
            {/* Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between pb-12">
              {[0, 1, 2, 3, 4].map(i => (
                <div key={i} className="border-t border-gray-200 dark:border-gray-700" />
              ))}
            </div>
            
            {/* SVG for lines */}
            <svg className="absolute inset-0 w-full h-full pb-12" preserveAspectRatio="none">
              {/* Income line (blue) */}
              <polyline
                fill="none"
                stroke="#3b82f6"
                strokeWidth="3"
                points={monthlyData.map((d, i) => {
                  const x = (i / 11) * 100
                  const y = 100 - (d.income / maxValue) * 100
                  return `${x}%,${y}%`
                }).join(' ')}
              />
              
              {/* Expenses line (red) */}
              <polyline
                fill="none"
                stroke="#ef4444"
                strokeWidth="3"
                points={monthlyData.map((d, i) => {
                  const x = (i / 11) * 100
                  const y = 100 - (d.expenses / maxValue) * 100
                  return `${x}%,${y}%`
                }).join(' ')}
              />
            </svg>
            
            {/* X-axis labels (months) */}
            <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-500 dark:text-gray-400">
              {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month, i) => (
                <span key={i}>{month}</span>
              ))}
            </div>
          </div>
        </div>
        
        {/* Legend */}
        <div className="flex justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-blue-500" />
            <span className="text-sm text-gray-700 dark:text-gray-300">Income</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-red-500" />
            <span className="text-sm text-gray-700 dark:text-gray-300">Expenses</span>
          </div>
        </div>
      </div>
    </div>
  )
}
