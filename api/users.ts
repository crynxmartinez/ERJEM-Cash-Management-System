import type { VercelRequest, VercelResponse } from '@vercel/node'
import { prisma } from './lib/prisma'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      const { id } = req.query
      
      if (id) {
        const user = await prisma.user.findUnique({
          where: { id: id as string }
        })
        return res.status(200).json(user)
      }
      
      const users = await prisma.user.findMany()
      return res.status(200).json(users)
    }
    
    if (req.method === 'POST') {
      const data = req.body
      
      const user = await prisma.user.upsert({
        where: { id: data.id },
        update: {
          email: data.email,
          displayName: data.displayName
        },
        create: {
          id: data.id,
          email: data.email,
          displayName: data.displayName
        }
      })
      
      return res.status(201).json(user)
    }
    
    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error: any) {
    console.error('API Error:', error)
    return res.status(500).json({ error: error.message })
  }
}
