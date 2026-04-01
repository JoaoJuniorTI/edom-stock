import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

const ALERT_DAYS = 10

export async function GET() {
  try {
    const rows = await query(`
      WITH entries AS (
        SELECT product_id, COALESCE(SUM(quantity_ml),0) AS total_in
        FROM stock_entries GROUP BY product_id
      ),
      exits AS (
        SELECT product_id, COALESCE(SUM(volume_ml),0) AS total_out
        FROM stock_movements GROUP BY product_id
      ),
      avg30 AS (
        SELECT product_id,
          SUM(volume_ml) / GREATEST(
            EXTRACT(DAY FROM (NOW() - MIN(created_at))), 1
          ) AS daily_avg
        FROM stock_movements
        WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY product_id
      ),
      avg7 AS (
        SELECT product_id,
          SUM(volume_ml) / 7.0 AS daily_avg
        FROM stock_movements
        WHERE created_at >= NOW() - INTERVAL '7 days'
        GROUP BY product_id
      )
      SELECT
        p.id, p.name, p.application, p.brand,
        COALESCE(e.total_in, 0)                                    AS total_in,
        COALESCE(x.total_out, 0)                                   AS total_out,
        COALESCE(e.total_in, 0) - COALESCE(x.total_out, 0)        AS balance_ml,
        t.alert_ml,
        ROUND(a30.daily_avg::numeric, 2)                           AS daily_avg_30,
        ROUND(a7.daily_avg::numeric, 2)                            AS daily_avg_7,
        CASE WHEN a30.daily_avg > 0
          THEN ROUND((COALESCE(e.total_in,0)-COALESCE(x.total_out,0)) / a30.daily_avg)
          ELSE NULL END                                             AS days_left_30,
        CASE WHEN a7.daily_avg > 0
          THEN ROUND((COALESCE(e.total_in,0)-COALESCE(x.total_out,0)) / a7.daily_avg)
          ELSE NULL END                                             AS days_left_7
      FROM products p
      LEFT JOIN entries  e   ON e.product_id = p.id
      LEFT JOIN exits    x   ON x.product_id = p.id
      LEFT JOIN stock_thresholds t ON t.product_id = p.id
      LEFT JOIN avg30    a30 ON a30.product_id = p.id
      LEFT JOIN avg7     a7  ON a7.product_id  = p.id
      WHERE p.active = true
      ORDER BY p.name
    `)

    // Apply 10-day rule: is_low = true when best available forecast < 10 days
    const stock = rows.map((r: any) => {
      const days7  = r.days_left_7  !== null ? Number(r.days_left_7)  : null
      const days30 = r.days_left_30 !== null ? Number(r.days_left_30) : null
      // Use 7-day forecast if available (more recent), fallback to 30-day
      const bestForecast = days7 ?? days30
      const is_low = bestForecast !== null && bestForecast < ALERT_DAYS

      return { ...r, days_left_7: days7, days_left_30: days30, is_low, alert_days: ALERT_DAYS }
    })

    return NextResponse.json({ stock })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { product_id, type, quantity_ml, note } = body
    if (!product_id || !type || !quantity_ml)
      return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 })

    const result = await query(
      `INSERT INTO stock_entries (product_id, type, quantity_ml, note)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [product_id, type, quantity_ml, note || null]
    )
    return NextResponse.json({ success: true, entry: result[0] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { product_id, alert_ml } = await req.json()
    await query(
      `INSERT INTO stock_thresholds (product_id, alert_ml, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (product_id) DO UPDATE SET alert_ml = EXCLUDED.alert_ml, updated_at = NOW()`,
      [product_id, alert_ml]
    )
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}