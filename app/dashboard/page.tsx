'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Package, Activity, Clock, TrendingUp } from 'lucide-react'
import { SortableTable, Column } from '@/components/SortableTable'

interface StockItem {
  id: number; name: string; brand: string; balance_ml: number;
  is_low: boolean; days_left_30: number|null; days_left_7: number|null;
  daily_avg_30: number|null; daily_avg_7: number|null;
}

const best = (i: StockItem) => i.days_left_7 ?? i.days_left_30

function fColor(d: number|null) {
  if (d===null) return 'var(--text-dim)'
  if (d<10) return 'var(--danger)'
  if (d<20) return 'var(--warning)'
  return 'var(--success)'
}

function StatusBadge({ item }: { item: StockItem }) {
  const b = best(item)
  if (item.balance_ml <= 0) return <span className="badge-low">Zerado</span>
  if (item.is_low)          return <span className="badge-low">Crítico</span>
  if (b !== null && b < 20) return <span className="badge-warn">Atenção</span>
  return <span className="badge-ok">OK</span>
}

export default function Dashboard() {
  const [stock, setStock] = useState<StockItem[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetch('/api/stock').then(r => r.json()).then(d => {
      setStock(d.stock || [])
      setLoading(false)
    })
  }, [])

  const lowItems    = stock.filter(s => s.is_low)
  const withStock   = stock.filter(s => s.balance_ml > 0).length
  const noData      = stock.filter(s => best(s) === null && s.balance_ml > 0).length
  const accelerated = stock.filter(s =>
    s.days_left_7 !== null && s.days_left_30 !== null && s.days_left_7 < s.days_left_30 * 0.7
  ).length

  const kpis = [
    { label: 'Com estoque',       value: withStock,       icon: Package,       color: '#A8842C', filter: 'estoque',    hint: 'Ver estoque' },
    { label: 'Abaixo de 10 dias', value: lowItems.length, icon: AlertTriangle, color: lowItems.length > 0 ? '#FF3B30' : '#AEAEB2', filter: 'critico', hint: 'Ver críticos' },
    { label: 'Consumo acelerado', value: accelerated,     icon: TrendingUp,    color: accelerated > 0 ? '#FF9500' : '#AEAEB2', filter: 'acelerado', hint: 'Ver previsão' },
    { label: 'Sem histórico',     value: noData,          icon: Clock,         color: noData > 0 ? '#FF9500' : '#AEAEB2', filter: 'previsao', hint: 'Ver previsão' },
  ]

  function handleKpiClick(filter: string) {
    if (filter === 'estoque')   router.push('/estoque')
    if (filter === 'critico')   router.push('/previsao?f=critical')
    if (filter === 'acelerado') router.push('/previsao?f=accelerated')
    if (filter === 'previsao')  router.push('/previsao')
  }

  const columns: Column<StockItem>[] = [
    {
      key: 'name', label: 'Produto', sortable: true,
      render: row => (
        <div>
          <div style={{ fontWeight: 500, fontSize: 13 }}>{row.name}</div>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 1 }}>{row.brand}</div>
        </div>
      ),
    },
    {
      key: 'balance_ml', label: 'Saldo (ml)', sortable: true,
      getValue: row => Number(row.balance_ml),
      render: row => <span style={{ fontWeight: 500 }}>{Number(row.balance_ml).toFixed(1)}</span>,
    },
    {
      key: 'days_left_30', label: 'Previsão 30d', sortable: true,
      getValue: row => row.days_left_30,
      render: row => row.days_left_30 !== null
        ? <span style={{ color: fColor(row.days_left_30) }}>{row.days_left_30}d</span>
        : <span style={{ color: 'var(--text-dim)' }}>—</span>,
    },
    {
      key: 'days_left_7', label: 'Previsão 7d', sortable: true,
      getValue: row => row.days_left_7,
      render: row => row.days_left_7 !== null
        ? <span style={{ color: fColor(row.days_left_7) }}>{row.days_left_7}d</span>
        : <span style={{ color: 'var(--text-dim)' }}>—</span>,
    },
    {
      key: 'best', label: 'Melhor estimativa', sortable: true,
      getValue: row => best(row),
      render: row => {
        const b = best(row)
        return b !== null
          ? <span style={{ color: fColor(b), fontWeight: 500 }}>{b} dias</span>
          : <span style={{ color: 'var(--text-dim)', fontSize: 12 }}>sem histórico</span>
      },
    },
    {
      key: 'status', label: 'Status', sortable: true,
      getValue: row => row.balance_ml <= 0 ? 0 : row.is_low ? 1 : (best(row) ?? 99) < 20 ? 2 : 3,
      render: row => <StatusBadge item={row} />,
    },
  ]

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 36 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 34, fontWeight: 300, color: 'var(--text)', letterSpacing: '-0.01em', lineHeight: 1.15 }}>
          Dashboard
        </h1>
        <p style={{ fontFamily: 'var(--font-system)', color: 'var(--text-muted)', fontSize: 14, marginTop: 6, fontWeight: 400 }}>
          Visão geral · Alerta automático abaixo de 10 dias de estoque
        </p>
      </div>

      {/* KPI Cards — clicáveis */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(195px,1fr))', gap: 16, marginBottom: 32 }}>
        {kpis.map(({ label, value, icon: Icon, color, filter, hint }) => (
          <div key={label} className="kpi-card" onClick={() => handleKpiClick(filter)} title={hint}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
              <span style={{ fontFamily: 'var(--font-system)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', fontWeight: 600, lineHeight: 1.3 }}>{label}</span>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: `${color}16`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={15} style={{ color }} strokeWidth={1.8} />
              </div>
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 42, color, fontWeight: 300, lineHeight: 1 }}>
              {loading ? '—' : value}
            </div>
            <div style={{ fontFamily: 'var(--font-system)', fontSize: 11, color: 'var(--text-dim)', marginTop: 8, fontWeight: 400 }}>{hint} →</div>
          </div>
        ))}
      </div>

      {/* Alert banner */}
      {!loading && lowItems.length > 0 && (
        <div style={{ marginBottom: 28, padding: '14px 18px', background: 'rgba(255,59,48,0.07)', border: '1px solid rgba(255,59,48,0.18)', borderRadius: 14, display: 'flex', alignItems: 'center', gap: 12, backdropFilter: 'blur(8px)' }}>
          <div style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(255,59,48,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <AlertTriangle size={15} style={{ color: 'var(--danger)' }} strokeWidth={2} />
          </div>
          <span style={{ fontFamily: 'var(--font-system)', fontSize: 13, color: '#C0392B', lineHeight: 1.5 }}>
            <strong style={{ fontWeight: 600 }}>{lowItems.length} produto{lowItems.length > 1 ? 's' : ''}</strong> com menos de 10 dias —{' '}
            {lowItems.sort((a,b) => (best(a)??999)-(best(b)??999)).slice(0,4).map(i => i.name).join(', ')}
            {lowItems.length > 4 ? ` e mais ${lowItems.length - 4}` : ''}.
          </span>
        </div>
      )}

      {/* Tabela ordenável */}
      <div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 400, marginBottom: 16, color: 'var(--text)' }}>Todos os produtos</h2>
        <div className="card" style={{ overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-dim)', fontFamily: 'var(--font-system)', fontSize: 14 }}>Carregando…</div>
          ) : stock.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-dim)', fontFamily: 'var(--font-system)', fontSize: 14 }}>
              Nenhum produto encontrado.<br/>
              <span style={{ fontSize: 12, marginTop: 4, display: 'block' }}>Clique em "Sincronizar CSV" na barra lateral.</span>
            </div>
          ) : (
            <SortableTable
              columns={columns}
              data={stock}
              defaultSort="best"
              defaultDir="asc"
            />
          )}
        </div>
      </div>

      {/* Legend */}
      <div style={{ marginTop: 14, display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        {[
          { color: 'var(--danger)',  label: 'Crítico — menos de 10 dias' },
          { color: 'var(--warning)', label: 'Atenção — menos de 20 dias' },
          { color: 'var(--success)', label: 'OK — mais de 20 dias' },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: color }} />
            <span style={{ fontFamily: 'var(--font-system)', fontSize: 11, color: 'var(--text-muted)' }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
