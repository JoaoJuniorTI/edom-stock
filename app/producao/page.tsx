'use client'
import { useEffect, useState, useRef, useCallback } from 'react'
import { Plus, Trash2, FileText, Search, AlertTriangle } from 'lucide-react'
import { glass } from '@/lib/styles'

interface Product { id: number; name: string; brand: string }
interface Channel { id: number; name: string }
interface Item { product_id: number; product_name: string; volume_ml: number; channel_id: number | null; channel_name: string }
interface LowAlert { name: string; balance_ml: number; alert_ml: number }

export default function ProducaoPage() {
  const [products, setProducts]   = useState<Product[]>([])
  const [channels, setChannels]   = useState<Channel[]>([])
  const [items, setItems]         = useState<Item[]>([])
  const [search, setSearch]       = useState('')
  const [showSugg, setShowSugg]   = useState(false)
  const [selProduct, setSelProduct] = useState<Product | null>(null)
  const [volume, setVolume]       = useState('')
  const [channelId, setChannelId] = useState('')
  const [saving, setSaving]       = useState(false)
  const [lowAlerts, setLowAlerts] = useState<LowAlert[]>([])
  const [done, setDone]           = useState(false)
  const [highlightIdx, setHighlightIdx] = useState(-1)

  const searchRef  = useRef<HTMLInputElement>(null)
  const volumeRef  = useRef<HTMLSelectElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const suggestions = products.filter(p =>
    search.length > 0 && p.name.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 10)

  useEffect(() => {
    Promise.all([
      fetch('/api/products').then(r => r.json()),
      fetch('/api/channels').then(r => r.json()),
    ]).then(([p, c]) => {
      setProducts(p.products || [])
      setChannels(c.channels || [])
    })
  }, [])

  // Reset highlight when suggestions change
  useEffect(() => { setHighlightIdx(-1) }, [search])

  function selectProduct(p: Product) {
    setSelProduct(p)
    setSearch(p.name)
    setShowSugg(false)
    setHighlightIdx(-1)
    setTimeout(() => volumeRef.current?.focus(), 50)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!showSugg || suggestions.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightIdx(i => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightIdx(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (highlightIdx >= 0 && suggestions[highlightIdx]) {
        selectProduct(suggestions[highlightIdx])
      } else if (suggestions.length === 1) {
        selectProduct(suggestions[0])
      }
    } else if (e.key === 'Escape') {
      setShowSugg(false)
      setHighlightIdx(-1)
    }
  }

  function handleVolumeKeyDown(e: React.KeyboardEvent<HTMLSelectElement>) {
    if (e.key === 'Enter' && volume && selProduct) {
      e.preventDefault()
      addItem()
    }
  }

  function addItem() {
    if (!selProduct || !volume) return
    const ch = channels.find(c => c.id === Number(channelId))
    setItems(prev => [...prev, {
      product_id:   selProduct.id,
      product_name: selProduct.name,
      volume_ml:    Number(volume),
      channel_id:   ch?.id ?? null,
      channel_name: ch?.name ?? '—',
    }])
    setSearch(''); setSelProduct(null); setVolume(''); setChannelId('')
    setTimeout(() => searchRef.current?.focus(), 50)
  }

  function removeItem(idx: number) { setItems(prev => prev.filter((_, i) => i !== idx)) }

  async function finalize() {
    if (!items.length) return
    setSaving(true)
    const res = await fetch('/api/production', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    })
    const data = await res.json()
    if (data.success) {
      setLowAlerts(data.lowStock || [])
      setDone(true)
      generatePDF(items, data.lowStock || [])
    }
    setSaving(false)
  }

  function generatePDF(list: Item[], alerts: LowAlert[]) {
    const date = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
    const rows = list.map(i =>
      `<tr><td>${i.product_name}</td><td style="text-align:center">${i.volume_ml}ml</td><td>${i.channel_name}</td></tr>`
    ).join('')
    const alertRows = alerts.map(a =>
      `<tr style="color:#C0392B"><td>${a.name}</td><td style="text-align:center">${Number(a.balance_ml).toFixed(1)}ml</td><td>Limiar: ${a.alert_ml}ml</td></tr>`
    ).join('')

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<style>
body{font-family:Arial,sans-serif;color:#1C1C1E;padding:40px;background:#fff}
h1{font-family:Georgia,serif;font-size:28px;color:#A8842C;font-weight:300;margin-bottom:4px}
p{font-size:12px;color:#888;margin-bottom:28px}
table{width:100%;border-collapse:collapse;font-size:13px}
th{text-align:left;padding:9px 12px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#A8842C;border-bottom:2px solid #E8D5A3;background:#FAF7F0}
th:nth-child(2){text-align:center}
td{padding:11px 12px;border-bottom:1px solid #F5EFE4}
.alert{margin-top:28px;padding:16px;background:#fff5f5;border:1px solid #f5c6c6;border-radius:8px}
.alert h2{font-size:13px;font-weight:700;color:#C0392B;margin-bottom:12px;text-transform:uppercase;letter-spacing:.06em}
.footer{margin-top:40px;padding-top:16px;border-top:1px solid #eee;font-size:11px;color:#aaa}
</style></head><body>
<h1>EDOM DECANTS</h1>
<p>Lista de Produção · ${date}</p>
<table>
  <thead><tr><th>Produto</th><th style="text-align:center">Volume</th><th>Canal</th></tr></thead>
  <tbody>${rows}</tbody>
</table>
${alerts.length > 0 ? `<div class="alert"><h2>⚠ Estoque crítico (${alerts.length} produto${alerts.length > 1 ? 's' : ''})</h2>
<table><thead><tr><th>Produto</th><th>Saldo</th><th>Limiar</th></tr></thead><tbody>${alertRows}</tbody></table></div>` : ''}
<div class="footer">Edom Decants · Gerado em ${new Date().toLocaleString('pt-BR')}</div>
</body></html>`
    const win = window.open('', '_blank')
    if (win) { win.document.write(html); win.document.close(); setTimeout(() => win.print(), 600) }
  }

  if (done) return (
    <div className="fade-in" style={{ maxWidth: 560, margin: '60px auto', textAlign: 'center' }}>
      <div style={{ fontFamily: 'Playfair Display,serif', fontSize: 48, color: 'var(--success)', marginBottom: 12 }}>✓</div>
      <h2 style={{ fontFamily: 'Playfair Display,serif', fontSize: 28, fontWeight: 300, color: 'var(--t1)', marginBottom: 8 }}>Lista finalizada</h2>
      <p style={{ color: 'var(--t3)', marginBottom: 32, fontSize: 14 }}>PDF gerado e aberto para impressão.</p>
      {lowAlerts.length > 0 && (
        <div style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: 14, padding: 20, marginBottom: 28, textAlign: 'left' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <AlertTriangle size={15} style={{ color: 'var(--danger)', flexShrink: 0 }} strokeWidth={2.2}/>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--danger)' }}>Produtos com estoque crítico</span>
          </div>
          {lowAlerts.map(a => (
            <div key={a.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid rgba(255,59,48,0.1)', fontSize: 13 }}>
              <span style={{ color: 'var(--t1)' }}>{a.name}</span>
              <span style={{ color: 'var(--danger)', fontWeight: 600 }}>{Number(a.balance_ml).toFixed(1)}ml</span>
            </div>
          ))}
        </div>
      )}
      <button className="btn-gold" onClick={() => { setDone(false); setItems([]) }}>Nova lista</button>
    </div>
  )

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 36 }}>
        <h1 style={{ fontFamily: 'Playfair Display,serif', fontSize: 36, fontWeight: 300, color: 'var(--t1)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>Lista de produção</h1>
        <p style={{ color: 'var(--t3)', fontSize: 14.5, marginTop: 8 }}>Lance os itens vendidos no dia e gere o PDF de produção</p>
      </div>

      {/* Add item card */}
      <div style={{ ...glass.card, padding: 26, marginBottom: 20, overflow: 'visible' }}>
        <h3 style={{ fontFamily: 'var(--font-ui)', fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--t3)', marginBottom: 18 }}>
          Adicionar item
        </h3>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>

          {/* Product search */}
          <div style={{ flex: 2, minWidth: 240, position: 'relative' }} ref={wrapperRef}>
            <label className="label">Produto</label>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--t4)', pointerEvents: 'none' }}/>
              <input
                ref={searchRef}
                style={{ ...glass.input, paddingLeft: 36 }}
                placeholder="Buscar produto… (↑↓ navegar, Enter selecionar)"
                value={search}
                onChange={e => { setSearch(e.target.value); setShowSugg(true); setSelProduct(null) }}
                onFocus={() => { if (search) setShowSugg(true) }}
                onBlur={() => setTimeout(() => setShowSugg(false), 150)}
                onKeyDown={handleKeyDown}
                autoComplete="off"
              />
            </div>

            {/* Dropdown — position absolute outside card overflow */}
            {showSugg && suggestions.length > 0 && (
              <div style={{ ...glass.dropdown }}>
                {suggestions.map((p, idx) => (
                  <button
                    key={p.id}
                    onMouseDown={() => selectProduct(p)}
                    onMouseEnter={() => setHighlightIdx(idx)}
                    style={{
                      display: 'block', width: '100%', padding: '11px 16px',
                      background: highlightIdx === idx ? 'rgba(184,148,63,0.10)' : 'transparent',
                      border: 'none',
                      borderBottom: idx < suggestions.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none',
                      color: 'var(--t1)', fontSize: 13.5, textAlign: 'left', cursor: 'pointer',
                      transition: 'background 0.1s',
                    }}>
                    <span style={{ fontWeight: highlightIdx === idx ? 600 : 400 }}>{p.name}</span>
                    <span style={{ fontSize: 11.5, color: 'var(--t4)', marginLeft: 8 }}>{p.brand}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Volume */}
          <div style={{ minWidth: 130 }}>
            <label className="label">Volume</label>
            <select
              ref={volumeRef}
              style={{ ...glass.input, cursor: 'pointer' }}
              value={volume}
              onChange={e => setVolume(e.target.value)}
              onKeyDown={handleVolumeKeyDown}>
              <option value="">Selecione</option>
              {[1, 2, 3, 5].map(v => <option key={v} value={v}>{v} ml</option>)}
            </select>
          </div>

          {/* Channel */}
          <div style={{ minWidth: 160 }}>
            <label className="label">Canal</label>
            <select style={{ ...glass.input, cursor: 'pointer' }} value={channelId} onChange={e => setChannelId(e.target.value)}>
              <option value="">Canal…</option>
              {channels.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <button
            className="btn-gold"
            onClick={addItem}
            disabled={!selProduct || !volume}
            style={{ marginBottom: 1 }}>
            <Plus size={14}/> Adicionar
          </button>
        </div>
        <p style={{ fontSize: 11.5, color: 'var(--t4)', marginTop: 12 }}>
          Dica: use <kbd style={{ background: 'rgba(0,0,0,0.06)', padding: '1px 6px', borderRadius: 4, fontSize: 11, fontFamily: 'monospace' }}>↑↓</kbd> para navegar nas sugestões e <kbd style={{ background: 'rgba(0,0,0,0.06)', padding: '1px 6px', borderRadius: 4, fontSize: 11, fontFamily: 'monospace' }}>Enter</kbd> para selecionar
        </p>
      </div>

      {/* Item list */}
      {items.length > 0 ? (
        <>
          <div style={{ ...glass.card, overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: 'var(--font-ui)', fontSize: 13.5, fontWeight: 500, color: 'var(--t2)' }}>
                {items.length} {items.length === 1 ? 'item' : 'itens'} na lista
              </span>
            </div>
            <table>
              <thead>
                <tr>
                  <th style={{ width: 36 }}>#</th>
                  <th>Produto</th>
                  <th>Volume</th>
                  <th>Canal</th>
                  <th style={{ width: 44 }}></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ color: 'var(--t5)', fontSize: 12 }}>{idx + 1}</td>
                    <td style={{ fontWeight: 500, fontSize: 13.5 }}>{item.product_name}</td>
                    <td><span style={{ color: 'var(--gold)', fontWeight: 700 }}>{item.volume_ml}ml</span></td>
                    <td style={{ color: 'var(--t3)' }}>{item.channel_name}</td>
                    <td>
                      <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px 6px' }} onClick={() => removeItem(idx)}>
                        <Trash2 size={14} style={{ color: 'var(--danger)' }}/>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn-gold" onClick={finalize} disabled={saving} style={{ padding: '12px 28px', fontSize: 14 }}>
              <FileText size={15}/> {saving ? 'Finalizando…' : 'Finalizar e gerar PDF'}
            </button>
          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '56px 20px', color: 'var(--t4)' }}>
          <FileText size={32} style={{ opacity: .25, marginBottom: 12 }}/>
          <p style={{ fontSize: 14, fontFamily: 'var(--font-ui)' }}>Nenhum item adicionado ainda</p>
          <p style={{ fontSize: 12.5, marginTop: 4 }}>Busque um produto acima para começar</p>
        </div>
      )}
    </div>
  )
}
