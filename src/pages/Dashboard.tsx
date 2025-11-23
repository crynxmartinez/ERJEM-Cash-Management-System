import { useState } from 'react'
import { useBranch } from '../contexts/BranchContext'
import { TrendingUp, TrendingDown, DollarSign, PiggyBank } from 'lucide-react'

export default function Dashboard() {
  const { currentBranch } = useBranch()
  const currentYear = new Date().getFullYear()
  const [year1, setYear1] = useState(currentYear)
  const [year2, setYear2] = useState(currentYear - 1)

  // Placeholder data - will be replaced with real Firestore data
  const kpiData = [
    {
      title: 'Total Income',
      value: '₱500,000',
      change: 15.3,
      trend: 'up' as const,
      icon: DollarSign,
    },
    {
      title: 'Total Expenses',
      value: '₱300,000',
      change: 8.2,
      trend: 'up' as const,
      icon: TrendingUp,
    },
    {
      title: 'Net Profit',
      value: '₱200,000',
      change: 25.5,
      trend: 'up' as const,
      icon: TrendingUp,
    },
    {
      title: 'Savings',
      value: '₱100,000',
      change: 12.8,
      trend: 'up' as const,
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

      {/* Current Month vs Last Month */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Current Month vs Last Month
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              November 2024
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-700 dark:text-gray-300">Income:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  ₱50,000
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700 dark:text-gray-300">Expenses:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  ₱30,000
                </span>
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              October 2024
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-700 dark:text-gray-300">Income:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  ₱45,000
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700 dark:text-gray-300">Expenses:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  ₱28,000
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Placeholder for Charts */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Financial Trends
        </h2>
        <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
          Charts will be implemented with Recharts
        </div>
      </div>
    </div>
  )
}
