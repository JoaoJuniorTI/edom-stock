'use client'
import { useEffect, useState } from 'react'
import { AlertTriangle, Package, Activity, Clock } from 'lucide-react'

interface StockItem {
  id: number; name: string; brand: string; balance_ml: number;
  is_low: boolean; alert_days: number;
  days_left_30: number | null; days_left_7: number | null;
  daily_avg_30: number | null; daily_avg_7: number | null;
}

export default function Dashboard() {
  const [stock, setStock] = useState<StockItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/stock').then(r => r.json()).then(d => {
      setStock(d.stock || [])
      setLoading(false)
    })
  }, [])

  const lowItems     = stock.filter(s => s.is_low)
  const totalProducts = stock.length
  const withStock    = stock.filter(s => s.balance_ml > 0).length
  const noData       = stock.filter(s => s.days_left_7 === null && s.days_left_30 === null && s.balance_ml > 0)

  function bestForecast(item: StockItem) {
    return item.days_left_7 ?? item.days_left_30
  }

  function forecastColor(days: number | null) {
    if (days === null) return 'var(--text-dim)'
    if (days < 10)  return 'var(--danger)'
    if (days < 20)  return 'var(--warning)'
    return 'var(--success)'
  }

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 300, color: 'var(--gold)', letterSpacing: '0.02em' }}>
          Dashboard
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
          Visão geral do estoque · Alerta automático abaixo de 10 dias
        </p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        {[
          { label: 'Total de produtos', value: totalProducts, icon: Package, color: 'var(--gold)' },
          { label: 'Com estoque', value: withStock, icon: Activity, color: 'var(--success)' },
          { label: 'Abaixo de 10 dias', value: lowItems.length, icon: AlertTriangle, color: lowItems.length > 0 ? 'var(--danger)' : 'var(--text-dim)' },
          { label: 'Sem histórico ainda', value: noData.length, icon: Clock, color: noData.length > 0 ? 'var(--warning)' : 'var(--text-dim)' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>{label}</span>
              <Icon size={16} style={{ color }} />
            </div>
            <div style={{ fontSize: 36, fontFamily: 'Cormorant Garamond, serif', color, fontWeight: 300 }}>
              {loading ? '—' : value}
            </div>
          </div>
        ))}
      </div>

      {/* Alert banner */}
      {!loading && lowItems.length > 0 && (
        <div style={{ marginBottom: 28, padding: '14px 20px', background: 'var(--danger-light)', border: '1px solid rgba(192,57,43,0.35)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
          <AlertTriangle size={18} color="var(--danger)" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 14, color: '#E74C3C' }}>
            <strong>{lowItems.length} produto{lowItems.length > 1 ? 's' : ''}</strong> com menos de 10 dias de estoque —{' '}
            {lowItems.slice(0, 3).map(i => i.name).join(', ')}
            {lowItems.length > 3 ? ` e mais ${lowItems.length - 3}` : ''}.
          </span>
        </div>
      )}

      {/* Low stock cards */}
      {!loading && lowItems.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 15, fontWeight: 400, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={15} color="var(--danger)" /> Produtos críticos
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
            {lowItems
              .sort((a, b) => (bestForecast(a) ?? 999) - (bestForecast(b) ?? 999))
              .map(item => {
                const days = bestForecast(item)
                return (
                  <div key={item.id} className="card" style={{ padding: 16, borderColor: 'rgba(192,57,43,0.35)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 500 }}>{item.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>{item.brand}</div>
                      </div>
                      <span className="badge-low">Crítico</span>
                    </div>
                    <div style={{ display: 'flex', gap: 20 }}>
                      <div>
                        <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Saldo</div>
                        <div style={{ fontSize: 22, fontFamily: 'Cormorant Garamond, serif', color: 'var(--text)' }}>
                          {Number(item.balance_ml).toFixed(1)}<span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 2 }}>ml</span>
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Dura</div>
                        <div style={{ fontSize: 22, fontFamily: 'Cormorant Garamond, serif', color: forecastColor(days) }}>
                          {days !== null ? `${days}d` : '—'}
                        </div>
                      </div>
                      {item.days_left_7 !== null && item.days_left_30 !== null && item.days_left_7 < item.days_left_30 * 0.7 && (
                        <div>
                          <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tendência</div>
                          <div style={{ fontSize: 12, color: 'var(--warning)', marginTop: 4 }}>↑ acelerado</div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      )}

      {/* Full table */}
      <div>
        <h2 style={{ fontSize: 15, fontWeight: 400, marginBottom: 16 }}>Todos os produtos</h2>
        <div className="card">
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-dim)' }}>Carregando...</div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>Saldo (ml)</th>
                    <th>Previsão 30d</th>
                    <th>Previsão 7d</th>
                    <th>Melhor estimativa</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stock
                    .sort((a, b) => (bestForecast(a) ?? 9999) - (bestForecast(b) ?? 9999))
                    .map(item => {
                      const best = bestForecast(item)
                      return (
                        <tr key={item.id}>
                          <td>
                            <div style={{ fontWeight: 400 }}>{item.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{item.brand}</div>
                          </td>
                          <td style={{ fontWeight: 500 }}>
                            {Number(item.balance_ml).toFixed(1)}
                          </td>
                          <td style={{ color: forecastColor(item.days_left_30) }}>
                            {item.days_left_30 !== null ? `${item.days_left_30}d` : <span style={{ color: 'var(--text-dim)' }}>—</span>}
                          </td>
                          <td style={{ color: forecastColor(item.days_left_7) }}>
                            {item.days_left_7 !== null ? `${item.days_left_7}d` : <span style={{ color: 'var(--text-dim)' }}>—</span>}
                          </td>
                          <td>
                            {best !== null ? (
                              <span style={{ color: forecastColor(best), fontWeight: 500 }}>{best} dias</span>
                            ) : (
                              <span style={{ color: 'var(--text-dim)', fontSize: 12 }}>sem histórico</span>
                            )}
                          </td>
                          <td>
                            {item.balance_ml <= 0
                              ? <span className="badge-low">Zerado</span>
                              : item.is_low
                              ? <span className="badge-low">Crítico</span>
                              : best !== null && best < 20
                              ? <span className="badge-warn">Atenção</span>
                              : <span className="badge-ok">OK</span>}
                          </td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div style={{ marginTop: 16, display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        {[
          { color: 'var(--danger)', label: 'Crítico — menos de 10 dias' },
          { color: 'var(--warning)', label: 'Atenção — menos de 20 dias' },
          { color: 'var(--success)', label: 'OK — mais de 20 dias' },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
