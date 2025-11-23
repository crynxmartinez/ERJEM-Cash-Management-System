import { useState, useRef } from 'react'
import { useBranch } from '../contexts/BranchContext'
import { useAuth } from '../contexts/AuthContext'
import { Upload as UploadIcon, FileSpreadsheet, Plus, History } from 'lucide-react'
import { db } from '../lib/firebase'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import toast from 'react-hot-toast'

interface Transaction {
  date: string
  type: 'income' | 'expense'
  category: string
  amount: number
  source: string
  description: string
  isPersonal: boolean
}

export default function Upload() {
  const { currentBranch } = useBranch()
  const { currentUser } = useAuth()
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [recentUploads, setRecentUploads] = useState<any[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const bulkInputRef = useRef<HTMLInputElement>(null)
  const dailyInputRef = useRef<HTMLInputElement>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    const files = e.dataTransfer.files
    if (files && files[0]) {
      handleFileSelect(files[0])
    }
  }

  const handleFileSelect = async (file: File) => {
    if (!file) return

    const validTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
    if (!validTypes.includes(file.type) && !file.name.match(/\.(csv|xlsx|xls)$/)) {
      toast.error('Please upload a CSV or Excel file')
      return
    }

    setSelectedFile(file)
    toast.success(`File selected: ${file.name}`)
  }

  const parseFile = async (file: File): Promise<Transaction[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        try {
          const data = e.target?.result
          let transactions: Transaction[] = []

          if (file.name.endsWith('.csv')) {
            // Parse CSV
            Papa.parse(data as string, {
              header: true,
              skipEmptyLines: true,
              complete: (results) => {
                results.data.forEach((row: any) => {
                  const date = row.Date || row.date || ''
                  const personalDetails = row['Personal Details'] || ''
                  const personalExpenses = parseFloat(row['Personal Expenses'] || '0')
                  const incomeDetails = row['Income details'] || ''
                  const incomeAmount = parseFloat(row['Income Amount'] || '0')
                  const expensesDetails = row['Expenses details'] || ''
                  const expensesAmount = parseFloat(row['Expenses Amount'] || '0')

                  // Add income transaction if amount exists
                  if (incomeAmount > 0) {
                    transactions.push({
                      date,
                      type: 'income',
                      category: 'Income',
                      amount: incomeAmount,
                      source: incomeDetails,
                      description: incomeDetails,
                      isPersonal: false
                    })
                  }

                  // Add expense transaction if amount exists
                  if (expensesAmount > 0) {
                    transactions.push({
                      date,
                      type: 'expense',
                      category: 'Expense',
                      amount: expensesAmount,
                      source: expensesDetails,
                      description: expensesDetails,
                      isPersonal: false
                    })
                  }

                  // Add personal expense if amount exists
                  if (personalExpenses > 0) {
                    transactions.push({
                      date,
                      type: 'expense',
                      category: 'Personal',
                      amount: personalExpenses,
                      source: personalDetails,
                      description: personalDetails,
                      isPersonal: true
                    })
                  }
                })
                resolve(transactions)
              },
              error: (error: any) => reject(error)
            })
          } else {
            // Parse Excel
            const workbook = XLSX.read(data, { type: 'binary' })
            const sheetName = workbook.SheetNames[0]
            const worksheet = workbook.Sheets[sheetName]
            const jsonData = XLSX.utils.sheet_to_json(worksheet)

            jsonData.forEach((row: any) => {
              const date = row.Date || row.date || ''
              const personalDetails = row['Personal Details'] || ''
              const personalExpenses = parseFloat(row['Personal Expenses'] || '0')
              const incomeDetails = row['Income details'] || ''
              const incomeAmount = parseFloat(row['Income Amount'] || '0')
              const expensesDetails = row['Expenses details'] || ''
              const expensesAmount = parseFloat(row['Expenses Amount'] || '0')

              // Add income transaction if amount exists
              if (incomeAmount > 0) {
                transactions.push({
                  date,
                  type: 'income',
                  category: 'Income',
                  amount: incomeAmount,
                  source: incomeDetails,
                  description: incomeDetails,
                  isPersonal: false
                })
              }

              // Add expense transaction if amount exists
              if (expensesAmount > 0) {
                transactions.push({
                  date,
                  type: 'expense',
                  category: 'Expense',
                  amount: expensesAmount,
                  source: expensesDetails,
                  description: expensesDetails,
                  isPersonal: false
                })
              }

              // Add personal expense if amount exists
              if (personalExpenses > 0) {
                transactions.push({
                  date,
                  type: 'expense',
                  category: 'Personal',
                  amount: personalExpenses,
                  source: personalDetails,
                  description: personalDetails,
                  isPersonal: true
                })
              }
            })
            resolve(transactions)
          }
        } catch (error) {
          reject(error)
        }
      }

      reader.onerror = () => reject(new Error('Failed to read file'))

      if (file.name.endsWith('.csv')) {
        reader.readAsText(file)
      } else {
        reader.readAsBinaryString(file)
      }
    })
  }

  const uploadToFirebase = async () => {
    if (!selectedFile || !currentUser || !currentBranch) {
      toast.error('Missing required information')
      return
    }

    setUploading(true)
    const uploadToast = toast.loading('Processing file...')

    try {
      // Parse the file
      const transactions = await parseFile(selectedFile)
      
      if (transactions.length === 0) {
        toast.error('No valid transactions found in file', { id: uploadToast })
        setUploading(false)
        return
      }

      // Save transactions directly to Firestore (skip Storage upload to avoid CORS)
      const batch = transactions.map(async (transaction) => {
        await addDoc(collection(db, 'transactions'), {
          ...transaction,
          branchId: currentBranch.id,
          userId: currentUser.uid,
          uploadedAt: serverTimestamp(),
          fileName: selectedFile.name
        })
      })

      await Promise.all(batch)

      // Add to recent uploads
      const uploadRecord = {
        fileName: selectedFile.name,
        recordCount: transactions.length,
        uploadedAt: new Date().toISOString()
      }
      setRecentUploads([uploadRecord, ...recentUploads.slice(0, 4)])

      toast.success(`Successfully uploaded ${transactions.length} transactions!`, { id: uploadToast })
      setSelectedFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (error: any) {
      console.error('Upload error:', error)
      toast.error(error.message || 'Failed to upload file', { id: uploadToast })
    } finally {
      setUploading(false)
    }
  }

  const handleQuickAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!currentUser || !currentBranch) {
      toast.error('Please login and select a branch')
      return
    }

    const form = e.currentTarget
    const formData = new FormData(form)
    const transaction: Transaction = {
      date: formData.get('date') as string,
      type: formData.get('type') as 'income' | 'expense',
      category: '', // Not used anymore
      amount: parseFloat(formData.get('amount') as string),
      source: '', // Not used anymore
      description: formData.get('description') as string,
      isPersonal: formData.get('isPersonal') === 'on'
    }

    const addToast = toast.loading('Adding transaction...')

    try {
      await addDoc(collection(db, 'transactions'), {
        ...transaction,
        branchId: currentBranch.id,
        userId: currentUser.uid,
        createdAt: serverTimestamp()
      })

      toast.success('Transaction added successfully!', { id: addToast })
      form.reset()
    } catch (error: any) {
      console.error('Add transaction error:', error)
      toast.error(error.message || 'Failed to add transaction', { id: addToast })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
          Upload Data
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {currentBranch?.displayName} - Import or add transactions
        </p>
      </div>

      {/* Upload Methods */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bulk Import */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary-100 dark:bg-primary-900/20 rounded-lg">
              <FileSpreadsheet className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Bulk Import
            </h2>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Upload Excel or CSV files with historical data
          </p>
          <input
            ref={bulkInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
          />
          <button 
            onClick={() => bulkInputRef.current?.click()}
            className="w-full px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
          >
            Choose File
          </button>
        </div>

        {/* Quick Add */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <Plus className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Quick Add
            </h2>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Manually add a single transaction
          </p>
          <a 
            href="#quick-add-form"
            className="block w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-center"
          >
            Add Transaction
          </a>
        </div>

        {/* Daily Upload */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <UploadIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Daily Upload
            </h2>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Upload today's transactions
          </p>
          <input
            ref={dailyInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
          />
          <button 
            onClick={() => dailyInputRef.current?.click()}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Upload CSV
          </button>
        </div>
      </div>

      {/* File Upload Area */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Upload File
        </h2>
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
            dragActive
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10'
              : 'border-gray-300 dark:border-gray-600'
          }`}
        >
          <UploadIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Drag and drop your file here
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            or click to browse
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            id="file-upload"
            onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
          />
          <label
            htmlFor="file-upload"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg cursor-pointer transition-colors"
          >
            <UploadIcon className="w-4 h-4" />
            <span>Choose File</span>
          </label>
          
          {selectedFile && (
            <div className="mt-4 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
              <p className="text-sm text-gray-900 dark:text-white font-medium">
                Selected: {selectedFile.name}
              </p>
              <button
                onClick={uploadToFirebase}
                disabled={uploading}
                className="mt-2 w-full px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
              >
                {uploading ? 'Uploading...' : 'Upload & Process'}
              </button>
            </div>
          )}
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
            Supported formats: CSV, Excel (.xlsx, .xls)
          </p>
        </div>
      </div>

      {/* Quick Add Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Quick Add Transaction
        </h2>
        <form id="quick-add-form" onSubmit={handleQuickAdd} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Date
            </label>
            <input
              name="date"
              type="date"
              defaultValue={new Date().toISOString().split('T')[0]}
              required
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Type
            </label>
            <select name="type" required className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500">
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Amount
            </label>
            <input
              name="amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              required
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <input
              name="description"
              type="text"
              placeholder="Project name or details"
              required
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input name="isPersonal" type="checkbox" className="rounded" />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Personal Expense
              </span>
            </label>
          </div>
          <div className="md:col-span-2 lg:col-span-3 flex gap-2">
            <button
              type="submit"
              className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
            >
              Save
            </button>
            <button
              type="button"
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              Save & Add Another
            </button>
            <button
              type="button"
              className="px-6 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors"
            >
              Clear
            </button>
          </div>
        </form>
      </div>

      {/* Recent Uploads */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center gap-3 mb-4">
          <History className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Recent Uploads
          </h2>
        </div>
        <div className="space-y-3">
          {recentUploads.length === 0 ? (
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    No uploads yet
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Start by uploading your first file
                  </p>
                </div>
              </div>
            </div>
          ) : (
            recentUploads.map((upload, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {upload.fileName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {upload.recordCount} records • {new Date(upload.uploadedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
