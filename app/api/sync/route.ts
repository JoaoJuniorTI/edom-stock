import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export const maxDuration = 60

export async function POST() {
  try {
    const csvUrl = process.env.CSV_URL
    if (!csvUrl) throw new Error('CSV_URL não configurada')

    // Busca o CSV com até 3 tentativas
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

    // Monta a lista de produtos válidos do CSV
    const csvProducts: {
      name: string
      application: string | null
      brand: string | null
      inspiration: string | null
      volumes: { ml: number; price: number }[]
    }[] = []

    for (const line of dataLines) {
      const cols = parseCSVLine(line)
      if (cols.length < 1) continue
      const name = cols[0]?.trim().replace(/^"|"$/g, '')
      if (!name) continue

      const volumes: { ml: number; price: number }[] = []
      const prices = [
        { ml: 1, price: parsePrice(cols[4]) },
        { ml: 2, price: parsePrice(cols[5]) },
        { ml: 3, price: parsePrice(cols[6]) },
        { ml: 5, price: parsePrice(cols[7]) },
      ]
      for (const p of prices) if (p.price !== null) volumes.push({ ml: p.ml, price: p.price })

      csvProducts.push({
        name,
        application: clean(cols[1]),
        brand: clean(cols[2]),
        inspiration: clean(cols[3]),
        volumes,
      })
    }

    // 🔒 Salvaguarda: se o CSV não trouxe nenhum produto válido (planilha vazia,
    // export quebrado, etc.), abortamos SEM desativar nada — caso contrário o
    // catálogo inteiro seria zerado por um erro temporário do Google.
    if (csvProducts.length === 0) {
      return NextResponse.json(
        { success: false, error: 'O CSV não retornou nenhum produto válido. Sync abortado por segurança (nada foi alterado).' },
        { status: 400 }
      )
    }

    let inserted = 0
    let updated = 0

    // Cria / atualiza cada produto do CSV (e reativa se estava inativo)
    for (const prod of csvProducts) {
      const result = await query<{ id: number; xmax: string }>(
        `INSERT INTO products (name, application, brand, inspiration, active, synced_at)
         VALUES ($1, $2, $3, $4, true, NOW())
         ON CONFLICT (name) DO UPDATE SET
           application = EXCLUDED.application,
           brand       = EXCLUDED.brand,
           inspiration = EXCLUDED.inspiration,
           active      = true,
           synced_at   = NOW()
         RETURNING id, xmax::text`,
        [prod.name, prod.application, prod.brand, prod.inspiration]
      )

      const { id, xmax } = result[0]
      if (xmax === '0') inserted++
      else updated++

      // Upsert dos volumes presentes (reativando os que voltaram)
      for (const v of prod.volumes) {
        await query(
          `INSERT INTO product_volumes (product_id, volume_ml, price, active)
           VALUES ($1, $2, $3, true)
           ON CONFLICT (product_id, volume_ml) DO UPDATE SET
             price  = EXCLUDED.price,
             active = true`,
          [id, v.ml, v.price]
        )
      }

      // Desativa volumes que saíram do CSV para este produto
      const presentMls = prod.volumes.map(v => v.ml)
      await query(
        `UPDATE product_volumes
           SET active = false
         WHERE product_id = $1
           AND active = true
           AND volume_ml <> ALL($2::int[])`,
        [id, presentMls]
      )
    }

    // Exclusão lógica: desativa produtos que não estão mais no CSV
    const csvNames = csvProducts.map(p => p.name)
    const deactivatedRows = await query<{ id: number }>(
      `UPDATE products
         SET active = false, synced_at = NOW()
       WHERE active = true
         AND name <> ALL($1::text[])
       RETURNING id`,
      [csvNames]
    )
    const deactivated = deactivatedRows.length

    return NextResponse.json({
      success: true,
      message: `Sync concluído: ${inserted} novos, ${updated} atualizados, ${deactivated} removidos`,
      inserted,
      updated,
      deactivated,
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
