import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function POST() {
  try {
    const csvUrl = process.env.CSV_URL!
    const res = await fetch(csvUrl, { cache: 'no-store' })
    if (!res.ok) throw new Error('Falha ao buscar CSV')

    const text = await res.text()
    const lines = text.trim().split('\n')
    // Skip header row
    const dataLines = lines.slice(1).filter(l => l.trim())

    let inserted = 0
    let updated = 0

    for (const line of dataLines) {
      // Parse CSV line properly
      const cols = parseCSVLine(line)
      if (cols.length < 1) continue

      const name = cols[0]?.trim()
      if (!name) continue

      const application = cols[1]?.trim() || null
      const brand = cols[2]?.trim() || null
      const inspiration = cols[3]?.trim() || null
      const price1ml = parsePrice(cols[4])
      const price2ml = parsePrice(cols[5])
      const price3ml = parsePrice(cols[6])
      const price5ml = parsePrice(cols[7])

      // Upsert product
      const result = await query<{ id: number; created: boolean }>(
        `INSERT INTO products (name, application, brand, inspiration, synced_at)
         VALUES ($1, $2, $3, $4, NOW())
         ON CONFLICT (name) DO UPDATE SET
           application = EXCLUDED.application,
           brand = EXCLUDED.brand,
           inspiration = EXCLUDED.inspiration,
           synced_at = NOW()
         RETURNING id, (xmax = 0) AS created`,
        [name, application, brand, inspiration]
      )

      const { id, created } = result[0]
      if (created) inserted++
      else updated++

      // Upsert volumes/prices
      const volumes = [
        { ml: 1, price: price1ml },
        { ml: 2, price: price2ml },
        { ml: 3, price: price3ml },
        { ml: 5, price: price5ml },
      ]

      for (const v of volumes) {
        if (v.price !== null) {
          await query(
            `INSERT INTO product_volumes (product_id, volume_ml, price)
             VALUES ($1, $2, $3)
             ON CONFLICT (product_id, volume_ml) DO UPDATE SET price = EXCLUDED.price`,
            [id, v.ml, v.price]
          )
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Sync concluído: ${inserted} novos, ${updated} atualizados`,
      inserted,
      updated,
      synced_at: new Date().toISOString(),
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') { inQuotes = !inQuotes }
    else if (ch === ',' && !inQuotes) { result.push(current); current = '' }
    else { current += ch }
  }
  result.push(current)
  return result
}

function parsePrice(val?: string): number | null {
  if (!val) return null
  const clean = val.replace(/[R$\s.]/g, '').replace(',', '.')
  const n = parseFloat(clean)
  return isNaN(n) ? null : n
}
