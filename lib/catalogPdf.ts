import { getDocumentProxy } from 'unpdf'

// Lê o PDF "Seleção de perfumes" gerado pelo edom-catalog.
// Layout (jsPDF, A4 em mm): nome em x=18, marca em x=98, volume ("5 ml")
// e valor ("R$ 35,00") alinhados à direita e, se houver promoção, "-10%".
// Cada linha da tabela vira um texto separado por coluna na mesma altura.

export interface CatalogPdfRow { name: string; brand: string; volume_ml: number; price: number }
export interface CatalogPdfData { rows: CatalogPdfRow[]; total: number | null; date: string | null }

const MM = 72 / 25.4
// A coluna do nome termina em 92mm e a da marca começa em 98mm.
const BRAND_COL_X = 95 * MM

const RE_PRICE  = /^R\$\s*([\d.]+,\d{2})$/
const RE_VOLUME = /^(\d+(?:[.,]\d+)?)\s*ml$/i
const RE_PROMO  = /^-\d+%$/
const RE_DATE   = /^\d{2}\/\d{2}\/\d{4}$/

const parseBRL = (s: string) => Number(s.replace(/\./g, '').replace(',', '.'))

interface TextPiece { str: string; x: number; y: number }

export async function parseCatalogPdf(data: Uint8Array): Promise<CatalogPdfData> {
  const pdf = await getDocumentProxy(data)
  const rows: CatalogPdfRow[] = []
  let total: number | null = null
  let date: string | null = null

  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p)
    const content = await page.getTextContent()
    const pieces: TextPiece[] = []
    for (const it of content.items) {
      if (!('str' in it)) continue
      const str = it.str.trim()
      if (!str) continue
      pieces.push({ str, x: it.transform[4], y: it.transform[5] })
    }

    // Agrupa os textos por linha (mesma altura, com pequena tolerância)
    const lines: TextPiece[][] = []
    for (const piece of pieces.sort((a, b) => b.y - a.y || a.x - b.x)) {
      const line = lines.find(l => Math.abs(l[0].y - piece.y) < 2)
      if (line) line.push(piece)
      else lines.push([piece])
    }

    for (const line of lines) {
      line.sort((a, b) => a.x - b.x)
      if (!date) {
        const d = line.find(t => RE_DATE.test(t.str))
        if (d) date = d.str
      }

      const priceT = line.find(t => RE_PRICE.test(t.str))
      if (!priceT) continue
      const price = parseBRL(priceT.str.match(RE_PRICE)![1])

      if (line.some(t => t.str === 'Total')) { total = price; continue }

      const volT = line.find(t => RE_VOLUME.test(t.str))
      if (!volT) continue
      const volume_ml = Number(volT.str.match(RE_VOLUME)![1].replace(',', '.'))

      const rest = line.filter(t => t !== priceT && t !== volT && !RE_PROMO.test(t.str))
      const name  = rest.filter(t => t.x <  BRAND_COL_X).map(t => t.str).join(' ').trim()
      const brand = rest.filter(t => t.x >= BRAND_COL_X).map(t => t.str).join(' ').trim()
      if (!name) continue
      rows.push({ name, brand, volume_ml, price })
    }
  }

  return { rows, total, date }
}
