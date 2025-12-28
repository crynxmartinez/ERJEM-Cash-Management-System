import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    // Check environment
    const hasDbUrl = !!process.env.DATABASE_URL
    const dbUrlStart = process.env.DATABASE_URL?.substring(0, 30) || 'not set'
    
    // Try to import Prisma
    let prismaStatus = 'not tested'
    let prismaError = null
    
    try {
      const { PrismaClient } = await import('@prisma/client')
      const prisma = new PrismaClient()
      await prisma.$connect()
      prismaStatus = 'connected'
      await prisma.$disconnect()
    } catch (e: any) {
      prismaStatus = 'failed'
      prismaError = e.message
    }
    
    return res.status(200).json({
      status: 'ok',
      hasDbUrl,
      dbUrlStart,
      prismaStatus,
      prismaError,
      nodeVersion: process.version
    })
  } catch (error: any) {
    return res.status(500).json({ 
      error: error.message,
      stack: error.stack
    })
  }
}
