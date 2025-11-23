import { useState, useEffect } from 'react'
import { useBranch } from '../contexts/BranchContext'
import { db } from '../lib/firebase'
import { collection, getDocs } from 'firebase/firestore'

export default function Personal() {
  const { currentBranch } = useBranch()
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
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
        const filtered = data.filter((t: any) => 
          t.branchId === currentBranch.id && t.isPersonal === true
        )
        setTransactions(filtered)
      } catch (error) {
        console.error('Error fetching transactions:', error)
      }
    }

    fetchTransactions()
  }, [currentBranch])

  // Filter transactions by selected month/year
  const filteredTransactions = transactions
    .filter(t => {
      if (typeof t.date === 'number') {
        const jsDate = new Date((t.date - 25569) * 86400 * 1000)
        return jsDate.getMonth() === selectedMonth && jsDate.getFullYear() === selectedYear
      }
      return false
    })
    .sort((a, b) => {
      if (typeof a.date === 'number' && typeof b.date === 'number') {
        return b.date - a.date // Latest first
      }
      return 0
    })

  // Total expenses (all time)
  const totalExpenses = transactions.reduce((sum, t) => sum + (t.amount || 0), 0)
  
  // Monthly expenses (filtered month)
  const monthlyExpenses = filteredTransactions.reduce((sum, t) => sum + (t.amount || 0), 0)

  // Calculate daily expenses for the selected month
  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate()
  const dailyExpenses = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1
    const dayTotal = filteredTransactions
      .filter(t => {
        if (typeof t.date === 'number') {
          const jsDate = new Date((t.date - 25569) * 86400 * 1000)
          return jsDate.getDate() === day
        }
        return false
      })
      .reduce((sum, t) => sum + (t.amount || 0), 0)
    return { day, amount: dayTotal }
  })

  const maxDailyExpense = Math.max(...dailyExpenses.map(d => d.amount), 1)

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
          Personal Expenses
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {currentBranch?.displayName} - Track your personal spending
        </p>
      </div>

      {/* Month Filter */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Filter by Period
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Month
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            >
              {months.map((month, index) => (
                <option key={index} value={index}>
                  {month}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Year
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Total Expenses (All Time)
          </h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
            ₱{totalExpenses.toLocaleString()}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Monthly Expenses ({months[selectedMonth]} {selectedYear})
          </h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
            ₱{monthlyExpenses.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Daily Expense Graph */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Daily Expense Graph
        </h2>
        <div className="h-80 flex items-end justify-between gap-1 pb-8">
          {dailyExpenses.map(({ day, amount }) => (
            <div key={day} className="flex-1 flex flex-col items-center justify-end group relative">
              {/* Bar */}
              <div
                className={`w-7 rounded-t transition-all cursor-pointer ${
                  amount > 0
                    ? 'bg-red-500 hover:bg-red-600'
                    : 'bg-gray-200 dark:bg-gray-700'
                }`}
                style={{
                  height: amount > 0 ? `${Math.max((amount / maxDailyExpense) * 240, 4)}px` : '4px'
                }}
              >
                {/* Tooltip */}
                {amount > 0 && (
                  <div className="invisible group-hover:visible absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-10 pointer-events-none">
                    Day {day}<br/>₱{amount.toLocaleString()}
                  </div>
                )}
              </div>
              {/* Day label */}
              <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">
                {day}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Personal Transactions
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Date</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Type</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Amount</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-8 text-center text-gray-500 dark:text-gray-400">
                    No transactions found for this period
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((t: any) => (
                  <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-3 py-3 text-gray-900 dark:text-white">
                      {typeof t.date === 'number' 
                        ? new Date((t.date - 25569) * 86400 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                        : t.date}
                    </td>
                    <td className="px-3 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        t.type === 'income'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {t.type}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right font-medium text-gray-900 dark:text-white">
                      ₱{t.amount.toLocaleString()}
                    </td>
                    <td className="px-3 py-3 text-gray-900 dark:text-white">
                      {t.description}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
