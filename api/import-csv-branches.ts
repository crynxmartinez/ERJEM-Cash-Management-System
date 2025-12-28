import type { VercelRequest, VercelResponse } from '@vercel/node'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { transactions, userId } = req.body

    if (!transactions || !Array.isArray(transactions)) {
      return res.status(400).json({ error: 'Transactions array required' })
    }

    if (!userId) {
      return res.status(400).json({ error: 'userId required' })
    }

    // Get unique branch IDs from transactions
    const branchIds = [...new Set(transactions.map((t: any) => t.branchId).filter(Boolean))]

    // Ensure all branches exist
    for (const branchId of branchIds) {
      await prisma.branch.upsert({
        where: { id: branchId as string },
        update: {},
        create: {
          id: branchId as string,
          name: branchId as string,
          displayName: branchId as string,
          createdBy: userId
        }
      })
    }

    // Import transactions
    const result = await prisma.transaction.createMany({
      data: transactions.map((t: any) => ({
        userId: userId,
        branchId: t.branchId,
        branchName: t.branchId,
        date: new Date(t.date),
        type: (t.type || 'expense').toLowerCase(),
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
      imported: result.count,
      branches: branchIds.length
    })
  } catch (error: any) {
    console.error('Import Error:', error)
    return res.status(500).json({ error: error.message })
  }
}
