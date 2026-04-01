import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET() {
  try {
    const channels = await query('SELECT * FROM sales_channels WHERE active=true ORDER BY name')
    return NextResponse.json({ channels })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
