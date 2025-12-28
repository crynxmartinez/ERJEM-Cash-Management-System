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

    // Import transactions
    const result = await prisma.transaction.createMany({
      data: transactions.map((t: any) => ({
        userId: userId,
        branchId: branchId,
        branchName: t.branchName || branchId,
        date: new Date(t.date),
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
