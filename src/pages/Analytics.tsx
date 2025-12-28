import { useState, useEffect, useMemo, useRef } from 'react'
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
  ArrowDownRight,
  LineChart as LineChartIcon,
  Download,
  Target,
  CheckCircle,
  XCircle,
  AlertCircle,
  Camera
} from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import html2canvas from 'html2canvas'
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Bar
} from 'recharts'

type DateRange = '3months' | '6months' | '1year' | 'custom'
type TableTab = 'revenue' | 'profit' | 'cogs'

export default function Analytics() {
  const { currentBranch } = useBranch()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState<DateRange>('6months')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [tableTab, setTableTab] = useState<TableTab>('revenue')
  const [exportingPDF, setExportingPDF] = useState(false)
  const analyticsRef = useRef<HTMLDivElement>(null)

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
        // Merge Uncategorized into Expense
        const cat = t.category && t.category !== 'Uncategorized' ? t.category : 'Expense'
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

    // Expansion Readiness Metrics
    const profitableMonths = monthlyMetrics.filter(m => m.grossProfit > 0).length
    const totalMonths = monthlyMetrics.length
    const profitConsistency = totalMonths > 0 ? (profitableMonths / totalMonths) * 100 : 0
    
    const avgMonthlyExpenses = totalMonths > 0 ? expenses / totalMonths : 0
    const cashRunway = avgMonthlyExpenses > 0 ? grossProfit / avgMonthlyExpenses : 0
    
    const lowestMargin = monthlyMetrics.length > 0 
      ? Math.min(...monthlyMetrics.map(m => m.grossMargin))
      : 0
    
    const avgGrowthRates: number[] = []
    for (let i = 1; i < monthlyMetrics.length; i++) {
      const prev = monthlyMetrics[i - 1].income
      const curr = monthlyMetrics[i].income
      if (prev > 0) {
        avgGrowthRates.push(((curr - prev) / prev) * 100)
      }
    }
    const avgRevenueGrowth = avgGrowthRates.length > 0 
      ? avgGrowthRates.reduce((a, b) => a + b, 0) / avgGrowthRates.length 
      : 0

    // Calculate expansion score (0-100)
    let expansionScore = 0
    const expansionFactors = {
      profitConsistency: { score: 0, max: 25, status: 'poor' as 'good' | 'okay' | 'poor' },
      grossMargin: { score: 0, max: 25, status: 'poor' as 'good' | 'okay' | 'poor' },
      revenueGrowth: { score: 0, max: 25, status: 'poor' as 'good' | 'okay' | 'poor' },
      marginStability: { score: 0, max: 25, status: 'poor' as 'good' | 'okay' | 'poor' }
    }

    // Profit Consistency (25 pts) - 80%+ months profitable = full score
    if (profitConsistency >= 80) {
      expansionFactors.profitConsistency = { score: 25, max: 25, status: 'good' }
    } else if (profitConsistency >= 60) {
      expansionFactors.profitConsistency = { score: 15, max: 25, status: 'okay' }
    } else {
      expansionFactors.profitConsistency = { score: 5, max: 25, status: 'poor' }
    }

    // Gross Margin (25 pts) - 50%+ = full score
    if (grossMargin >= 50) {
      expansionFactors.grossMargin = { score: 25, max: 25, status: 'good' }
    } else if (grossMargin >= 30) {
      expansionFactors.grossMargin = { score: 15, max: 25, status: 'okay' }
    } else {
      expansionFactors.grossMargin = { score: 5, max: 25, status: 'poor' }
    }

    // Revenue Growth (25 pts) - 5%+ monthly = full score
    if (avgRevenueGrowth >= 5) {
      expansionFactors.revenueGrowth = { score: 25, max: 25, status: 'good' }
    } else if (avgRevenueGrowth >= 0) {
      expansionFactors.revenueGrowth = { score: 15, max: 25, status: 'okay' }
    } else {
      expansionFactors.revenueGrowth = { score: 5, max: 25, status: 'poor' }
    }

    // Margin Stability (25 pts) - lowest margin never below 30%
    if (lowestMargin >= 30) {
      expansionFactors.marginStability = { score: 25, max: 25, status: 'good' }
    } else if (lowestMargin >= 10) {
      expansionFactors.marginStability = { score: 15, max: 25, status: 'okay' }
    } else {
      expansionFactors.marginStability = { score: 5, max: 25, status: 'poor' }
    }

    expansionScore = Object.values(expansionFactors).reduce((sum, f) => sum + f.score, 0)

    // Profit First Allocations (Mike Michalowicz)
    const profitFirstTargets = {
      profit: { target: 10, actual: income > 0 ? (grossProfit / income) * 100 : 0 },
      ownerPay: { target: 40, actual: income > 0 ? (personalExpenses / income) * 100 : 0 },
      opex: { target: 40, actual: income > 0 ? (businessExpenses / income) * 100 : 0 },
      tax: { target: 15, actual: 0 } // We don't track taxes separately yet
    }

    // Best and Worst Month
    const bestMonth = monthlyMetrics.length > 0 
      ? monthlyMetrics.reduce((best, m) => m.grossProfit > best.grossProfit ? m : best, monthlyMetrics[0])
      : null
    const worstMonth = monthlyMetrics.length > 0
      ? monthlyMetrics.reduce((worst, m) => m.grossProfit < worst.grossProfit ? m : worst, monthlyMetrics[0])
      : null

    // Break-Even Point (monthly)
    const avgMonthlyRevenue = totalMonths > 0 ? income / totalMonths : 0
    const avgMonthlyCOGS = totalMonths > 0 ? expenses / totalMonths : 0
    const contributionMarginRatio = avgMonthlyRevenue > 0 ? (avgMonthlyRevenue - avgMonthlyCOGS) / avgMonthlyRevenue : 0
    const breakEvenRevenue = contributionMarginRatio > 0 ? avgMonthlyCOGS / contributionMarginRatio : 0

    // Expense Category Trends (compare first half vs second half of period)
    const midPoint = Math.floor(monthlyMetrics.length / 2)
    const firstHalfExpenses: Record<string, number> = {}
    const secondHalfExpenses: Record<string, number> = {}
    
    filteredTransactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const txDate = new Date(t.date)
        const txMonth = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, '0')}`
        const monthIndex = monthlyMetrics.findIndex(m => m.month === txMonth)
        // Merge Uncategorized into Expense
        const cat = t.category && t.category !== 'Uncategorized' ? t.category : 'Expense'
        
        if (monthIndex < midPoint) {
          firstHalfExpenses[cat] = (firstHalfExpenses[cat] || 0) + t.amount
        } else {
          secondHalfExpenses[cat] = (secondHalfExpenses[cat] || 0) + t.amount
        }
      })

    const categoryTrends = topCategories.map(([cat, total]) => {
      const firstHalf = firstHalfExpenses[cat] || 0
      const secondHalf = secondHalfExpenses[cat] || 0
      const change = firstHalf > 0 ? ((secondHalf - firstHalf) / firstHalf) * 100 : 0
      return { category: cat, total, firstHalf, secondHalf, change }
    })

    // Average Transaction Size
    const incomeTransactions = filteredTransactions.filter(t => t.type === 'income')
    const avgTransactionSize = incomeTransactions.length > 0 
      ? income / incomeTransactions.length 
      : 0

    // Cash Runway (months of expenses covered by current profit)
    const monthsOfRunway = avgMonthlyExpenses > 0 ? grossProfit / avgMonthlyExpenses : 0

    let expansionGrade: 'A' | 'B' | 'C' | 'D' | 'F' = 'F'
    let expansionStatus: 'Ready' | 'Almost Ready' | 'Not Yet' = 'Not Yet'
    if (expansionScore >= 85) {
      expansionGrade = 'A'
      expansionStatus = 'Ready'
    } else if (expansionScore >= 70) {
      expansionGrade = 'B'
      expansionStatus = 'Almost Ready'
    } else if (expansionScore >= 55) {
      expansionGrade = 'C'
      expansionStatus = 'Almost Ready'
    } else if (expansionScore >= 40) {
      expansionGrade = 'D'
      expansionStatus = 'Not Yet'
    }

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
      transactionCount: filteredTransactions.length,
      // Expansion metrics
      profitConsistency,
      cashRunway,
      lowestMargin,
      avgRevenueGrowth,
      expansionScore,
      expansionGrade,
      expansionStatus,
      expansionFactors,
      profitableMonths,
      totalMonths,
      // New Tier 2 metrics
      profitFirstTargets,
      bestMonth,
      worstMonth,
      breakEvenRevenue,
      categoryTrends,
      avgTransactionSize,
      monthsOfRunway
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

  const generatePDF = async () => {
    if (!analyticsRef.current) return
    
    setExportingPDF(true)
    
    try {
      // Capture the full analytics page as an image
      const canvas = await html2canvas(analyticsRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#111827', // dark background
        windowWidth: analyticsRef.current.scrollWidth,
        windowHeight: analyticsRef.current.scrollHeight,
        width: analyticsRef.current.scrollWidth,
        height: analyticsRef.current.scrollHeight,
        scrollX: 0,
        scrollY: 0
      })
      
      const imgData = canvas.toDataURL('image/png')
      const imgWidth = canvas.width
      const imgHeight = canvas.height
      
      // Calculate PDF dimensions (A4 width, variable height)
      const pdfWidth = 210 // A4 width in mm
      const pdfHeight = (imgHeight * pdfWidth) / imgWidth
      
      // Create PDF with multiple pages if needed
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })
      
      const pageHeight = 297 // A4 height in mm
      const headerHeight = 15
      const contentHeight = pageHeight - headerHeight
      
      // Add header on first page
      doc.setFontSize(16)
      doc.setTextColor(59, 130, 246)
      doc.text(`${currentBranch?.displayName || 'Branch'} - Analytics Report`, pdfWidth / 2, 10, { align: 'center' })
      
      // Calculate how many pages we need
      let position = 0
      let pageNum = 0
      
      while (position < pdfHeight) {
        if (pageNum > 0) {
          doc.addPage()
        }
        
        const yOffset = pageNum === 0 ? headerHeight : 0
        const availableHeight = pageNum === 0 ? contentHeight : pageHeight
        
        // Add portion of the image
        doc.addImage(
          imgData, 
          'PNG', 
          0, 
          yOffset - position, 
          pdfWidth, 
          pdfHeight
        )
        
        position += availableHeight
        pageNum++
        
        // Safety limit
        if (pageNum > 20) break
      }
      
      // Save
      doc.save(`analytics-report-${currentBranch?.name || 'branch'}-${new Date().toISOString().split('T')[0]}.pdf`)
    } catch (error) {
      console.error('Error generating PDF:', error)
      // Fallback to table-based PDF
      generateTablePDF()
    } finally {
      setExportingPDF(false)
    }
  }

  const generateTablePDF = () => {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    
    // Header
    doc.setFontSize(20)
    doc.setTextColor(59, 130, 246)
    doc.text('Analytics Report', pageWidth / 2, 20, { align: 'center' })
    
    doc.setFontSize(12)
    doc.setTextColor(100)
    doc.text(`${currentBranch?.displayName || 'Branch'}`, pageWidth / 2, 28, { align: 'center' })
    doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, pageWidth / 2, 35, { align: 'center' })
    
    // Summary Section
    doc.setFontSize(14)
    doc.setTextColor(0)
    doc.text('Summary', 14, 50)
    
    const summaryData = [
      ['Total Revenue', formatCurrency(metrics.income)],
      ['Total Expenses (COGS)', formatCurrency(metrics.expenses)],
      ['Gross Profit', formatCurrency(metrics.grossProfit)],
      ['Gross Margin', `${metrics.grossMargin.toFixed(1)}%`],
      ['Expansion Score', `${metrics.expansionScore}/100 (${metrics.expansionGrade})`]
    ]
    
    autoTable(doc, {
      startY: 55,
      head: [['Metric', 'Value']],
      body: summaryData,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] }
    })
    
    // Monthly Performance
    const finalY1 = (doc as any).lastAutoTable.finalY || 100
    doc.text('Monthly Performance', 14, finalY1 + 15)
    
    const monthlyData = metrics.monthlyMetrics.map(m => [
      new Date(m.month + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
      formatCurrency(m.income),
      formatCurrency(m.expenses),
      formatCurrency(m.grossProfit),
      `${m.grossMargin.toFixed(1)}%`
    ])
    
    autoTable(doc, {
      startY: finalY1 + 20,
      head: [['Month', 'Revenue', 'COGS', 'Gross Profit', 'Margin %']],
      body: monthlyData,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] }
    })
    
    // Expansion Readiness
    const finalY2 = (doc as any).lastAutoTable.finalY || 150
    if (finalY2 > 240) {
      doc.addPage()
      doc.text('Expansion Readiness', 14, 20)
    } else {
      doc.text('Expansion Readiness', 14, finalY2 + 15)
    }
    
    const expansionData = [
      ['Profit Consistency', `${metrics.profitConsistency.toFixed(0)}%`, metrics.expansionFactors.profitConsistency.status],
      ['Gross Margin', `${metrics.grossMargin.toFixed(1)}%`, metrics.expansionFactors.grossMargin.status],
      ['Revenue Growth', `${metrics.avgRevenueGrowth.toFixed(1)}%/mo`, metrics.expansionFactors.revenueGrowth.status],
      ['Margin Stability', `${metrics.lowestMargin.toFixed(1)}% lowest`, metrics.expansionFactors.marginStability.status]
    ]
    
    autoTable(doc, {
      startY: finalY2 > 240 ? 25 : finalY2 + 20,
      head: [['Factor', 'Value', 'Status']],
      body: expansionData,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] }
    })
    
    // Save
    doc.save(`analytics-report-${currentBranch?.name || 'branch'}-${new Date().toISOString().split('T')[0]}.pdf`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6" ref={analyticsRef}>
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

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={generatePDF}
            disabled={exportingPDF}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exportingPDF ? (
              <>
                <Camera className="w-4 h-4 animate-pulse" />
                Capturing...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Download PDF
              </>
            )}
          </button>
        </div>
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

      {/* Expansion Readiness Score */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Expansion Readiness</h2>
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-lg ${
            metrics.expansionStatus === 'Ready' 
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : metrics.expansionStatus === 'Almost Ready'
                ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
          }`}>
            {metrics.expansionStatus === 'Ready' && <CheckCircle className="w-5 h-5" />}
            {metrics.expansionStatus === 'Almost Ready' && <AlertCircle className="w-5 h-5" />}
            {metrics.expansionStatus === 'Not Yet' && <XCircle className="w-5 h-5" />}
            {metrics.expansionStatus}
          </div>
        </div>

        {/* Score Display */}
        <div className="flex items-center gap-6 mb-6">
          <div className="text-center">
            <div className={`text-5xl font-bold ${
              metrics.expansionScore >= 70 ? 'text-green-600' : metrics.expansionScore >= 40 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {metrics.expansionGrade}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Grade</p>
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Overall Score</span>
              <span className="text-sm font-bold text-gray-900 dark:text-white">{metrics.expansionScore}/100</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
              <div 
                className={`h-4 rounded-full transition-all ${
                  metrics.expansionScore >= 70 ? 'bg-green-500' : metrics.expansionScore >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${metrics.expansionScore}%` }}
              />
            </div>
          </div>
        </div>

        {/* Factor Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Profit Consistency */}
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Profit Consistency</span>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                metrics.expansionFactors.profitConsistency.status === 'good' 
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : metrics.expansionFactors.profitConsistency.status === 'okay'
                    ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              }`}>
                {metrics.expansionFactors.profitConsistency.status}
              </span>
            </div>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{metrics.profitConsistency.toFixed(0)}%</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{metrics.profitableMonths}/{metrics.totalMonths} months profitable (target: 80%+)</p>
          </div>

          {/* Gross Margin */}
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Average Gross Margin</span>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                metrics.expansionFactors.grossMargin.status === 'good' 
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : metrics.expansionFactors.grossMargin.status === 'okay'
                    ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              }`}>
                {metrics.expansionFactors.grossMargin.status}
              </span>
            </div>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{metrics.grossMargin.toFixed(1)}%</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Target: 50%+</p>
          </div>

          {/* Revenue Growth */}
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Avg Revenue Growth</span>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                metrics.expansionFactors.revenueGrowth.status === 'good' 
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : metrics.expansionFactors.revenueGrowth.status === 'okay'
                    ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              }`}>
                {metrics.expansionFactors.revenueGrowth.status}
              </span>
            </div>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{metrics.avgRevenueGrowth.toFixed(1)}%/mo</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Target: 5%+ monthly growth</p>
          </div>

          {/* Margin Stability */}
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Margin Stability</span>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                metrics.expansionFactors.marginStability.status === 'good' 
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : metrics.expansionFactors.marginStability.status === 'okay'
                    ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              }`}>
                {metrics.expansionFactors.marginStability.status}
              </span>
            </div>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{metrics.lowestMargin.toFixed(1)}%</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Lowest margin (target: never below 30%)</p>
          </div>
        </div>

        {/* Recommendation */}
        <div className={`mt-6 p-4 rounded-lg ${
          metrics.expansionStatus === 'Ready' 
            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
            : metrics.expansionStatus === 'Almost Ready'
              ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
        }`}>
          <p className={`text-sm font-medium ${
            metrics.expansionStatus === 'Ready' 
              ? 'text-green-800 dark:text-green-300'
              : metrics.expansionStatus === 'Almost Ready'
                ? 'text-yellow-800 dark:text-yellow-300'
                : 'text-red-800 dark:text-red-300'
          }`}>
            {metrics.expansionStatus === 'Ready' && '✅ Your business shows strong fundamentals. You may be ready to consider expansion!'}
            {metrics.expansionStatus === 'Almost Ready' && '⚠️ You\'re getting close! Focus on improving the factors marked as "okay" or "poor" before expanding.'}
            {metrics.expansionStatus === 'Not Yet' && '❌ Focus on stabilizing your current operations first. Work on profitability and margin consistency.'}
          </p>
        </div>
      </div>

      {/* Tier 2 Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Cash Runway */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className={`p-2 rounded-lg ${
              metrics.monthsOfRunway >= 6 
                ? 'bg-green-100 dark:bg-green-900/30' 
                : metrics.monthsOfRunway >= 3
                  ? 'bg-yellow-100 dark:bg-yellow-900/30'
                  : 'bg-red-100 dark:bg-red-900/30'
            }`}>
              <Calendar className={`w-5 h-5 ${
                metrics.monthsOfRunway >= 6 
                  ? 'text-green-600 dark:text-green-400' 
                  : metrics.monthsOfRunway >= 3
                    ? 'text-yellow-600 dark:text-yellow-400'
                    : 'text-red-600 dark:text-red-400'
              }`} />
            </div>
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
              metrics.monthsOfRunway >= 6 
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                : metrics.monthsOfRunway >= 3
                  ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            }`}>
              {metrics.monthsOfRunway >= 6 ? 'Safe' : metrics.monthsOfRunway >= 3 ? 'Caution' : 'Critical'}
            </span>
          </div>
          <p className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
            {metrics.monthsOfRunway.toFixed(1)} mo
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Cash Runway (Target: 6+ mo)</p>
        </div>

        {/* Average Transaction Size */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <p className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(metrics.avgTransactionSize)}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Avg Transaction Size</p>
        </div>

        {/* Break-Even Revenue */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Target className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <p className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(metrics.breakEvenRevenue)}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Break-Even Revenue/mo</p>
        </div>

        {/* Personal Draw % */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <Percent className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
              metrics.profitFirstTargets.ownerPay.actual <= 50 
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
            }`}>
              {metrics.profitFirstTargets.ownerPay.actual <= 50 ? 'Healthy' : 'High'}
            </span>
          </div>
          <p className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
            {metrics.profitFirstTargets.ownerPay.actual.toFixed(1)}%
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Personal Draw (Target: ≤40%)</p>
        </div>
      </div>

      {/* Best & Worst Month + Profit First */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Best & Worst Month */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Best & Worst Month</h2>
          <div className="grid grid-cols-2 gap-4">
            {/* Best Month */}
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-700 dark:text-green-400">Best Month</span>
              </div>
              {metrics.bestMonth ? (
                <>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {new Date(metrics.bestMonth.month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    {formatCurrency(metrics.bestMonth.grossProfit)} profit
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {metrics.bestMonth.grossMargin.toFixed(1)}% margin
                  </p>
                </>
              ) : (
                <p className="text-sm text-gray-500">No data</p>
              )}
            </div>

            {/* Worst Month */}
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="w-4 h-4 text-red-600" />
                <span className="text-sm font-medium text-red-700 dark:text-red-400">Worst Month</span>
              </div>
              {metrics.worstMonth ? (
                <>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {new Date(metrics.worstMonth.month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </p>
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {formatCurrency(metrics.worstMonth.grossProfit)} profit
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {metrics.worstMonth.grossMargin.toFixed(1)}% margin
                  </p>
                </>
              ) : (
                <p className="text-sm text-gray-500">No data</p>
              )}
            </div>
          </div>
        </div>

        {/* Profit First Allocation */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Profit First Allocation</h2>
            <span className="text-xs text-gray-500 dark:text-gray-400">Mike Michalowicz Method</span>
          </div>
          <div className="space-y-4">
            {/* Profit */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-400">Profit</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {metrics.profitFirstTargets.profit.actual.toFixed(1)}% 
                  <span className="text-gray-500"> / {metrics.profitFirstTargets.profit.target}% target</span>
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    metrics.profitFirstTargets.profit.actual >= metrics.profitFirstTargets.profit.target 
                      ? 'bg-green-500' : 'bg-yellow-500'
                  }`}
                  style={{ width: `${Math.min(metrics.profitFirstTargets.profit.actual * 2, 100)}%` }}
                />
              </div>
            </div>

            {/* Owner Pay */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-400">Owner Pay</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {metrics.profitFirstTargets.ownerPay.actual.toFixed(1)}% 
                  <span className="text-gray-500"> / {metrics.profitFirstTargets.ownerPay.target}% target</span>
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    metrics.profitFirstTargets.ownerPay.actual <= metrics.profitFirstTargets.ownerPay.target 
                      ? 'bg-green-500' : 'bg-yellow-500'
                  }`}
                  style={{ width: `${Math.min(metrics.profitFirstTargets.ownerPay.actual, 100)}%` }}
                />
              </div>
            </div>

            {/* Operating Expenses */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-400">Operating Expenses</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {metrics.profitFirstTargets.opex.actual.toFixed(1)}% 
                  <span className="text-gray-500"> / {metrics.profitFirstTargets.opex.target}% target</span>
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    metrics.profitFirstTargets.opex.actual <= metrics.profitFirstTargets.opex.target 
                      ? 'bg-green-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(metrics.profitFirstTargets.opex.actual, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Expense Category Trends */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Expense Category Trends</h2>
          <span className="text-xs text-gray-500 dark:text-gray-400">First half vs Second half comparison</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                <th className="pb-3 font-medium">Category</th>
                <th className="pb-3 font-medium text-right">Total</th>
                <th className="pb-3 font-medium text-right">First Half</th>
                <th className="pb-3 font-medium text-right">Second Half</th>
                <th className="pb-3 font-medium text-right">Trend</th>
              </tr>
            </thead>
            <tbody>
              {metrics.categoryTrends.map((trend, index) => (
                <tr key={index} className="border-b border-gray-100 dark:border-gray-700/50">
                  <td className="py-3 font-medium text-gray-900 dark:text-white">{trend.category}</td>
                  <td className="py-3 text-right text-gray-600 dark:text-gray-400">{formatCurrency(trend.total)}</td>
                  <td className="py-3 text-right text-gray-600 dark:text-gray-400">{formatCurrency(trend.firstHalf)}</td>
                  <td className="py-3 text-right text-gray-600 dark:text-gray-400">{formatCurrency(trend.secondHalf)}</td>
                  <td className="py-3 text-right">
                    <span className={`inline-flex items-center gap-1 text-sm font-medium ${
                      trend.change > 10 
                        ? 'text-red-600 dark:text-red-400' 
                        : trend.change < -10
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-gray-600 dark:text-gray-400'
                    }`}>
                      {trend.change > 0 ? (
                        <ArrowUpRight className="w-4 h-4" />
                      ) : trend.change < 0 ? (
                        <ArrowDownRight className="w-4 h-4" />
                      ) : null}
                      {trend.change > 0 ? '+' : ''}{trend.change.toFixed(0)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
          🔴 Red = Expense growing (bad) | 🟢 Green = Expense shrinking (good)
        </p>
      </div>

      {/* Revenue & COGS Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <div className="flex items-center gap-2 mb-6">
          <LineChartIcon className="w-5 h-5 text-primary-600" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Revenue vs COGS</h2>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={metrics.monthlyMetrics.map(m => ({
              ...m,
              monthLabel: new Date(m.month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
            }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis 
                dataKey="monthLabel" 
                stroke="#9CA3AF" 
                fontSize={12}
                tickLine={false}
              />
              <YAxis 
                stroke="#9CA3AF" 
                fontSize={11}
                tickLine={false}
                width={70}
                tickFormatter={(value) => {
                  if (value >= 1000000) return `₱${(value / 1000000).toFixed(1)}M`
                  if (value >= 1000) return `₱${(value / 1000).toFixed(0)}K`
                  return `₱${value.toFixed(0)}`
                }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: 'none', 
                  borderRadius: '8px',
                  color: '#F9FAFB'
                }}
                formatter={(value: number) => [formatCurrency(value), '']}
                labelStyle={{ color: '#9CA3AF' }}
              />
              <Legend />
              <Bar 
                dataKey="income" 
                name="Revenue"
                fill="#10B981"
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                dataKey="expenses" 
                name="COGS"
                fill="#EF4444"
                radius={[4, 4, 0, 0]}
              />
              <Line 
                type="monotone" 
                dataKey="grossProfit" 
                name="Gross Profit"
                stroke="#3B82F6" 
                strokeWidth={3}
                dot={{ fill: '#3B82F6', strokeWidth: 2 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gross Margin % Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <div className="flex items-center gap-2 mb-6">
          <Percent className="w-5 h-5 text-yellow-500" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Gross Margin % Trend</h2>
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={metrics.monthlyMetrics.map(m => ({
              ...m,
              monthLabel: new Date(m.month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
            }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis 
                dataKey="monthLabel" 
                stroke="#9CA3AF" 
                fontSize={12}
                tickLine={false}
              />
              <YAxis 
                stroke="#F59E0B" 
                fontSize={11}
                tickLine={false}
                width={50}
                tickFormatter={(value) => `${Math.round(value)}%`}
                domain={[0, 100]}
                ticks={[0, 25, 50, 75, 100]}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: 'none', 
                  borderRadius: '8px',
                  color: '#F9FAFB'
                }}
                formatter={(value: number) => [`${value.toFixed(1)}%`, 'Gross Margin']}
                labelStyle={{ color: '#9CA3AF' }}
              />
              <Line 
                type="monotone" 
                dataKey="grossMargin" 
                name="Gross Margin %"
                stroke="#F59E0B" 
                strokeWidth={3}
                dot={{ fill: '#F59E0B', strokeWidth: 2, r: 5 }}
                activeDot={{ r: 7 }}
              />
              {/* Target line at 80% */}
              <Line 
                type="monotone" 
                dataKey={() => 80} 
                name="Target (80%)"
                stroke="#10B981" 
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Green dashed line = 80% target (healthy margin)
        </p>
      </div>

      {/* Tabbed Monthly Tables */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary-600" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Monthly Breakdown</h2>
            </div>
            <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600">
              <button
                onClick={() => setTableTab('revenue')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  tableTab === 'revenue'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                Revenue
              </button>
              <button
                onClick={() => setTableTab('profit')}
                className={`px-4 py-2 text-sm font-medium transition-colors border-l border-gray-200 dark:border-gray-600 ${
                  tableTab === 'profit'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                Gross Profit & Margin
              </button>
              <button
                onClick={() => setTableTab('cogs')}
                className={`px-4 py-2 text-sm font-medium transition-colors border-l border-gray-200 dark:border-gray-600 ${
                  tableTab === 'cogs'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                COGS (Expenses)
              </button>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          {tableTab === 'revenue' && (
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Month</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Revenue</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">vs Prev Month</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cumulative</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {metrics.monthlyMetrics.map((m, idx) => {
                  const prevRevenue = idx > 0 ? metrics.monthlyMetrics[idx - 1].income : 0
                  const change = prevRevenue > 0 ? ((m.income - prevRevenue) / prevRevenue) * 100 : 0
                  const cumulative = metrics.monthlyMetrics.slice(0, idx + 1).reduce((sum, x) => sum + x.income, 0)
                  return (
                    <tr key={m.month} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {new Date(m.month + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600 dark:text-green-400 font-medium">
                        {formatCurrency(m.income)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        {idx > 0 ? (
                          <span className={`flex items-center justify-end gap-1 ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {change >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                            {Math.abs(change).toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600 dark:text-gray-400">
                        {formatCurrency(cumulative)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white">Total</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(metrics.income)}
                  </td>
                  <td className="px-6 py-4"></td>
                  <td className="px-6 py-4"></td>
                </tr>
              </tfoot>
            </table>
          )}

          {tableTab === 'profit' && (
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Month</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Gross Profit</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Gross Margin %</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {metrics.monthlyMetrics.map((m) => (
                  <tr key={m.month} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {new Date(m.month + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${
                      m.grossProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {formatCurrency(m.grossProfit)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900 dark:text-white">
                      {m.grossMargin.toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        m.grossMargin >= 80 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                          : m.grossMargin >= 50 
                            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {m.grossMargin >= 80 ? 'Healthy' : m.grossMargin >= 50 ? 'Okay' : 'Low'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white">Average</td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-bold ${
                    metrics.grossProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {formatCurrency(metrics.grossProfit)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-gray-900 dark:text-white">
                    {metrics.grossMargin.toFixed(1)}%
                  </td>
                  <td className="px-6 py-4"></td>
                </tr>
              </tfoot>
            </table>
          )}

          {tableTab === 'cogs' && (
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Month</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">COGS (Expenses)</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">vs Prev Month</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">% of Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {metrics.monthlyMetrics.map((m, idx) => {
                  const prevExpenses = idx > 0 ? metrics.monthlyMetrics[idx - 1].expenses : 0
                  const change = prevExpenses > 0 ? ((m.expenses - prevExpenses) / prevExpenses) * 100 : 0
                  const percentOfRevenue = m.income > 0 ? (m.expenses / m.income) * 100 : 0
                  return (
                    <tr key={m.month} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {new Date(m.month + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600 dark:text-red-400 font-medium">
                        {formatCurrency(m.expenses)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        {idx > 0 ? (
                          <span className={`flex items-center justify-end gap-1 ${change <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {change <= 0 ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                            {Math.abs(change).toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          percentOfRevenue <= 20 
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                            : percentOfRevenue <= 50 
                              ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {percentOfRevenue.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white">Total</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-red-600 dark:text-red-400">
                    {formatCurrency(metrics.expenses)}
                  </td>
                  <td className="px-6 py-4"></td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-gray-900 dark:text-white">
                    {metrics.income > 0 ? ((metrics.expenses / metrics.income) * 100).toFixed(1) : 0}%
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
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
