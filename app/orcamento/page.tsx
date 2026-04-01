'use client'
import { useEffect, useState, useRef } from 'react'
import { Plus, Trash2, FileText, Search, User } from 'lucide-react'

interface Product { id: number; name: string; brand: string; volumes: { volume_ml: number; price: number }[] }
interface QuoteItem { product_id: number; product_name: string; brand: string; volume_ml: number; price: number }

export default function OrcamentoPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [items, setItems] = useState<QuoteItem[]>([])
  const [clientName, setClientName] = useState('')
  const [clientContact, setClientContact] = useState('')
  const [search, setSearch] = useState('')
  const [showSugg, setShowSugg] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedVolume, setSelectedVolume] = useState('')
  const [note, setNote] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/products').then(r => r.json()).then(d => setProducts(d.products || []))
  }, [])

  const suggestions = products.filter(p =>
    search.length > 0 && p.name.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 8)

  function selectProduct(p: Product) {
    setSelectedProduct(p); setSearch(p.name); setShowSugg(false); setSelectedVolume('')
  }

  function addItem() {
    if (!selectedProduct || !selectedVolume) return
    const vol = selectedProduct.volumes.find(v => v.volume_ml === Number(selectedVolume))
    if (!vol) return
    setItems(prev => [...prev, {
      product_id: selectedProduct.id,
      product_name: selectedProduct.name,
      brand: selectedProduct.brand,
      volume_ml: vol.volume_ml,
      price: Number(vol.price),
    }])
    setSearch(''); setSelectedProduct(null); setSelectedVolume('')
    searchRef.current?.focus()
  }

  function removeItem(idx: number) { setItems(prev => prev.filter((_, i) => i !== idx)) }

  const total = items.reduce((sum, i) => sum + i.price, 0)

  function generatePDF() {
    const date = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
    const quoteNum = `ED-${Date.now().toString().slice(-6)}`

    const rows = items.map(i =>
      `<tr>
        <td>${i.product_name}</td>
        <td style="color:#666;font-size:12px">${i.brand}</td>
        <td style="text-align:center">${i.volume_ml} ml</td>
        <td style="text-align:right;font-weight:600">R$ ${i.price.toFixed(2).replace('.',',')}</td>
      </tr>`
    ).join('')

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600&family=DM+Sans:wght@300;400;500&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'DM Sans', Arial, sans-serif; color: #2a2015; background: #fff; }
  .page { max-width: 760px; margin: 0 auto; padding: 48px 40px; }

  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; padding-bottom: 24px; border-bottom: 1px solid #e0d5c0; }
  .brand { font-family: 'Cormorant Garamond', Georgia, serif; }
  .brand h1 { font-size: 32px; font-weight: 300; color: #8B6914; letter-spacing: 0.08em; line-height: 1; }
  .brand p { font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: #b8a880; margin-top: 4px; }
  .quote-info { text-align: right; font-size: 12px; color: #888; line-height: 1.8; }
  .quote-info strong { color: #5a4a2a; font-weight: 500; }

  .client { background: #faf7f0; border: 1px solid #e8dfc8; border-radius: 8px; padding: 16px 20px; margin-bottom: 28px; }
  .client-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #b8a880; margin-bottom: 6px; }
  .client-name { font-size: 17px; font-family: 'Cormorant Garamond', serif; color: #3a2e18; font-weight: 400; }
  .client-contact { font-size: 13px; color: #888; margin-top: 2px; }

  h2 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #b8a880; margin-bottom: 12px; font-weight: 500; }

  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  thead tr { border-bottom: 2px solid #e0d5c0; }
  th { padding: 10px 12px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: #b8a880; font-weight: 500; }
  th:last-child { text-align: right; }
  th:nth-child(3) { text-align: center; }
  td { padding: 13px 12px; border-bottom: 1px solid #f0ebe0; vertical-align: top; }

  .total-row { margin-top: 16px; padding-top: 16px; border-top: 2px solid #C9A84C; display: flex; justify-content: flex-end; align-items: baseline; gap: 24px; }
  .total-label { font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: #b8a880; }
  .total-value { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 28px; color: #8B6914; font-weight: 300; }

  ${note ? `.note { margin-top: 28px; padding: 14px 18px; background: #faf7f0; border-left: 3px solid #C9A84C; font-size: 13px; color: #666; line-height: 1.6; }` : ''}

  .footer { margin-top: 48px; padding-top: 20px; border-top: 1px solid #f0ebe0; display: flex; justify-content: space-between; align-items: center; }
  .footer-brand { font-family: 'Cormorant Garamond', serif; font-size: 14px; color: #C9A84C; letter-spacing: 0.06em; }
  .footer-text { font-size: 11px; color: #bbb; text-align: right; line-height: 1.6; }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="brand">
      <h1>EDOM DECANTS</h1>
      <p>Decants de Luxo</p>
    </div>
    <div class="quote-info">
      <div><strong>Orçamento</strong> ${quoteNum}</div>
      <div>${date}</div>
      <div style="margin-top:4px;font-size:11px;color:#C9A84C;letter-spacing:0.04em">PROPOSTA COMERCIAL</div>
    </div>
  </div>

  <div class="client">
    <div class="client-label">Orçamento para</div>
    <div class="client-name">${clientName}</div>
    ${clientContact ? `<div class="client-contact">${clientContact}</div>` : ''}
  </div>

  <h2>Itens selecionados</h2>
  <table>
    <thead>
      <tr>
        <th>Perfume</th>
        <th>Marca</th>
        <th style="text-align:center">Volume</th>
        <th style="text-align:right">Valor</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <div class="total-row">
    <span class="total-label">Total</span>
    <span class="total-value">R$ ${total.toFixed(2).replace('.',',')}</span>
  </div>

  ${note ? `<div class="note">${note}</div>` : ''}

  <div class="footer">
    <div class="footer-brand">EDOM DECANTS</div>
    <div class="footer-text">
      Orçamento válido por 7 dias<br/>
      Preços sujeitos à disponibilidade de estoque
    </div>
  </div>
</div>
</body>
</html>`

    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const win = window.open(url, '_blank')
    if (win) setTimeout(() => win.print(), 800)
  }

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 300, color: 'var(--gold)', letterSpacing: '0.02em' }}>Gerar orçamento</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Monte o orçamento e exporte em PDF para o cliente</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24, alignItems: 'start' }}>
        {/* Left: items */}
        <div>
          {/* Client info */}
          <div className="card" style={{ padding: 24, marginBottom: 20 }}>
            <h3 style={{ fontSize: 13, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 16 }}>
              <User size={13} style={{ display: 'inline', marginRight: 6 }} />Dados do cliente
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label className="label">Nome *</label>
                <input className="input" placeholder="Nome do cliente" value={clientName} onChange={e => setClientName(e.target.value)} />
              </div>
              <div>
                <label className="label">Contato</label>
                <input className="input" placeholder="WhatsApp, e-mail..." value={clientContact} onChange={e => setClientContact(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Add product */}
          <div className="card" style={{ padding: 24, marginBottom: 20 }}>
            <h3 style={{ fontSize: 13, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 16 }}>Adicionar produto</h3>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              {/* Search */}
              <div style={{ flex: 2, minWidth: 200, position: 'relative' }}>
                <label className="label">Produto</label>
                <div style={{ position: 'relative' }}>
                  <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                  <input ref={searchRef} className="input" placeholder="Buscar perfume..." value={search}
                    onChange={e => { setSearch(e.target.value); setShowSugg(true); setSelectedProduct(null) }}
                    onFocus={() => setShowSugg(true)}
                    onBlur={() => setTimeout(() => setShowSugg(false), 200)}
                    style={{ paddingLeft: 32 }} />
                </div>
                {showSugg && suggestions.length > 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, background: 'var(--bg3)', border: '1px solid var(--border-hover)', borderRadius: 6, maxHeight: 240, overflowY: 'auto', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
                    {suggestions.map(p => (
                      <button key={p.id} onMouseDown={() => selectProduct(p)}
                        style={{ display: 'block', width: '100%', padding: '10px 14px', background: 'transparent', border: 'none', color: 'var(--text)', fontSize: 13, textAlign: 'left', cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(201,168,76,0.08)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                        {p.name}
                        <span style={{ fontSize: 11, color: 'var(--text-dim)', marginLeft: 8 }}>{p.brand}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Volume */}
              <div style={{ minWidth: 160 }}>
                <label className="label">Volumetria</label>
                <select className="input" value={selectedVolume} onChange={e => setSelectedVolume(e.target.value)} disabled={!selectedProduct}>
                  <option value="">Selecione...</option>
                  {selectedProduct?.volumes.map(v => (
                    <option key={v.volume_ml} value={v.volume_ml}>
                      {v.volume_ml} ml — R$ {Number(v.price).toFixed(2).replace('.', ',')}
                    </option>
                  ))}
                </select>
              </div>

              <button className="btn-gold" onClick={addItem} disabled={!selectedProduct || !selectedVolume} style={{ marginBottom: 1 }}>
                <Plus size={14} style={{ display: 'inline', marginRight: 6 }} /> Adicionar
              </button>
            </div>
          </div>

          {/* Items table */}
          {items.length > 0 ? (
            <div className="card">
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>#</th><th>Produto</th><th>Volume</th><th>Preço</th><th></th></tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => (
                      <tr key={idx}>
                        <td style={{ color: 'var(--text-dim)', width: 32 }}>{idx + 1}</td>
                        <td>
                          <div>{item.product_name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{item.brand}</div>
                        </td>
                        <td><span style={{ color: 'var(--gold)' }}>{item.volume_ml} ml</span></td>
                        <td style={{ fontWeight: 500 }}>R$ {item.price.toFixed(2).replace('.', ',')}</td>
                        <td style={{ width: 40 }}>
                          <button className="btn-ghost" style={{ padding: '4px 8px', border: 'none' }} onClick={() => removeItem(idx)}>
                            <Trash2 size={13} color="var(--danger)" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-dim)' }}>
              <p style={{ fontSize: 14 }}>Nenhum produto adicionado ainda</p>
            </div>
          )}
        </div>

        {/* Right: summary */}
        <div style={{ position: 'sticky', top: 24 }}>
          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 13, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 20 }}>Resumo</h3>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Cliente</div>
              <div style={{ fontSize: 15, fontFamily: 'Cormorant Garamond, serif' }}>{clientName || <span style={{ color: 'var(--text-dim)' }}>não informado</span>}</div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Itens</div>
              <div style={{ fontSize: 24, fontFamily: 'Cormorant Garamond, serif', color: 'var(--gold)' }}>{items.length}</div>
            </div>

            <div className="gold-line" style={{ marginBottom: 16 }} />

            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Total</div>
              <div style={{ fontSize: 32, fontFamily: 'Cormorant Garamond, serif', color: 'var(--gold)', fontWeight: 300 }}>
                R$ {total.toFixed(2).replace('.', ',')}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label className="label">Observação (opcional)</label>
              <textarea className="input" rows={3} placeholder="Ex: válido por 7 dias..."
                value={note} onChange={e => setNote(e.target.value)}
                style={{ resize: 'vertical', fontFamily: 'DM Sans, sans-serif' }} />
            </div>

            <button className="btn-gold" onClick={generatePDF}
              disabled={items.length === 0 || !clientName}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <FileText size={14} /> Gerar PDF
            </button>

            {(!clientName || items.length === 0) && (
              <p style={{ fontSize: 11, color: 'var(--text-dim)', textAlign: 'center', marginTop: 8 }}>
                {!clientName ? 'Informe o nome do cliente' : 'Adicione ao menos 1 produto'}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
