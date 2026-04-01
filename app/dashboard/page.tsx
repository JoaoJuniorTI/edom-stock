'use client'
import { useEffect, useState } from 'react'
import { AlertTriangle, Package, Activity, Clock, TrendingUp } from 'lucide-react'

interface StockItem {
  id: number; name: string; brand: string; balance_ml: number;
  is_low: boolean; days_left_30: number|null; days_left_7: number|null;
  daily_avg_30: number|null; daily_avg_7: number|null;
}

function bestForecast(i: StockItem) { return i.days_left_7 ?? i.days_left_30 }

function forecastColor(d: number|null) {
  if (d===null) return '#AEAEB2'
  if (d<10)  return '#FF3B30'
  if (d<20)  return '#FF9500'
  return '#34C759'
}

function StatusBadge({ item }: { item: StockItem }) {
  const best = bestForecast(item)
  if (item.balance_ml<=0) return <span className="badge-low">Zerado</span>
  if (item.is_low)        return <span className="badge-low">Crítico</span>
  if (best!==null && best<20) return <span className="badge-warn">Atenção</span>
  return <span className="badge-ok">OK</span>
}

export default function Dashboard() {
  const [stock, setStock] = useState<StockItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/stock').then(r=>r.json()).then(d => {
      setStock(d.stock||[])
      setLoading(false)
    })
  }, [])

  const lowItems      = stock.filter(s => s.is_low)
  const withStock     = stock.filter(s => s.balance_ml>0).length
  const noData        = stock.filter(s => bestForecast(s)===null && s.balance_ml>0).length
  const accelerated   = stock.filter(s =>
    s.days_left_7!==null && s.days_left_30!==null && s.days_left_7 < s.days_left_30*0.7
  ).length

  const kpis = [
    { label:'Com estoque',       value: withStock,        icon: Package,       color:'#A8842C' },
    { label:'Abaixo de 10 dias', value: lowItems.length,  icon: AlertTriangle, color: lowItems.length>0?'#FF3B30':'#AEAEB2' },
    { label:'Consumo acelerado', value: accelerated,      icon: TrendingUp,    color: accelerated>0?'#FF9500':'#AEAEB2' },
    { label:'Sem histórico',     value: noData,           icon: Clock,         color: noData>0?'#FF9500':'#AEAEB2' },
  ]

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ marginBottom:36 }}>
        <h1 style={{ fontFamily:'Playfair Display,serif', fontSize:34, fontWeight:300, color:'#1C1C1E', letterSpacing:'-0.01em', lineHeight:1.15 }}>
          Dashboard
        </h1>
        <p style={{ fontFamily:'Geist,sans-serif', color:'#6E6E73', fontSize:14, marginTop:6, fontWeight:300 }}>
          Visão geral · Alerta automático abaixo de 10 dias de estoque
        </p>
      </div>

      {/* KPI row */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(195px,1fr))', gap:16, marginBottom:32 }}>
        {kpis.map(({ label, value, icon:Icon, color }) => (
          <div key={label} className="kpi-card">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
              <span style={{ fontFamily:'Geist,sans-serif', fontSize:11, textTransform:'uppercase', letterSpacing:'0.08em', color:'#6E6E73', fontWeight:500 }}>{label}</span>
              <div style={{ width:32, height:32, borderRadius:10, background:`${color}14`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Icon size={15} style={{ color }} strokeWidth={1.8}/>
              </div>
            </div>
            <div style={{ fontFamily:'Playfair Display,serif', fontSize:40, color, fontWeight:300, lineHeight:1 }}>
              {loading ? '—' : value}
            </div>
          </div>
        ))}
      </div>

      {/* Alert banner */}
      {!loading && lowItems.length>0 && (
        <div style={{ marginBottom:28, padding:'14px 18px', background:'rgba(255,59,48,0.07)', border:'1px solid rgba(255,59,48,0.18)', borderRadius:14, display:'flex', alignItems:'center', gap:12, backdropFilter:'blur(8px)' }}>
          <div style={{ width:32, height:32, borderRadius:10, background:'rgba(255,59,48,0.12)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <AlertTriangle size={16} style={{ color:'#FF3B30' }} strokeWidth={1.8}/>
          </div>
          <span style={{ fontFamily:'Geist,sans-serif', fontSize:13, color:'#C0392B', fontWeight:400, lineHeight:1.5 }}>
            <strong style={{ fontWeight:500 }}>{lowItems.length} produto{lowItems.length>1?'s':''}</strong> com menos de 10 dias de estoque —{' '}
            {lowItems.sort((a,b)=>(bestForecast(a)??999)-(bestForecast(b)??999)).slice(0,4).map(i=>i.name).join(', ')}
            {lowItems.length>4?` e mais ${lowItems.length-4}` : ''}.
          </span>
        </div>
      )}

      {/* Critical cards */}
      {!loading && lowItems.length>0 && (
        <div style={{ marginBottom:36 }}>
          <h2 style={{ fontFamily:'Playfair Display,serif', fontSize:18, fontWeight:400, marginBottom:16, color:'#1C1C1E' }}>Produtos críticos</h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:14 }}>
            {lowItems
              .sort((a,b)=>(bestForecast(a)??999)-(bestForecast(b)??999))
              .map(item => {
                const best = bestForecast(item)
                return (
                  <div key={item.id} className="card" style={{ padding:18, borderColor:'rgba(255,59,48,0.2)' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
                      <div>
                        <div style={{ fontFamily:'Geist,sans-serif', fontSize:13, fontWeight:500, color:'#1C1C1E', marginBottom:2 }}>{item.name}</div>
                        <div style={{ fontFamily:'Geist,sans-serif', fontSize:11, color:'#AEAEB2' }}>{item.brand}</div>
                      </div>
                      <span className="badge-low">Crítico</span>
                    </div>
                    <div style={{ display:'flex', gap:20 }}>
                      <div>
                        <div style={{ fontFamily:'Geist,sans-serif', fontSize:10, color:'#AEAEB2', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:4 }}>Saldo</div>
                        <div style={{ fontFamily:'Playfair Display,serif', fontSize:22, color:'#1C1C1E', fontWeight:300 }}>
                          {Number(item.balance_ml).toFixed(1)}<span style={{ fontSize:12, color:'#6E6E73', marginLeft:2 }}>ml</span>
                        </div>
                      </div>
                      <div>
                        <div style={{ fontFamily:'Geist,sans-serif', fontSize:10, color:'#AEAEB2', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:4 }}>Dura</div>
                        <div style={{ fontFamily:'Playfair Display,serif', fontSize:22, color:forecastColor(best), fontWeight:300 }}>
                          {best!==null ? `${best}d` : '—'}
                        </div>
                      </div>
                      {item.days_left_7!==null && item.days_left_30!==null && item.days_left_7<item.days_left_30*0.7 && (
                        <div>
                          <div style={{ fontFamily:'Geist,sans-serif', fontSize:10, color:'#AEAEB2', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:4 }}>Ritmo</div>
                          <div style={{ fontFamily:'Geist,sans-serif', fontSize:12, color:'#FF9500', marginTop:4, display:'flex', alignItems:'center', gap:4 }}>
                            <TrendingUp size={12} strokeWidth={2}/> acelerado
                          </div>
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
        <h2 style={{ fontFamily:'Playfair Display,serif', fontSize:18, fontWeight:400, marginBottom:16, color:'#1C1C1E' }}>Todos os produtos</h2>
        <div className="card" style={{ overflow:'hidden' }}>
          {loading ? (
            <div style={{ padding:48, textAlign:'center', color:'#AEAEB2', fontFamily:'Geist,sans-serif', fontSize:14 }}>Carregando…</div>
          ) : stock.length===0 ? (
            <div style={{ padding:48, textAlign:'center', color:'#AEAEB2', fontFamily:'Geist,sans-serif', fontSize:14 }}>
              Nenhum produto encontrado.<br/>
              <span style={{ fontSize:12, marginTop:4, display:'block' }}>Clique em "Sincronizar CSV" na barra lateral.</span>
            </div>
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
                    .sort((a,b)=>(bestForecast(a)??9999)-(bestForecast(b)??9999))
                    .map(item => {
                      const best = bestForecast(item)
                      return (
                        <tr key={item.id}>
                          <td>
                            <div style={{ fontFamily:'Geist,sans-serif', fontWeight:400, fontSize:13 }}>{item.name}</div>
                            <div style={{ fontFamily:'Geist,sans-serif', fontSize:11, color:'#AEAEB2', marginTop:1 }}>{item.brand}</div>
                          </td>
                          <td style={{ fontFamily:'Geist,sans-serif', fontWeight:500, fontSize:13 }}>
                            {Number(item.balance_ml).toFixed(1)}
                          </td>
                          <td style={{ fontFamily:'Geist,sans-serif', color: forecastColor(item.days_left_30), fontSize:13 }}>
                            {item.days_left_30!==null ? `${item.days_left_30}d` : <span style={{ color:'#AEAEB2' }}>—</span>}
                          </td>
                          <td style={{ fontFamily:'Geist,sans-serif', color: forecastColor(item.days_left_7), fontSize:13 }}>
                            {item.days_left_7!==null ? `${item.days_left_7}d` : <span style={{ color:'#AEAEB2' }}>—</span>}
                          </td>
                          <td>
                            {best!==null
                              ? <span style={{ fontFamily:'Playfair Display,serif', fontSize:16, color:forecastColor(best), fontWeight:400 }}>{best} dias</span>
                              : <span style={{ fontFamily:'Geist,sans-serif', color:'#AEAEB2', fontSize:12 }}>sem histórico</span>}
                          </td>
                          <td><StatusBadge item={item}/></td>
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
      <div style={{ marginTop:16, display:'flex', gap:20, flexWrap:'wrap' }}>
        {[
          { color:'#FF3B30', label:'Crítico — menos de 10 dias' },
          { color:'#FF9500', label:'Atenção — menos de 20 dias' },
          { color:'#34C759', label:'OK — mais de 20 dias' },
        ].map(({ color, label }) => (
          <div key={label} style={{ display:'flex', alignItems:'center', gap:7 }}>
            <div style={{ width:7, height:7, borderRadius:'50%', background:color, flexShrink:0 }}/>
            <span style={{ fontFamily:'Geist,sans-serif', fontSize:11, color:'#6E6E73' }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
