import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

// GET: recent movements
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const productId = searchParams.get('product_id')
  const limit = parseInt(searchParams.get('limit') || '50')

  try {
    const rows = await query(`
      SELECT
        m.id, m.volume_ml, m.note, m.created_at,
        p.name AS product_name,
        c.name AS channel_name
      FROM stock_movements m
      JOIN products p ON p.id = m.product_id
      LEFT JOIN sales_channels c ON c.id = m.channel_id
      ${productId ? 'WHERE m.product_id = $1' : ''}
      ORDER BY m.created_at DESC
      LIMIT ${limit}
    `, productId ? [productId] : undefined)

    return NextResponse.json({ movements: rows })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// POST: register a sale (withdrawal)
export async function POST(req: NextRequest) {
  try {
    const { product_id, volume_ml, channel_id, note } = await req.json()

    if (!product_id || !volume_ml) {
      return NextResponse.json({ error: 'Produto e volume são obrigatórios' }, { status: 400 })
    }

    // Check balance
    const balance = await query<{ balance_ml: number }>(
      `SELECT COALESCE(SUM(e.quantity_ml),0) - COALESCE(
        (SELECT SUM(volume_ml) FROM stock_movements WHERE product_id=$1),0
       ) AS balance_ml
       FROM stock_entries e WHERE e.product_id=$1`,
      [product_id]
    )

    const current = parseFloat(String(balance[0]?.balance_ml || 0))
    if (current < volume_ml) {
      return NextResponse.json(
        { error: `Saldo insuficiente. Disponível: ${current}ml` },
        { status: 400 }
      )
    }

    const result = await query(
      `INSERT INTO stock_movements (product_id, volume_ml, channel_id, note)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [product_id, volume_ml, channel_id || null, note || null]
    )

    return NextResponse.json({ success: true, movement: result[0] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
