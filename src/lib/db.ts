import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { PrismaClient } from '@prisma/client'

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/aleno?schema=public'

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)

declare global {
  var prisma: PrismaClient | undefined
}

const prisma = global.prisma || new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma
}

export { prisma }