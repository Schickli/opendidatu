import { NextResponse } from 'next/server'
import { getBootstrapSnapshot } from '@/lib/server/repository'

export const runtime = 'nodejs'

export async function GET() {
  return NextResponse.json(getBootstrapSnapshot())
}