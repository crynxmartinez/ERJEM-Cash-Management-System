import type { VercelRequest, VercelResponse } from '@vercel/node'
import { prisma } from './lib/prisma'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      const branches = await prisma.branch.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' }
      })
      
      return res.status(200).json(branches)
    }
    
    if (req.method === 'POST') {
      const data = req.body
      
      const branch = await prisma.branch.create({
        data: {
          id: data.id,
          name: data.name,
          displayName: data.displayName,
          createdBy: data.createdBy,
          isActive: data.isActive ?? true,
          currency: data.currency || 'PHP',
          fiscalYearStart: data.fiscalYearStart || 1
        }
      })
      
      return res.status(201).json(branch)
    }
    
    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error: any) {
    console.error('API Error:', error)
    return res.status(500).json({ error: error.message })
  }
}
