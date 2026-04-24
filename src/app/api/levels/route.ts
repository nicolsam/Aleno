import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const levels = await prisma.readingLevel.findMany({
      orderBy: { order: 'asc' },
    })
    return NextResponse.json(levels)
  } catch (error) {
    console.error('Levels error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}