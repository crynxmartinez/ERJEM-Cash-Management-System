import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num)
}

export function formatPercentage(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
}

export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}

export function getMonthName(monthIndex: number): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  return months[monthIndex]
}

export function getYearOptions(startYear: number = 2020): number[] {
  const currentYear = new Date().getFullYear()
  const years: number[] = []
  for (let year = currentYear; year >= startYear; year--) {
    years.push(year)
  }
  return years
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * Convert Excel serial date to JavaScript Date in local timezone.
 * Excel serial dates are days since 1900-01-01 (with a bug where 1900 is treated as leap year).
 * This function ensures the date is interpreted as local time, not UTC.
 */
export function excelDateToLocal(excelDate: number): Date {
  // Excel epoch is 1900-01-01, but Excel incorrectly treats 1900 as a leap year
  // So we need to subtract 25569 to get Unix timestamp in days, then convert to ms
  const utcDate = new Date((excelDate - 25569) * 86400 * 1000)
  // Adjust for timezone offset to get the correct local date
  return new Date(utcDate.getTime() + utcDate.getTimezoneOffset() * 60 * 1000)
}
