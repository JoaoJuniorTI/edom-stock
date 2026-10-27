import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { parseCatalogPdf } from '@/lib/catalogPdf'

interface ProductRow { id: number; name: string; brand: string; volumes: { volume_ml: number; price: number }[] }

const n = (s: string) => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim()

// Procura o produto do estoque correspondente a uma linha do PDF.
// O catálogo pode cortar nomes longos, então aceita também "começa com".
function findProduct(products: ProductRow[], name: string, brand: string) {
  const nn = n(name), nb = n(brand)
  const exact = products.filter(p => n(p.name) === nn)
  if (exact.length) return exact.find(p => n(p.brand) === nb) || exact[0]
  const prefix = products.filter(p => n(p.name).startsWith(nn) || nn.startsWith(n(p.name)))
  const prefixSameBrand = prefix.filter(p => n(p.brand) === nb)
  if (prefixSameBrand.length === 1) return prefixSameBrand[0]
  if (prefix.length === 1) return prefix[0]
  return null
}

// POST /api/quotes/import (multipart, campo "file")
// Lê o PDF de seleção do edom-catalog e devolve os itens no formato do orçamento.
export async function POST(req: Request) {
  try {
    const form = await req.formData()
    const file = form.get('file')
    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'Envie o arquivo PDF' }, { status: 400 })
    }

    let parsed
    try {
      parsed = await parseCatalogPdf(new Uint8Array(await file.arrayBuffer()))
    } catch {
      return NextResponse.json({ error: 'Não foi possível ler o PDF' }, { status: 400 })
    }
    if (parsed.rows.length === 0) {
      return NextResponse.json({ error: 'Nenhum perfume encontrado no PDF. Ele foi gerado pelo catálogo?' }, { status: 400 })
    }

    const products = await query<ProductRow>(`
      SELECT p.id, p.name, p.brand,
        COALESCE(json_agg(json_build_object('volume_ml', pv.volume_ml, 'price', pv.price))
          FILTER (WHERE pv.id IS NOT NULL), '[]') AS volumes
      FROM products p
      LEFT JOIN product_volumes pv ON pv.product_id = p.id AND pv.active = true
      WHERE p.active = true
      GROUP BY p.id
    `)

    const unmatched: string[] = []
    const items = parsed.rows.map(r => {
      const p = findProduct(products, r.name, r.brand)
      if (!p) unmatched.push(`${r.name}${r.brand ? ` (${r.brand})` : ''}`)
      // Mantém o preço do PDF (o que o cliente viu); "Atualizar preços" usa o do estoque.
      return {
        product_id: p?.id ?? 0,
        product_name: p?.name ?? r.name,
        brand: p?.brand ?? r.brand,
        volume_ml: r.volume_ml,
        price: r.price,
      }
    })

    return NextResponse.json({ items, unmatched, total: parsed.total, date: parsed.date })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
