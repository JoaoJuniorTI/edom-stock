import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET() {
  try {
    // Get today's session or empty
    const rows = await query(`
      SELECT * FROM production_sessions
      WHERE session_date = CURRENT_DATE
      ORDER BY created_at DESC LIMIT 1
    `)
    return NextResponse.json({ session: rows[0] || null })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { items } = await req.json()
    // items: [{product_id, product_name, volume_ml, channel_id, channel_name}]

    // Register each item as a movement
    for (const item of items) {
      await query(
        `INSERT INTO stock_movements (product_id, volume_ml, channel_id, note)
         VALUES ($1, $2, $3, 'Lista de produção')`,
        [item.product_id, item.volume_ml, item.channel_id || null]
      )
    }

    // Save session
    const result = await query(
      `INSERT INTO production_sessions (items, pdf_generated_at)
       VALUES ($1, NOW()) RETURNING *`,
      [JSON.stringify(items)]
    )

    // Get low stock alerts
    const lowStock = await query(`
      SELECT p.name,
        COALESCE(SUM(e.quantity_ml),0) - COALESCE(
          (SELECT SUM(volume_ml) FROM stock_movements m WHERE m.product_id=p.id),0
        ) AS balance_ml,
        t.alert_ml
      FROM products p
      LEFT JOIN stock_entries e ON e.product_id=p.id
      LEFT JOIN stock_thresholds t ON t.product_id=p.id
      WHERE p.active=true
      GROUP BY p.id, p.name, t.alert_ml
      HAVING t.alert_ml IS NOT NULL AND
        COALESCE(SUM(e.quantity_ml),0) - COALESCE(
          (SELECT SUM(volume_ml) FROM stock_movements m WHERE m.product_id=p.id),0
        ) <= t.alert_ml
      ORDER BY p.name
    `)

    return NextResponse.json({ success: true, session: result[0], lowStock })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
