import { useState, useEffect, useMemo } from 'react'
import { useBranch } from '../contexts/BranchContext'
import { api } from '../lib/api'
import { Transaction } from '../types'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Percent,
  Calendar,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'

type DateRange = '3months' | '6months' | '1year' | 'custom'

export default function Analytics() {
    const { currentBranch } = useBranch()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState<DateRange>('6months')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')

  useEffect(() => {
    async function fetchTransactions() {
      if (!currentBranch) return
      
      try {
        const data = await api.getTransactions(currentBranch.id)
        setTransactions(data)
      } catch (error) {
        console.error('Error fetching transactions:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTransactions()
  }, [currentBranch])

  const filteredTransactions = useMemo(() => {
    const now = new Date()
    let startDate: Date

    if (dateRange === 'custom' && customStartDate && customEndDate) {
      startDate = new Date(customStartDate)
      const endDate = new Date(customEndDate)
      return transactions.filter(t => {
        const date = new Date(t.date)
        return date >= startDate && date <= endDate
      })
    }

    switch (dateRange) {
      case '3months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1)
        break
      case '6months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1)
        break
      case '1year':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1)
        break
      default:
        startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1)
    }

    return transactions.filter(t => new Date(t.date) >= startDate)
  }, [transactions, dateRange, customStartDate, customEndDate])

  const metrics = useMemo(() => {
    const income = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)
    
    const expenses = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)
    
    const grossProfit = income - expenses
    const grossMargin = income > 0 ? (grossProfit / income) * 100 : 0
    const netMargin = income > 0 ? (grossProfit / income) * 100 : 0
    
    // Monthly breakdown
    const monthlyData: Record<string, { income: number; expenses: number }> = {}
    filteredTransactions.forEach(t => {
      const date = new Date(t.date)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      if (!monthlyData[key]) {
        monthlyData[key] = { income: 0, expenses: 0 }
      }
      if (t.type === 'income') {
        monthlyData[key].income += t.amount
      } else {
        monthlyData[key].expenses += t.amount
      }
    })

    const sortedMonths = Object.keys(monthlyData).sort()
    const monthlyMetrics = sortedMonths.map(month => ({
      month,
      ...monthlyData[month],
      grossProfit: monthlyData[month].income - monthlyData[month].expenses,
      grossMargin: monthlyData[month].income > 0 
        ? ((monthlyData[month].income - monthlyData[month].expenses) / monthlyData[month].income) * 100 
        : 0
    }))

    // Calculate growth
    let revenueGrowth = 0
    if (monthlyMetrics.length >= 2) {
      const current = monthlyMetrics[monthlyMetrics.length - 1].income
      const previous = monthlyMetrics[monthlyMetrics.length - 2].income
      revenueGrowth = previous > 0 ? ((current - previous) / previous) * 100 : 0
    }

    // Cash burn (net change)
    const cashBurn = grossProfit

    // Category breakdown
    const categoryBreakdown: Record<string, number> = {}
    filteredTransactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const cat = t.category || 'Uncategorized'
        categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + t.amount
      })

    const topCategories = Object.entries(categoryBreakdown)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)

    // Personal vs Business
    const personalExpenses = filteredTransactions
      .filter(t => t.type === 'expense' && t.isPersonal)
      .reduce((sum, t) => sum + t.amount, 0)
    
    const businessExpenses = expenses - personalExpenses

    return {
      income,
      expenses,
      grossProfit,
      grossMargin,
      netMargin,
      revenueGrowth,
      cashBurn,
      monthlyMetrics,
      topCategories,
      personalExpenses,
      businessExpenses,
      transactionCount: filteredTransactions.length
    }
  }, [filteredTransactions])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            Analytics
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {currentBranch?.displayName} - Business Performance Metrics
          </p>
        </div>

        {/* Date Range Filter */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setDateRange('3months')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              dateRange === '3months'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            3 Months
          </button>
          <button
            onClick={() => setDateRange('6months')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              dateRange === '6months'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            6 Months
          </button>
          <button
            onClick={() => setDateRange('1year')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              dateRange === '1year'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            1 Year
          </button>
          <button
            onClick={() => setDateRange('custom')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              dateRange === 'custom'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Custom
          </button>
        </div>
      </div>

      {/* Custom Date Range */}
      {dateRange === 'custom' && (
        <div className="flex flex-wrap items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            />
          </div>
          <span className="text-gray-500">to</span>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            />
          </div>
        </div>
      )}

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            {metrics.revenueGrowth !== 0 && (
              <span className={`flex items-center text-sm font-medium ${
                metrics.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {metrics.revenueGrowth >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                {formatPercent(metrics.revenueGrowth)}
              </span>
            )}
          </div>
          <p className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(metrics.income)}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Revenue</p>
        </div>

        {/* Total Expenses */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <p className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(metrics.expenses)}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Expenses (COGS)</p>
        </div>

        {/* Gross Profit */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className={`p-2 rounded-lg ${
              metrics.grossProfit >= 0 
                ? 'bg-green-100 dark:bg-green-900/30' 
                : 'bg-red-100 dark:bg-red-900/30'
            }`}>
              <TrendingUp className={`w-5 h-5 ${
                metrics.grossProfit >= 0 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`} />
            </div>
          </div>
          <p className={`mt-4 text-2xl font-bold ${
            metrics.grossProfit >= 0 
              ? 'text-green-600 dark:text-green-400' 
              : 'text-red-600 dark:text-red-400'
          }`}>
            {formatCurrency(metrics.grossProfit)}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Gross Profit</p>
        </div>

        {/* Gross Margin */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className={`p-2 rounded-lg ${
              metrics.grossMargin >= 80 
                ? 'bg-green-100 dark:bg-green-900/30' 
                : metrics.grossMargin >= 50 
                  ? 'bg-yellow-100 dark:bg-yellow-900/30'
                  : 'bg-red-100 dark:bg-red-900/30'
            }`}>
              <Percent className={`w-5 h-5 ${
                metrics.grossMargin >= 80 
                  ? 'text-green-600 dark:text-green-400' 
                  : metrics.grossMargin >= 50 
                    ? 'text-yellow-600 dark:text-yellow-400'
                    : 'text-red-600 dark:text-red-400'
              }`} />
            </div>
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
              metrics.grossMargin >= 80 
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                : metrics.grossMargin >= 50 
                  ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            }`}>
              {metrics.grossMargin >= 80 ? 'Healthy' : metrics.grossMargin >= 50 ? 'Okay' : 'Low'}
            </span>
          </div>
          <p className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
            {metrics.grossMargin.toFixed(1)}%
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Gross Margin (Target: 80%+)</p>
        </div>
      </div>

      {/* Monthly Performance Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Monthly Performance</h2>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Month</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Revenue</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Expenses</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Gross Profit</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Gross Margin %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {metrics.monthlyMetrics.map((m) => (
                <tr key={m.month} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {new Date(m.month + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600 dark:text-green-400">
                    {formatCurrency(m.income)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600 dark:text-red-400">
                    {formatCurrency(m.expenses)}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${
                    m.grossProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {formatCurrency(m.grossProfit)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      m.grossMargin >= 80 
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                        : m.grossMargin >= 50 
                          ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {m.grossMargin.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Expense Categories */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Top Expense Categories</h2>
          </div>
          <div className="space-y-3">
            {metrics.topCategories.length > 0 ? (
              metrics.topCategories.map(([category, amount]) => {
                const percentage = (amount / metrics.expenses) * 100
                return (
                  <div key={category}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{category}</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {formatCurrency(amount)} ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-primary-600 h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-sm">No expense data available</p>
            )}
          </div>
        </div>

        {/* Personal vs Business */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Personal vs Business Expenses</h2>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Business</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {formatCurrency(metrics.businessExpenses)}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div 
                  className="bg-blue-600 h-3 rounded-full transition-all"
                  style={{ width: `${metrics.expenses > 0 ? (metrics.businessExpenses / metrics.expenses) * 100 : 0}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Personal</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {formatCurrency(metrics.personalExpenses)}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div 
                  className="bg-purple-600 h-3 rounded-full transition-all"
                  style={{ width: `${metrics.expenses > 0 ? (metrics.personalExpenses / metrics.expenses) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Total Transactions: <span className="font-medium text-gray-900 dark:text-white">{metrics.transactionCount}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
