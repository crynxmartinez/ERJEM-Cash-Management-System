import type { VercelRequest, VercelResponse } from '@vercel/node'
import { prisma } from './lib/prisma'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      const { branchId } = req.query
      
      const transactions = await prisma.transaction.findMany({
        where: branchId ? { branchId: branchId as string } : undefined,
        orderBy: { date: 'desc' }
      })
      
      return res.status(200).json(transactions)
    }
    
    if (req.method === 'POST') {
      const data = req.body
      
      // Handle bulk import (array of transactions)
      if (Array.isArray(data)) {
        const transactions = await prisma.transaction.createMany({
          data: data.map((t: any) => ({
            userId: t.userId,
            branchId: t.branchId,
            branchName: t.branchName || null,
            date: new Date(t.date),
            type: t.type,
            category: t.category || null,
            amount: parseFloat(t.amount),
            description: t.description || null,
            source: t.source || null,
            isPersonal: t.isPersonal === true || t.isPersonal === 'true',
            entryMethod: t.entryMethod || 'bulk'
          }))
        })
        
        return res.status(201).json({ count: transactions.count })
      }
      
      // Single transaction
      const transaction = await prisma.transaction.create({
        data: {
          userId: data.userId,
          branchId: data.branchId,
          branchName: data.branchName || null,
          date: new Date(data.date),
          type: data.type,
          category: data.category || null,
          amount: parseFloat(data.amount),
          description: data.description || null,
          source: data.source || null,
          isPersonal: data.isPersonal === true || data.isPersonal === 'true',
          entryMethod: data.entryMethod || 'manual'
        }
      })
      
      return res.status(201).json(transaction)
    }
    
    if (req.method === 'DELETE') {
      const { id } = req.query
      
      if (!id) {
        return res.status(400).json({ error: 'Transaction ID required' })
      }
      
      await prisma.transaction.delete({
        where: { id: id as string }
      })
      
      return res.status(200).json({ success: true })
    }
    
    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error: any) {
    console.error('API Error:', error)
    return res.status(500).json({ error: error.message })
  }
}
