const API_BASE = '/api'

export const api = {
  // Transactions
  async getTransactions(branchId?: string) {
    const url = branchId 
      ? `${API_BASE}/transactions?branchId=${branchId}`
      : `${API_BASE}/transactions`
    const res = await fetch(url)
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

  async deleteTransaction(id: string) {
    const res = await fetch(`${API_BASE}/transactions?id=${id}`, {
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
  async getBranches() {
    const res = await fetch(`${API_BASE}/branches`)
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
