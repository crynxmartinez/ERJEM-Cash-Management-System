const API_BASE = '/api'

export const api = {
  // Transactions
  async getTransactions(userId: string, branchId?: string) {
    const params = new URLSearchParams({ userId })
    if (branchId) params.append('branchId', branchId)
    const res = await fetch(`${API_BASE}/transactions?${params}`)
    if (!res.ok) throw new Error('Failed to fetch transactions')
    return res.json()
  },

  async createTransaction(data: any) {
    const res = await fetch(`${API_BASE}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    if (!res.ok) throw new Error('Failed to create transaction')
    return res.json()
  },

  async deleteTransaction(id: string, userId: string) {
    const res = await fetch(`${API_BASE}/transactions?id=${id}&userId=${userId}`, {
      method: 'DELETE'
    })
    if (!res.ok) throw new Error('Failed to delete transaction')
    return res.json()
  },

  // Import CSV
  async importCSV(transactions: any[], userId: string, branchId: string) {
    const res = await fetch(`${API_BASE}/import-csv`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transactions, userId, branchId })
    })
    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || 'Failed to import CSV')
    }
    return res.json()
  },

  // Import CSV with branch IDs from CSV
  async importCSVWithBranches(transactions: any[], userId: string) {
    const res = await fetch(`${API_BASE}/import-csv-branches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transactions, userId })
    })
    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || 'Failed to import CSV')
    }
    return res.json()
  },

  // Branches
  async getBranches(userId: string) {
    const res = await fetch(`${API_BASE}/branches?userId=${userId}`)
    if (!res.ok) throw new Error('Failed to fetch branches')
    return res.json()
  },

  async createBranch(data: any) {
    const res = await fetch(`${API_BASE}/branches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    if (!res.ok) throw new Error('Failed to create branch')
    return res.json()
  },

  // Users
  async getUser(id: string) {
    const res = await fetch(`${API_BASE}/users?id=${id}`)
    if (!res.ok) throw new Error('Failed to fetch user')
    return res.json()
  },

  async createOrUpdateUser(data: any) {
    const res = await fetch(`${API_BASE}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    if (!res.ok) throw new Error('Failed to create/update user')
    return res.json()
  }
}
