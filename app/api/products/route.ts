import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET() {
  try {
    const products = await query(`
      SELECT
        p.id, p.name, p.application, p.brand, p.inspiration, p.active, p.synced_at,
        COALESCE(
          json_agg(
            json_build_object('volume_ml', pv.volume_ml, 'price', pv.price)
            ORDER BY pv.volume_ml
          ) FILTER (WHERE pv.id IS NOT NULL),
          '[]'
        ) AS volumes
      FROM products p
      LEFT JOIN product_volumes pv ON pv.product_id = p.id AND pv.active = true
      WHERE p.active = true
      GROUP BY p.id
      ORDER BY p.name
    `)
    return NextResponse.json({ products })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
