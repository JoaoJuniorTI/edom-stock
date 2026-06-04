import { NextResponse } from 'next/server'
import { query } from '@/lib/db'


let quotesTableReady = false

async function ensureQuotesTable() {
  if (quotesTableReady) return

  await query(`
    CREATE TABLE IF NOT EXISTS quotes (
      id              SERIAL PRIMARY KEY,
      number          TEXT NOT NULL DEFAULT 'PENDING',
      client_name     TEXT NOT NULL,
      client_contact  TEXT,
      items           JSONB NOT NULL DEFAULT '[]'::jsonb,
      frete_valor     NUMERIC(10,2) NOT NULL DEFAULT 0,
      frete_transp    TEXT,
      desconto_tipo   TEXT NOT NULL DEFAULT 'reais',
      desconto_valor  NUMERIC(10,2) NOT NULL DEFAULT 0,
      note            TEXT,
      total           NUMERIC(10,2) NOT NULL DEFAULT 0,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)

  // Garante compatibilidade caso a tabela já exista com uma versão antiga.
  await query(`ALTER TABLE quotes ADD COLUMN IF NOT EXISTS number TEXT NOT NULL DEFAULT 'PENDING'`)
  await query(`ALTER TABLE quotes ADD COLUMN IF NOT EXISTS client_name TEXT NOT NULL DEFAULT ''`)
  await query(`ALTER TABLE quotes ADD COLUMN IF NOT EXISTS client_contact TEXT`)
  await query(`ALTER TABLE quotes ADD COLUMN IF NOT EXISTS items JSONB NOT NULL DEFAULT '[]'::jsonb`)
  await query(`ALTER TABLE quotes ADD COLUMN IF NOT EXISTS frete_valor NUMERIC(10,2) NOT NULL DEFAULT 0`)
  await query(`ALTER TABLE quotes ADD COLUMN IF NOT EXISTS frete_transp TEXT`)
  await query(`ALTER TABLE quotes ADD COLUMN IF NOT EXISTS desconto_tipo TEXT NOT NULL DEFAULT 'reais'`)
  await query(`ALTER TABLE quotes ADD COLUMN IF NOT EXISTS desconto_valor NUMERIC(10,2) NOT NULL DEFAULT 0`)
  await query(`ALTER TABLE quotes ADD COLUMN IF NOT EXISTS note TEXT`)
  await query(`ALTER TABLE quotes ADD COLUMN IF NOT EXISTS total NUMERIC(10,2) NOT NULL DEFAULT 0`)
  await query(`ALTER TABLE quotes ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`)
  await query(`ALTER TABLE quotes ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`)
  await query(`CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON quotes (created_at DESC)`)

  quotesTableReady = true
}

// Orçamentos com mais de 30 dias são removidos automaticamente para
// manter o sistema limpo. A limpeza roda toda vez que a lista é carregada.
const RETENTION_DAYS = 30

async function purgeOld() {
  await query(
    `DELETE FROM quotes WHERE created_at < NOW() - INTERVAL '${RETENTION_DAYS} days'`
  )
}

// GET /api/quotes        -> lista todos (e limpa os antigos)
// GET /api/quotes?id=123 -> retorna um orçamento específico
export async function GET(req: Request) {
  try {
    await ensureQuotesTable()
    await purgeOld()
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (id) {
      const rows = await query(`SELECT * FROM quotes WHERE id = $1`, [Number(id)])
      if (rows.length === 0) {
        return NextResponse.json({ error: 'Orçamento não encontrado' }, { status: 404 })
      }
      return NextResponse.json({ quote: rows[0] })
    }

    const quotes = await query(`SELECT * FROM quotes ORDER BY created_at DESC`)
    return NextResponse.json({ quotes })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// POST /api/quotes -> cria um novo orçamento. O número (ED-000123) é
// derivado do id, ficando estável e sequencial.
export async function POST(req: Request) {
  try {
    await ensureQuotesTable()
    const b = await req.json()
    if (!b.client_name) {
      return NextResponse.json({ error: 'Nome do cliente é obrigatório' }, { status: 400 })
    }

    const inserted = await query<{ id: number }>(
      `INSERT INTO quotes
        (number, client_name, client_contact, items, frete_valor, frete_transp,
         desconto_tipo, desconto_valor, note, total)
       VALUES ('PENDING', $1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id`,
      [
        b.client_name,
        b.client_contact || null,
        JSON.stringify(b.items || []),
        b.frete_valor || 0,
        b.frete_transp || null,
        b.desconto_tipo || 'reais',
        b.desconto_valor || 0,
        b.note || null,
        b.total || 0,
      ]
    )

    const id = inserted[0].id
    const number = 'ED-' + String(id).padStart(6, '0')

    const rows = await query(
      `UPDATE quotes SET number = $1 WHERE id = $2 RETURNING *`,
      [number, id]
    )
    return NextResponse.json({ quote: rows[0] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// PUT /api/quotes -> atualiza um orçamento existente (body precisa de id)
export async function PUT(req: Request) {
  try {
    await ensureQuotesTable()
    const b = await req.json()
    if (!b.id) {
      return NextResponse.json({ error: 'id é obrigatório' }, { status: 400 })
    }

    const rows = await query(
      `UPDATE quotes SET
         client_name    = $1,
         client_contact = $2,
         items          = $3,
         frete_valor    = $4,
         frete_transp   = $5,
         desconto_tipo  = $6,
         desconto_valor = $7,
         note           = $8,
         total          = $9,
         updated_at     = NOW()
       WHERE id = $10
       RETURNING *`,
      [
        b.client_name,
        b.client_contact || null,
        JSON.stringify(b.items || []),
        b.frete_valor || 0,
        b.frete_transp || null,
        b.desconto_tipo || 'reais',
        b.desconto_valor || 0,
        b.note || null,
        b.total || 0,
        Number(b.id),
      ]
    )

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Orçamento não encontrado' }, { status: 404 })
    }
    return NextResponse.json({ quote: rows[0] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// DELETE /api/quotes?id=123 -> remove um orçamento
export async function DELETE(req: Request) {
  try {
    await ensureQuotesTable()
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'id é obrigatório' }, { status: 400 })
    }
    await query(`DELETE FROM quotes WHERE id = $1`, [Number(id)])
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
