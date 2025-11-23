import { useState, useEffect } from 'react'
import { useBranch } from '../contexts/BranchContext'
import { db } from '../lib/firebase'
import { collection, getDocs } from 'firebase/firestore'

export default function Monthly() {
  const { currentBranch } = useBranch()
  const currentDate = new Date()
  const [month1, setMonth1] = useState(currentDate.getMonth())
  const [year1, setYear1] = useState(currentDate.getFullYear())
  const [month2, setMonth2] = useState(currentDate.getMonth() - 1)
  const [year2, setYear2] = useState(currentDate.getFullYear())
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

  // Helper function to filter transactions by month and year
  const filterByMonthYear = (month: number, year: number) => {
    return transactions.filter(t => {
      if (typeof t.date === 'number') {
        // Convert Excel date to JS date
        const jsDate = new Date((t.date - 25569) * 86400 * 1000)
        return jsDate.getMonth() === month && jsDate.getFullYear() === year
      }
      return false
    })
  }

  // Month 1 calculations
  const month1Transactions = filterByMonthYear(month1, year1)
  const month1Income = month1Transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + (t.amount || 0), 0)
  const month1Expenses = month1Transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + (t.amount || 0), 0)
  const month1Profit = month1Income - month1Expenses

  // Month 2 calculations
  const month2Transactions = filterByMonthYear(month2, year2)
  const month2Income = month2Transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + (t.amount || 0), 0)
  const month2Expenses = month2Transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + (t.amount || 0), 0)
  const month2Profit = month2Income - month2Expenses

  // Percentage comparisons
  const expenseChange = month2Expenses > 0 ? (((month1Expenses - month2Expenses) / month2Expenses) * 100).toFixed(1) : '0'
  const incomeChange = month2Income > 0 ? (((month1Income - month2Income) / month2Income) * 100).toFixed(1) : '0'
  const profitChange = month2Profit !== 0 ? (((month1Profit - month2Profit) / Math.abs(month2Profit)) * 100).toFixed(1) : '0'

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const years = Array.from({ length: 10 }, (_, i) => currentDate.getFullYear() - i)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
          Monthly Comparison
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {currentBranch?.displayName} - Compare two months side by side
        </p>
      </div>

      {/* Month Selectors */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Select Months to Compare
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Month 1 */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900 dark:text-white">Month 1</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Month
                </label>
                <select
                  value={month1}
                  onChange={(e) => setMonth1(Number(e.target.value))}
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
            </div>
          </div>

          {/* Month 2 */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900 dark:text-white">Month 2</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Month
                </label>
                <select
                  value={month2}
                  onChange={(e) => setMonth2(Number(e.target.value))}
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
        </div>
      </div>

      {/* Percentage Comparison */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Comparison Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">% Expenses</p>
            <p className={`text-2xl font-bold mt-2 ${
              parseFloat(expenseChange) > 0 ? 'text-red-600' : parseFloat(expenseChange) < 0 ? 'text-green-600' : 'text-gray-600 dark:text-gray-400'
            }`}>
              {parseFloat(expenseChange) > 0 ? '+' : ''}{expenseChange}%
            </p>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">% Income</p>
            <p className={`text-2xl font-bold mt-2 ${
              parseFloat(incomeChange) > 0 ? 'text-green-600' : parseFloat(incomeChange) < 0 ? 'text-red-600' : 'text-gray-600 dark:text-gray-400'
            }`}>
              {parseFloat(incomeChange) > 0 ? '+' : ''}{incomeChange}%
            </p>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">% Profit</p>
            <p className={`text-2xl font-bold mt-2 ${
              parseFloat(profitChange) > 0 ? 'text-green-600' : parseFloat(profitChange) < 0 ? 'text-red-600' : 'text-gray-600 dark:text-gray-400'
            }`}>
              {parseFloat(profitChange) > 0 ? '+' : ''}{profitChange}%
            </p>
          </div>
        </div>
      </div>

      {/* Side-by-Side Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Month 1 Data */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {months[month1]} {year1}
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-gray-200 dark:border-gray-700">
              <span className="text-gray-700 dark:text-gray-300">Expenses</span>
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                ₱{month1Expenses.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-gray-200 dark:border-gray-700">
              <span className="text-gray-700 dark:text-gray-300">Income</span>
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                ₱{month1Income.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-gray-200 dark:border-gray-700">
              <span className="text-gray-700 dark:text-gray-300">Profit</span>
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                ₱{month1Profit.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700 dark:text-gray-300">Profit to Saving</span>
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                ₱{month1Profit.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Month 2 Data */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {months[month2]} {year2}
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-gray-200 dark:border-gray-700">
              <span className="text-gray-700 dark:text-gray-300">Expenses</span>
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                ₱{month2Expenses.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-gray-200 dark:border-gray-700">
              <span className="text-gray-700 dark:text-gray-300">Income</span>
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                ₱{month2Income.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-gray-200 dark:border-gray-700">
              <span className="text-gray-700 dark:text-gray-300">Profit</span>
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                ₱{month2Profit.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700 dark:text-gray-300">Profit to Saving</span>
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                ₱{month2Profit.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
