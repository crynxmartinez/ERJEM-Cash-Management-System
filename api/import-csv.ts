import type { VercelRequest, VercelResponse } from '@vercel/node'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { transactions, userId, branchId } = req.body

    if (!transactions || !Array.isArray(transactions)) {
      return res.status(400).json({ error: 'Transactions array required' })
    }

    if (!userId || !branchId) {
      return res.status(400).json({ error: 'userId and branchId required' })
    }

    // Ensure user exists
    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        email: `${userId}@temp.com`,
        password: 'imported',
        displayName: 'Imported User'
      }
    })

    // Ensure branch exists
    await prisma.branch.upsert({
      where: { id: branchId },
      update: {},
      create: {
        id: branchId,
        name: branchId,
        displayName: branchId,
        createdBy: userId
      }
    })

    // Helper to parse date as Philippine time (UTC+8)
    const parseDateAsPH = (dateInput: any): Date => {
      if (!dateInput) return new Date()
      
      // If it's an Excel serial number
      if (typeof dateInput === 'number') {
        const utcDate = new Date((dateInput - 25569) * 86400 * 1000)
        return utcDate
      }
      
      // If it's a string date like "2024-12-28" or "12/28/2024"
      const dateStr = String(dateInput)
      
      // Append Philippine timezone if no timezone specified
      if (!dateStr.includes('T') && !dateStr.includes('+')) {
        // Parse as local date and treat as PH time
        const parsed = new Date(dateStr + 'T12:00:00+08:00')
        if (!isNaN(parsed.getTime())) return parsed
      }
      
      return new Date(dateInput)
    }

    // Import transactions
    const result = await prisma.transaction.createMany({
      data: transactions.map((t: any) => ({
        userId: userId,
        branchId: branchId,
        branchName: t.branchName || branchId,
        date: parseDateAsPH(t.date),
        type: t.type || 'expense',
        category: t.category || null,
        amount: parseFloat(t.amount) || 0,
        description: t.description || null,
        source: t.source || null,
        isPersonal: t.isPersonal === true || t.isPersonal === 'true',
        entryMethod: 'bulk'
      })),
      skipDuplicates: true
    })

    return res.status(201).json({ 
      success: true, 
      imported: result.count 
    })
  } catch (error: any) {
    console.error('Import Error:', error)
    return res.status(500).json({ error: error.message })
  }
}
