'use client'
import { useEffect, useState } from 'react'
import { AlertTriangle, Package, TrendingDown, Activity } from 'lucide-react'

interface StockItem {
  id: number; name: string; brand: string; balance_ml: number;
  alert_ml: number | null; is_low: boolean;
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

  const lowItems = stock.filter(s => s.is_low)
  const criticalItems = stock.filter(s => s.days_left_7 !== null && s.days_left_7 < 7)
  const totalProducts = stock.length
  const withStock = stock.filter(s => s.balance_ml > 0).length

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 300, color: 'var(--gold)', letterSpacing: '0.02em' }}>
          Dashboard
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
          Visão geral do estoque Edom Decants
        </p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        {[
          { label: 'Total de produtos', value: totalProducts, icon: Package, color: 'var(--gold)' },
          { label: 'Com estoque', value: withStock, icon: Activity, color: 'var(--success)' },
          { label: 'Alertas ativos', value: lowItems.length, icon: AlertTriangle, color: lowItems.length > 0 ? 'var(--danger)' : 'var(--text-dim)' },
          { label: 'Críticos (< 7 dias)', value: criticalItems.length, icon: TrendingDown, color: criticalItems.length > 0 ? 'var(--warning)' : 'var(--text-dim)' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>{label}</span>
              <Icon size={16} style={{ color }} />
            </div>
            <div style={{ fontSize: 36, fontFamily: 'Cormorant Garamond, serif', color, fontWeight: 300 }}>{loading ? '—' : value}</div>
          </div>
        ))}
      </div>

      {/* Low stock alerts */}
      {lowItems.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 16, fontWeight: 400, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={16} color="var(--danger)" />
            Alertas de estoque baixo
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {lowItems.map(item => (
              <div key={item.id} className="card" style={{ padding: 16, borderColor: 'rgba(192,57,43,0.3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>{item.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.brand}</div>
                  </div>
                  <span className="badge-low">Baixo</span>
                </div>
                <div style={{ marginTop: 12, display: 'flex', gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Saldo</div>
                    <div style={{ fontSize: 20, fontFamily: 'Cormorant Garamond, serif', color: 'var(--danger)' }}>{Number(item.balance_ml).toFixed(1)}ml</div>
                  </div>
                  {item.alert_ml && (
                    <div>
                      <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Limiar</div>
                      <div style={{ fontSize: 20, fontFamily: 'Cormorant Garamond, serif', color: 'var(--text-muted)' }}>{item.alert_ml}ml</div>
                    </div>
                  )}
                  {item.days_left_7 !== null && (
                    <div>
                      <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Dura (7d)</div>
                      <div style={{ fontSize: 20, fontFamily: 'Cormorant Garamond, serif', color: item.days_left_7 < 7 ? 'var(--warning)' : 'var(--text)' }}>{item.days_left_7}d</div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent stock table */}
      <div>
        <h2 style={{ fontSize: 16, fontWeight: 400, marginBottom: 16 }}>Todos os produtos</h2>
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
                    <th>Média 30d (ml/dia)</th>
                    <th>Previsão 30d</th>
                    <th>Média 7d (ml/dia)</th>
                    <th>Previsão 7d</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stock.map(item => (
                    <tr key={item.id}>
                      <td>
                        <div style={{ fontWeight: 400 }}>{item.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{item.brand}</div>
                      </td>
                      <td style={{ color: item.balance_ml <= 0 ? 'var(--danger)' : 'var(--text)', fontWeight: 500 }}>
                        {Number(item.balance_ml).toFixed(1)}
                      </td>
                      <td style={{ color: 'var(--text-muted)' }}>{item.daily_avg_30 ? Number(item.daily_avg_30).toFixed(1) : '—'}</td>
                      <td>
                        {item.days_left_30 !== null
                          ? <span style={{ color: item.days_left_30 < 14 ? 'var(--warning)' : 'var(--success)' }}>{item.days_left_30} dias</span>
                          : <span style={{ color: 'var(--text-dim)' }}>sem dados</span>}
                      </td>
                      <td style={{ color: 'var(--text-muted)' }}>{item.daily_avg_7 ? Number(item.daily_avg_7).toFixed(1) : '—'}</td>
                      <td>
                        {item.days_left_7 !== null
                          ? <span style={{ color: item.days_left_7 < 7 ? 'var(--danger)' : item.days_left_7 < 14 ? 'var(--warning)' : 'var(--success)' }}>{item.days_left_7} dias</span>
                          : <span style={{ color: 'var(--text-dim)' }}>sem dados</span>}
                      </td>
                      <td>
                        {item.is_low
                          ? <span className="badge-low">Baixo</span>
                          : item.balance_ml <= 0
                          ? <span className="badge-low">Zerado</span>
                          : <span className="badge-ok">OK</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
