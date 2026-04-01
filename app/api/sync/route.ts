import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export const maxDuration = 60

export async function POST() {
  try {
    const csvUrl = process.env.CSV_URL
    if (!csvUrl) throw new Error('CSV_URL não configurada')

    // Fetch with multiple fallback attempts
    let text = ''
    let lastError = ''
    
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const res = await fetch(csvUrl, {
          cache: 'no-store',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/csv, text/plain, */*',
          },
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        text = await res.text()
        if (text.length > 10) break
      } catch (e: any) {
        lastError = e.message
        if (attempt < 3) await new Promise(r => setTimeout(r, 1000 * attempt))
      }
    }

    if (!text || text.length < 10) {
      throw new Error(`Não foi possível buscar o CSV após 3 tentativas. Último erro: ${lastError}`)
    }

    const lines = text.trim().split('\n')
    const dataLines = lines.slice(1).filter(l => l.trim())

    let inserted = 0
    let updated = 0

    for (const line of dataLines) {
      const cols = parseCSVLine(line)
      if (cols.length < 1) continue

      const name = cols[0]?.trim().replace(/^"|"$/g, '')
      if (!name) continue

      const application = clean(cols[1])
      const brand = clean(cols[2])
      const inspiration = clean(cols[3])
      const price1ml = parsePrice(cols[4])
      const price2ml = parsePrice(cols[5])
      const price3ml = parsePrice(cols[6])
      const price5ml = parsePrice(cols[7])

      const result = await query<{ id: number; xmax: string }>(
        `INSERT INTO products (name, application, brand, inspiration, synced_at)
         VALUES ($1, $2, $3, $4, NOW())
         ON CONFLICT (name) DO UPDATE SET
           application = EXCLUDED.application,
           brand = EXCLUDED.brand,
           inspiration = EXCLUDED.inspiration,
           synced_at = NOW()
         RETURNING id, xmax::text`,
        [name, application, brand, inspiration]
      )

      const { id, xmax } = result[0]
      if (xmax === '0') inserted++
      else updated++

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
      total: inserted + updated,
      synced_at: new Date().toISOString(),
    })
  } catch (err: any) {
    console.error('[SYNC ERROR]', err.message)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

function clean(val?: string): string | null {
  if (!val) return null
  const s = val.trim().replace(/^"|"$/g, '').trim()
  return s || null
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current)
  return result
}

function parsePrice(val?: string): number | null {
  if (!val) return null
  const clean = val.replace(/[R$\s]/g, '').replace(/\./g, '').replace(',', '.')
  const n = parseFloat(clean)
  return isNaN(n) || n <= 0 ? null : n
}
