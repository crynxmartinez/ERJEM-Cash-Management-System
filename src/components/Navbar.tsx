import { Menu, Moon, Sun, Building2, ChevronDown } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import { useBranch } from '../contexts/BranchContext'
import { useState, useRef, useEffect } from 'react'

interface NavbarProps {
  onMenuClick: () => void
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  const { theme, toggleTheme } = useTheme()
  const { currentBranch, availableBranches, switchBranch } = useBranch()
  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setBranchDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 z-40">
      <div className="h-full px-4 flex items-center justify-between">
        {/* Left Side */}
        <div className="flex items-center gap-4">
          {/* Mobile Menu Button */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <Menu className="w-6 h-6 text-gray-700 dark:text-gray-300" />
          </button>

          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">E</span>
            </div>
            <h1 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
              ERJEM Cash Flow
            </h1>
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          >
            {theme === 'light' ? (
              <Moon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            ) : (
              <Sun className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            )}
          </button>

          {/* Branch Selector */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setBranchDropdownOpen(!branchDropdownOpen)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <Building2 className="w-4 h-4 text-gray-700 dark:text-gray-300" />
              <span className="hidden md:inline text-sm font-medium text-gray-900 dark:text-white">
                {currentBranch?.displayName || 'Select Branch'}
              </span>
              <span className="md:hidden text-sm font-medium text-gray-900 dark:text-white">
                {currentBranch?.name.split(' ')[1] || 'Branch'}
              </span>
              <ChevronDown className="w-4 h-4 text-gray-700 dark:text-gray-300" />
            </button>

            {/* Dropdown */}
            {branchDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2">
                <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                    Select Branch
                  </p>
                </div>
                {availableBranches.map((branch) => (
                  <button
                    key={branch.id}
                    onClick={() => {
                      switchBranch(branch.id)
                      setBranchDropdownOpen(false)
                    }}
                    className={`w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-3 ${
                      currentBranch?.id === branch.id ? 'bg-primary-50 dark:bg-primary-900/20' : ''
                    }`}
                  >
                    <Building2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {branch.displayName}
                    </span>
                    {currentBranch?.id === branch.id && (
                      <span className="ml-auto text-primary-600 dark:text-primary-400">✓</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
