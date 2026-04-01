import type { VercelRequest, VercelResponse } from '@vercel/node'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { email, password, displayName } = req.body

    if (!email || !password || !displayName) {
      return res.status(400).json({ error: 'Email, password, and displayName are required' })
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        displayName
      }
    })

    // Auto-create branch for new user
    const branchId = `${displayName.toLowerCase().replace(/\s+/g, '-')}-${user.id.slice(0, 8)}`
    const branch = await prisma.branch.create({
      data: {
        id: branchId,
        name: branchId,
        displayName: `${displayName}'s Branch`,
        createdBy: user.id,
        isActive: true,
        currency: 'PHP',
        fiscalYearStart: 1
      }
    })

    // Update user with branchId
    await prisma.user.update({
      where: { id: user.id },
      data: { branchId: branch.id }
    })

    // Return user without password
    const { password: _, ...userWithoutPassword } = user

    return res.status(201).json({ ...userWithoutPassword, branchId: branch.id })
  } catch (error: any) {
    console.error('Register error:', error)
    return res.status(500).json({ error: error.message })
  }
}
