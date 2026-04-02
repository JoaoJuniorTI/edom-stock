'use client'
import { useEffect, useState, useRef } from 'react'
import { Plus, Trash2, FileText, Search, AlertTriangle } from 'lucide-react'
import { glass } from '@/lib/styles'

interface Product { id: number; name: string; brand: string }
interface Channel { id: number; name: string }
interface Item { product_id: number; product_name: string; volume_ml: number; channel_id: number | null; channel_name: string }
interface LowAlert { name: string; balance_ml: number; alert_ml: number }

const VOLUMES = [1, 2, 3, 5]
const STORAGE_KEY = 'producao_lista'

export default function ProducaoPage() {
  const [products, setProducts]     = useState<Product[]>([])
  const [channels, setChannels]     = useState<Channel[]>([])
  const [items, setItems]           = useState<Item[]>([])
  const [search, setSearch]         = useState('')
  const [showSugg, setShowSugg]     = useState(false)
  const [selProduct, setSelProduct] = useState<Product | null>(null)
  const [volume, setVolume]         = useState('')
  const [channelId, setChannelId]   = useState('')
  const [saving, setSaving]         = useState(false)
  const [lowAlerts, setLowAlerts]   = useState<LowAlert[]>([])
  const [done, setDone]             = useState(false)
  const [hiIdx, setHiIdx]           = useState(-1)

  const searchRef  = useRef<HTMLInputElement>(null)
  const volumeRef  = useRef<HTMLSelectElement>(null)
  const channelRef = useRef<HTMLSelectElement>(null)
  const addBtnRef  = useRef<HTMLButtonElement>(null)

  const suggs = products.filter(p =>
    search.length > 0 && p.name.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 10)

  // ── Carregar lista salva ao montar ──────────────────────────
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setItems(parsed)
        }
      }
    } catch {}
  }, [])

  // ── Salvar lista no localStorage sempre que mudar ───────────
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {}
  }, [items])

  useEffect(() => {
    Promise.all([
      fetch('/api/products').then(r => r.json()),
      fetch('/api/channels').then(r => r.json()),
    ]).then(([p, c]) => {
      setProducts(p.products || [])
      setChannels(c.channels || [])
    })
  }, [])

  useEffect(() => { setHiIdx(-1) }, [search])

  function selectProduct(p: Product) {
    setSelProduct(p)
    setSearch(p.name)
    setShowSugg(false)
    setHiIdx(-1)
    requestAnimationFrame(() => volumeRef.current?.focus())
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
    requestAnimationFrame(() => searchRef.current?.focus())
  }

  // ── Keyboard: search input ──────────────────────────────────
  function onSearchKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Tab') {
      if (showSugg && suggs.length > 0) {
        e.preventDefault()
        selectProduct(suggs[hiIdx >= 0 ? hiIdx : 0])
      }
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setShowSugg(true)
      setHiIdx(i => Math.min(i + 1, suggs.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHiIdx(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const target = hiIdx >= 0 ? suggs[hiIdx] : suggs.length === 1 ? suggs[0] : null
      if (target) selectProduct(target)
    } else if (e.key === 'Escape') {
      setShowSugg(false); setHiIdx(-1)
    }
  }

  function onSearchBlur() {
    setTimeout(() => setShowSugg(false), 160)
  }

  function onVolumeKey(e: React.KeyboardEvent<HTMLSelectElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      channelRef.current?.focus()
    }
  }

  function onChannelKey(e: React.KeyboardEvent<HTMLSelectElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      addBtnRef.current?.focus()
    }
  }

  function onAddBtnKey(e: React.KeyboardEvent<HTMLButtonElement>) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      addItem()
    }
  }

  async function finalize() {
    if (!items.length) return
    setSaving(true)
    const res = await fetch('/api/production', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    })
    const data = await res.json()
    if (data.success) { setLowAlerts(data.lowStock || []); setDone(true); generatePDF(items, data.lowStock || []) }
    setSaving(false)
  }

  // ── Fechar lista: limpa localStorage e estado ───────────────
  function closeList() {
    localStorage.removeItem(STORAGE_KEY)
    setDone(false)
    setItems([])
    setLowAlerts([])
  }

  function generatePDF(list: Item[], alerts: LowAlert[]) {
    const date = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
    const rows = list.map(i => `<tr><td>${i.product_name}</td><td style="text-align:center">${i.volume_ml}ml</td><td>${i.channel_name}</td></tr>`).join('')
    const alertRows = alerts.map(a => `<tr style="color:#C0392B"><td>${a.name}</td><td>${Number(a.balance_ml).toFixed(1)}ml</td><td>Limiar: ${a.alert_ml}ml</td></tr>`).join('')
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>body{font-family:Arial,sans-serif;color:#111;padding:40px}h1{font-family:Georgia,serif;font-size:26px;color:#A8842C;font-weight:300;margin-bottom:4px}p{font-size:12px;color:#888;margin-bottom:28px}table{width:100%;border-collapse:collapse;font-size:13px}th{text-align:left;padding:9px 12px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#A8842C;border-bottom:2px solid #E8D5A3;background:#FAF7F0}td{padding:11px 12px;border-bottom:1px solid #F5EFE4}.alert{margin-top:28px;padding:16px;background:#fff5f5;border:1px solid #fcc;border-radius:8px}.alert h2{font-size:12px;font-weight:700;color:#C0392B;margin-bottom:10px;text-transform:uppercase}</style></head><body><h1>EDOM DECANTS</h1><p>Lista de Produção · ${date}</p><table><thead><tr><th>Produto</th><th>Volume</th><th>Canal</th></tr></thead><tbody>${rows}</tbody></table>${alerts.length>0?`<div class="alert"><h2>⚠ Estoque crítico</h2><table><tbody>${alertRows}</tbody></table></div>`:''}<p style="margin-top:32px;font-size:11px;color:#bbb">Gerado em ${new Date().toLocaleString('pt-BR')}</p></body></html>`
    const win = window.open('', '_blank')
    if (win) { win.document.write(html); win.document.close(); setTimeout(() => win.print(), 600) }
  }

  function removeItem(idx: number) { setItems(prev => prev.filter((_, i) => i !== idx)) }

  if (done) return (
    <div className="fade-in" style={{ maxWidth: 520, margin: '64px auto', textAlign: 'center' }}>
      <div style={{ fontSize: 44, marginBottom: 12, color: 'var(--success)' }}>✓</div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 300, marginBottom: 8, color: 'var(--t1)' }}>Lista finalizada</h2>
      <p style={{ color: 'var(--t3)', marginBottom: 32, fontSize: 14 }}>PDF aberto para impressão.</p>
      {lowAlerts.length > 0 && (
        <div style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: 12, padding: 18, marginBottom: 24, textAlign: 'left' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <AlertTriangle size={14} style={{ color: 'var(--danger)', flexShrink: 0 }} strokeWidth={2.2}/>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--danger)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Estoque crítico</span>
          </div>
          {lowAlerts.map(a => (
            <div key={a.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,59,48,0.08)', fontSize: 13 }}>
              <span style={{ color: 'var(--t1)' }}>{a.name}</span>
              <span style={{ color: 'var(--danger)', fontWeight: 600 }}>{Number(a.balance_ml).toFixed(1)}ml</span>
            </div>
          ))}
        </div>
      )}
      <button className="btn-gold" onClick={closeList}>Fechar lista</button>
    </div>
  )

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 32, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 34, fontWeight: 300, letterSpacing: '-0.02em', lineHeight: 1.15, color: 'var(--t1)' }}>
            Lista de produção
          </h1>
          <p style={{ color: 'var(--t3)', fontSize: 14, marginTop: 6, fontWeight: 400 }}>
            Lance os itens vendidos no dia e gere o PDF de produção
          </p>
        </div>
        {/* Badge indicando lista em aberto */}
        {items.length > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'var(--gold-bg)', border: '1px solid var(--gold-border)',
            borderRadius: 20, padding: '5px 12px', fontSize: 12, color: 'var(--gold)', fontWeight: 500,
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--gold)', display: 'inline-block' }}/>
            Lista em aberto · {items.length} {items.length === 1 ? 'item' : 'itens'}
          </div>
        )}
      </div>

      {/* ── ADD ITEM ── */}
      <div style={{ ...glass.card, padding: '22px 24px', marginBottom: 18, overflow: 'visible' }}>
        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--t3)', marginBottom: 16 }}>
          Adicionar item
        </p>

        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>

          {/* BUSCA */}
          <div style={{ flex: 2, minWidth: 220, position: 'relative' }}>
            <label className="label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              Produto
              <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'var(--t5)', fontSize: 10.5 }}>
                ↑↓ navegar · Enter / Tab selecionar
              </span>
            </label>
            <div style={{ position: 'relative' }}>
              <Search size={13} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--t4)', pointerEvents: 'none' }}/>
              <input
                ref={searchRef}
                style={{ ...glass.input, paddingLeft: 32 }}
                placeholder="Buscar produto…"
                value={search}
                onChange={e => { setSearch(e.target.value); setShowSugg(true); setSelProduct(null) }}
                onFocus={() => { if (search && !selProduct) setShowSugg(true) }}
                onBlur={onSearchBlur}
                onKeyDown={onSearchKey}
                autoComplete="off"
              />
            </div>
            {showSugg && suggs.length > 0 && (
              <div style={{ ...glass.dropdown }}>
                {suggs.map((p, idx) => (
                  <button key={p.id}
                    onMouseDown={() => selectProduct(p)}
                    onMouseEnter={() => setHiIdx(idx)}
                    style={{
                      display: 'block', width: '100%', textAlign: 'left',
                      padding: '10px 14px', border: 'none', cursor: 'pointer',
                      borderBottom: idx < suggs.length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none',
                      background: hiIdx === idx ? 'rgba(184,148,63,0.09)' : 'transparent',
                      fontFamily: 'var(--font-ui)', fontSize: 13.5, color: 'var(--t1)',
                      letterSpacing: '-0.01em', transition: 'background 0.08s',
                    }}>
                    <span style={{ fontWeight: hiIdx === idx ? 500 : 400 }}>{p.name}</span>
                    <span style={{ fontSize: 11.5, color: 'var(--t4)', marginLeft: 8, fontWeight: 400 }}>{p.brand}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* VOLUME */}
          <div style={{ minWidth: 120 }}>
            <label className="label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              Volume
              <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'var(--t5)', fontSize: 10.5 }}>↑↓ · Enter→canal</span>
            </label>
            <select
              ref={volumeRef}
              style={{ ...glass.input, cursor: 'pointer' }}
              value={volume}
              onChange={e => setVolume(e.target.value)}
              onKeyDown={onVolumeKey}
              tabIndex={0}>
              <option value="">—</option>
              {VOLUMES.map(v => <option key={v} value={v}>{v} ml</option>)}
            </select>
          </div>

          {/* CANAL */}
          <div style={{ minWidth: 148 }}>
            <label className="label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              Canal
              <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'var(--t5)', fontSize: 10.5 }}>↑↓ · Enter→add</span>
            </label>
            <select
              ref={channelRef}
              style={{ ...glass.input, cursor: 'pointer' }}
              value={channelId}
              onChange={e => setChannelId(e.target.value)}
              onKeyDown={onChannelKey}
              tabIndex={0}>
              <option value="">—</option>
              {channels.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* BOTÃO */}
          <div style={{ paddingBottom: 1 }}>
            <button
              ref={addBtnRef}
              className="btn-gold"
              onClick={addItem}
              onKeyDown={onAddBtnKey}
              disabled={!selProduct || !volume}
              tabIndex={0}>
              <Plus size={13}/> Adicionar
            </button>
          </div>
        </div>

        {/* Flow indicator */}
        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
          {[
            { label: 'Produto', key: false },
            { label: '→', key: false },
            { label: 'Enter / Tab', key: true },
            { label: '→ Volume ↑↓', key: false },
            { label: 'Enter', key: true },
            { label: '→ Canal ↑↓', key: false },
            { label: 'Enter', key: true },
            { label: '→ Adicionar', key: false },
            { label: 'Enter', key: true },
            { label: '→ reinicia', key: false },
          ].map((s, i) => (
            <span key={i} style={{
              fontFamily: 'var(--font-ui)',
              fontSize: s.key ? 10 : 11,
              fontWeight: s.key ? 600 : 400,
              color: s.key ? 'var(--gold)' : 'var(--t4)',
              padding: s.key ? '1px 5px' : undefined,
              background: s.key ? 'var(--gold-bg)' : undefined,
              borderRadius: s.key ? 5 : undefined,
              border: s.key ? '1px solid var(--gold-border)' : undefined,
            }}>{s.label}</span>
          ))}
        </div>
      </div>

      {/* ── ITEM LIST ── */}
      {items.length > 0 ? (
        <>
          <div style={{ ...glass.card, overflow: 'hidden', marginBottom: 14 }}>
            <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--t2)' }}>
                {items.length} {items.length === 1 ? 'item' : 'itens'}
              </span>
              <span style={{ fontSize: 11.5, color: 'var(--t4)' }}>
                Lista salva automaticamente
              </span>
            </div>
            <table>
              <thead>
                <tr>
                  <th style={{ width: 32 }}>#</th>
                  <th>Produto</th>
                  <th>Volume</th>
                  <th>Canal</th>
                  <th style={{ width: 40 }}></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ color: 'var(--t5)', fontSize: 11 }}>{idx + 1}</td>
                    <td style={{ fontWeight: 500 }}>{item.product_name}</td>
                    <td><span style={{ color: 'var(--gold)', fontWeight: 600 }}>{item.volume_ml}ml</span></td>
                    <td style={{ color: 'var(--t3)' }}>{item.channel_name}</td>
                    <td>
                      <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '3px 5px' }} onClick={() => removeItem(idx)}>
                        <Trash2 size={13} style={{ color: 'var(--danger)' }}/>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn-gold" onClick={finalize} disabled={saving} style={{ padding: '11px 26px', fontSize: 13.5 }}>
              <FileText size={14}/> {saving ? 'Finalizando…' : 'Finalizar e gerar PDF'}
            </button>
          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '52px 20px', color: 'var(--t4)' }}>
          <FileText size={28} style={{ opacity: .2, marginBottom: 10 }}/>
          <p style={{ fontSize: 14, fontWeight: 400 }}>Nenhum item adicionado ainda</p>
          <p style={{ fontSize: 12.5, marginTop: 4 }}>Busque um produto acima para começar</p>
        </div>
      )}
    </div>
  )
}
