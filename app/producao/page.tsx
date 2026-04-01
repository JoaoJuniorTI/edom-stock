'use client'
import { useEffect, useState, useRef } from 'react'
import { Plus, Trash2, FileText, Search, AlertTriangle } from 'lucide-react'

interface Product { id: number; name: string; brand: string }
interface Channel { id: number; name: string }
interface Item { product_id: number; product_name: string; volume_ml: number; channel_id: number | null; channel_name: string }
interface LowAlert { name: string; balance_ml: number; alert_ml: number }

export default function ProducaoPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [channels, setChannels] = useState<Channel[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [search, setSearch] = useState('')
  const [showSugg, setShowSugg] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [volume, setVolume] = useState('')
  const [channelId, setChannelId] = useState('')
  const [saving, setSaving] = useState(false)
  const [lowAlerts, setLowAlerts] = useState<LowAlert[]>([])
  const [done, setDone] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/products').then(r => r.json()),
      fetch('/api/channels').then(r => r.json()),
    ]).then(([p, c]) => {
      setProducts(p.products || [])
      setChannels(c.channels || [])
    })
  }, [])

  const suggestions = products.filter(p =>
    search.length > 0 && p.name.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 8)

  function selectProduct(p: Product) {
    setSelectedProduct(p)
    setSearch(p.name)
    setShowSugg(false)
  }

  function addItem() {
    if (!selectedProduct || !volume) return
    const ch = channels.find(c => c.id === Number(channelId))
    setItems(prev => [...prev, {
      product_id: selectedProduct.id,
      product_name: selectedProduct.name,
      volume_ml: Number(volume),
      channel_id: ch ? ch.id : null,
      channel_name: ch ? ch.name : '—',
    }])
    setSearch(''); setSelectedProduct(null); setVolume(''); setChannelId('')
    searchRef.current?.focus()
  }

  function removeItem(idx: number) {
    setItems(prev => prev.filter((_, i) => i !== idx))
  }

  async function finalize() {
    if (items.length === 0) return
    setSaving(true)
    const res = await fetch('/api/production', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items })
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
      `<tr>
        <td>${i.product_name}</td>
        <td>${i.volume_ml} ml</td>
        <td>${i.channel_name}</td>
      </tr>`
    ).join('')

    const alertRows = alerts.map(a =>
      `<tr style="color:#C0392B">
        <td>${a.name}</td>
        <td>${Number(a.balance_ml).toFixed(1)} ml</td>
        <td>Limiar: ${a.alert_ml} ml</td>
      </tr>`
    ).join('')

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<style>
  body { font-family: Georgia, serif; color: #222; padding: 40px; background: #fff; }
  .header { text-align: center; margin-bottom: 32px; border-bottom: 2px solid #C9A84C; padding-bottom: 20px; }
  .header h1 { font-size: 28px; color: #8B6914; letter-spacing: 0.06em; margin: 0 0 4px; }
  .header p { color: #888; font-size: 13px; font-family: Arial, sans-serif; margin: 0; }
  h2 { font-size: 14px; font-family: Arial, sans-serif; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #555; margin: 28px 0 12px; }
  table { width: 100%; border-collapse: collapse; font-family: Arial, sans-serif; font-size: 13px; }
  th { text-align: left; padding: 8px 12px; background: #f5f0e8; color: #8B6914; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; border-bottom: 1px solid #e0d5c0; }
  td { padding: 10px 12px; border-bottom: 1px solid #f0ebe0; }
  .total { font-family: Arial, sans-serif; font-size: 13px; color: #555; margin-top: 16px; }
  .alert-section { margin-top: 32px; padding: 16px; background: #fff5f5; border: 1px solid #f5c6c6; border-radius: 6px; }
  .alert-section h2 { color: #C0392B; margin-top: 0; }
  .footer { margin-top: 48px; text-align: center; font-size: 11px; color: #aaa; font-family: Arial, sans-serif; border-top: 1px solid #eee; padding-top: 16px; }
</style>
</head>
<body>
<div class="header">
  <h1>EDOM DECANTS</h1>
  <p>Lista de Produção · ${date}</p>
</div>

<h2>Itens a produzir (${list.length} ${list.length === 1 ? 'item' : 'itens'})</h2>
<table>
  <thead><tr><th>Produto</th><th>Volume</th><th>Canal</th></tr></thead>
  <tbody>${rows}</tbody>
</table>

${alerts.length > 0 ? `
<div class="alert-section">
  <h2>⚠ Alertas de estoque baixo</h2>
  <table>
    <thead><tr><th>Produto</th><th>Saldo atual</th><th>Limiar</th></tr></thead>
    <tbody>${alertRows}</tbody>
  </table>
</div>` : ''}

<div class="footer">Edom Decants · Gerado em ${new Date().toLocaleString('pt-BR')}</div>
</body>
</html>`

    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `producao-${new Date().toISOString().slice(0,10)}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (done) {
    return (
      <div className="fade-in" style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center', paddingTop: 60 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
        <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 28, color: 'var(--gold)', fontWeight: 300, marginBottom: 8 }}>
          Lista finalizada
        </h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: 32 }}>O PDF foi gerado e baixado automaticamente.</p>

        {lowAlerts.length > 0 && (
          <div style={{ background: 'var(--danger-light)', border: '1px solid rgba(192,57,43,0.3)', borderRadius: 8, padding: 20, marginBottom: 32, textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <AlertTriangle size={16} color="var(--danger)" />
              <span style={{ fontSize: 13, fontWeight: 500, color: '#E74C3C' }}>Produtos com estoque baixo</span>
            </div>
            {lowAlerts.map(a => (
              <div key={a.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(192,57,43,0.1)', fontSize: 13 }}>
                <span>{a.name}</span>
                <span style={{ color: 'var(--danger)' }}>{Number(a.balance_ml).toFixed(1)} ml (limiar: {a.alert_ml} ml)</span>
              </div>
            ))}
          </div>
        )}

        <button className="btn-gold" onClick={() => { setDone(false); setItems([]) }}>Nova lista</button>
      </div>
    )
  }

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 300, color: 'var(--gold)', letterSpacing: '0.02em' }}>Lista de produção</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Lance os itens vendidos no dia e gere o PDF de produção</p>
      </div>

      {/* Add item */}
      <div className="card" style={{ padding: 24, marginBottom: 24 }}>
        <h3 style={{ fontSize: 15, fontWeight: 400, marginBottom: 18, color: 'var(--text-muted)' }}>Adicionar item</h3>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          {/* Product search */}
          <div style={{ flex: 2, minWidth: 220, position: 'relative' }}>
            <label className="label">Produto</label>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
              <input ref={searchRef} className="input" placeholder="Buscar produto..." value={search}
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
          <div style={{ minWidth: 120 }}>
            <label className="label">Volume</label>
            <select className="input" value={volume} onChange={e => setVolume(e.target.value)}>
              <option value="">Selecione</option>
              {[1, 2, 3, 5].map(v => <option key={v} value={v}>{v} ml</option>)}
            </select>
          </div>

          {/* Channel */}
          <div style={{ minWidth: 160 }}>
            <label className="label">Canal</label>
            <select className="input" value={channelId} onChange={e => setChannelId(e.target.value)}>
              <option value="">Canal...</option>
              {channels.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <button className="btn-gold" onClick={addItem} disabled={!selectedProduct || !volume} style={{ marginBottom: 1 }}>
            <Plus size={14} style={{ display: 'inline', marginRight: 6 }} /> Adicionar
          </button>
        </div>
      </div>

      {/* Item list */}
      {items.length > 0 ? (
        <div style={{ marginBottom: 24 }}>
          <div className="card">
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>{items.length} {items.length === 1 ? 'item' : 'itens'} na lista</span>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>#</th><th>Produto</th><th>Volume</th><th>Canal</th><th></th></tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ color: 'var(--text-dim)', width: 40 }}>{idx + 1}</td>
                      <td>{item.product_name}</td>
                      <td><span style={{ color: 'var(--gold)', fontWeight: 500 }}>{item.volume_ml} ml</span></td>
                      <td style={{ color: 'var(--text-muted)' }}>{item.channel_name}</td>
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

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
            <button className="btn-gold" onClick={finalize} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileText size={14} />
              {saving ? 'Finalizando...' : 'Finalizar e gerar PDF'}
            </button>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-dim)' }}>
          <FileText size={32} style={{ marginBottom: 12, opacity: 0.3 }} />
          <p style={{ fontSize: 14 }}>Nenhum item adicionado ainda</p>
          <p style={{ fontSize: 12, marginTop: 4 }}>Use o campo acima para buscar e adicionar produtos</p>
        </div>
      )}
    </div>
  )
}
