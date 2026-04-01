'use client'
import { useEffect, useState } from 'react'
import { TrendingDown, TrendingUp, AlertTriangle } from 'lucide-react'

interface StockItem {
  id: number; name: string; brand: string; application: string;
  balance_ml: number; alert_ml: number | null; is_low: boolean;
  days_left_30: number | null; days_left_7: number | null;
  daily_avg_30: number | null; daily_avg_7: number | null;
}

function DaysBar({ days }: { days: number | null }) {
  if (days === null) return <span style={{ color: 'var(--text-dim)', fontSize: 12 }}>sem dados</span>
  const color = days < 10 ? 'var(--danger)' : days < 20 ? 'var(--warning)' : 'var(--success)'
  const width = Math.min(100, (days / 60) * 100)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ flex: 1, height: 4, background: 'var(--bg4)', borderRadius: 2, minWidth: 80 }}>
        <div style={{ width: `${width}%`, height: '100%', background: color, borderRadius: 2, transition: 'width 0.4s' }} />
      </div>
      <span style={{ color, fontSize: 13, fontWeight: 500, minWidth: 50 }}>{days}d</span>
    </div>
  )
}

export default function PrevisaoPage() {
  const [stock, setStock] = useState<StockItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'critical' | 'low' | 'ok'>('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/stock').then(r => r.json()).then(d => {
      setStock(d.stock || [])
      setLoading(false)
    })
  }, [])

  const filtered = stock
    .filter(s => s.name.toLowerCase().includes(search.toLowerCase()))
    .filter(s => {
      const best = s.days_left_7 ?? s.days_left_30
      if (filter === 'critical') return best !== null && best < 10
      if (filter === 'low') return s.is_low
      if (filter === 'ok') return !s.is_low && s.balance_ml > 0
      return true
    })
    .sort((a, b) => {
      const da = a.days_left_7 ?? 9999
      const db = b.days_left_7 ?? 9999
      return da - db
    })

  const critical = stock.filter(s => {
    const best = s.days_left_7 ?? s.days_left_30
    return best !== null && best < 10
  })
  const accelerated = stock.filter(s =>
    s.days_left_7 !== null && s.days_left_30 !== null && s.days_left_7 < s.days_left_30 * 0.6
  )

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 300, color: 'var(--gold)', letterSpacing: '0.02em' }}>Previsão de estoque</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
          Duração estimada por produto · Comparativo 30 dias vs 7 dias
        </p>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 8 }}>Críticos (menos de 10d)</div>
          <div style={{ fontSize: 36, fontFamily: 'Cormorant Garamond, serif', color: critical.length > 0 ? 'var(--danger)' : 'var(--text-dim)' }}>{critical.length}</div>
        </div>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 8 }}>Consumo acelerado</div>
          <div style={{ fontSize: 36, fontFamily: 'Cormorant Garamond, serif', color: accelerated.length > 0 ? 'var(--warning)' : 'var(--text-dim)' }}>{accelerated.length}</div>
        </div>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 8 }}>Com previsão disponível</div>
          <div style={{ fontSize: 36, fontFamily: 'Cormorant Garamond, serif', color: 'var(--gold)' }}>
            {stock.filter(s => s.days_left_30 !== null).length}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <input className="input" placeholder="Buscar produto..." value={search}
          onChange={e => setSearch(e.target.value)} style={{ maxWidth: 260 }} />
        {(['all','critical','low','ok'] as const).map(f => (
          <button key={f} className={filter === f ? 'btn-outline' : 'btn-ghost'} onClick={() => setFilter(f)} style={{ padding: '8px 14px' }}>
            {f === 'all' ? 'Todos' : f === 'critical' ? '⚠ Críticos' : f === 'low' ? 'Baixo' : 'OK'}
          </button>
        ))}
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-dim)' }}>Carregando...</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Saldo</th>
                  <th>Média 30d</th>
                  <th>Previsão 30 dias</th>
                  <th>Média 7d</th>
                  <th>Previsão 7 dias</th>
                  <th>Tendência</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(item => {
                  const isAccelerated = item.days_left_7 !== null && item.days_left_30 !== null
                    && item.days_left_7 < item.days_left_30 * 0.6
                  return (
                    <tr key={item.id}>
                      <td>
                        <div style={{ fontWeight: 400 }}>{item.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{item.brand}</div>
                      </td>
                      <td>
                        <span style={{ color: item.balance_ml <= 0 ? 'var(--danger)' : 'var(--text)', fontWeight: 500 }}>
                          {Number(item.balance_ml).toFixed(1)} ml
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                        {item.daily_avg_30 ? `${Number(item.daily_avg_30).toFixed(1)} ml/d` : '—'}
                      </td>
                      <td style={{ minWidth: 160 }}>
                        <DaysBar days={item.days_left_30} />
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                        {item.daily_avg_7 ? `${Number(item.daily_avg_7).toFixed(1)} ml/d` : '—'}
                      </td>
                      <td style={{ minWidth: 160 }}>
                        <DaysBar days={item.days_left_7} />
                      </td>
                      <td>
                        {isAccelerated ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <TrendingUp size={14} color="var(--warning)" />
                            <span className="badge-warn">Acelerado</span>
                          </div>
                        ) : item.days_left_7 !== null && item.days_left_30 !== null && item.days_left_7 > item.days_left_30 * 1.2 ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <TrendingDown size={14} color="var(--success)" />
                            <span className="badge-ok">Desacelerado</span>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-dim)', fontSize: 12 }}>estável</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Legend */}
      <div style={{ marginTop: 20, display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        {[
        { color: 'var(--danger)', label: 'Menos de 10 dias' },
          { color: 'var(--warning)', label: '10 a 20 dias' },
          { color: 'var(--success)', label: 'Mais de 20 dias' },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 24, height: 4, background: color, borderRadius: 2 }} />
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
