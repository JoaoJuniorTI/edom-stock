'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { TrendingDown, TrendingUp } from 'lucide-react'
import { glass } from '@/lib/styles'
import { SortableTable, Column } from '@/components/SortableTable'

interface StockItem {
  id:number; name:string; brand:string; application:string;
  balance_ml:number; alert_ml:number|null; is_low:boolean;
  days_left_30:number|null; days_left_7:number|null;
  daily_avg_30:number|null; daily_avg_7:number|null;
}

function DaysBar({ days }: { days:number|null }) {
  if (days===null) return <span style={{color:'var(--text-dim)',fontSize:12}}>sem dados</span>
  const color = days<10?'var(--danger)':days<20?'var(--warning)':'var(--success)'
  const width = Math.min(100,(days/60)*100)
  return (
    <div style={{display:'flex',alignItems:'center',gap:10}}>
      <div style={{flex:1,height:3,background:'rgba(0,0,0,0.08)',borderRadius:2,minWidth:70}}>
        <div style={{width:`${width}%`,height:'100%',background:color,borderRadius:2,transition:'width 0.4s'}}/>
      </div>
      <span style={{color,fontSize:13,fontWeight:600,minWidth:40}}>{days}d</span>
    </div>
  )
}

function PrevisaoInner() {
  const [stock, setStock] = useState<StockItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all'|'critical'|'accelerated'|'ok'>('all')
  const [search, setSearch] = useState('')
  const params = useSearchParams()

  useEffect(() => {
    const f = params.get('f') as any
    if (f) setFilter(f)
    fetch('/api/stock').then(r=>r.json()).then(d=>{setStock(d.stock||[]);setLoading(false)})
  }, [])

  const best = (s: StockItem) => s.days_left_7 ?? s.days_left_30
  const isAccel = (s: StockItem) => s.days_left_7!==null && s.days_left_30!==null && s.days_left_7<s.days_left_30*0.7

  const filtered = stock
    .filter(s=>s.name.toLowerCase().includes(search.toLowerCase()))
    .filter(s=>{
      const b = best(s)
      if (filter==='critical')    return b!==null && b<10
      if (filter==='accelerated') return isAccel(s)
      if (filter==='ok')          return !s.is_low && s.balance_ml>0
      return true
    })

  const critical    = stock.filter(s=>{ const b=best(s); return b!==null&&b<10 }).length
  const accelerated = stock.filter(isAccel).length
  const withData    = stock.filter(s=>best(s)!==null).length

  const columns: Column<StockItem>[] = [
    { key:'name', label:'Produto', sortable:true,
      render:row=><div><div style={{fontWeight:500,fontSize:13}}>{row.name}</div><div style={{fontSize:11,color:'var(--text-dim)',marginTop:1}}>{row.brand}</div></div> },
    { key:'balance_ml', label:'Saldo', sortable:true, getValue:row=>Number(row.balance_ml),
      render:row=><span style={{fontWeight:600,color:row.balance_ml<=0?'var(--danger)':'var(--text)'}}>{Number(row.balance_ml).toFixed(1)} ml</span> },
    { key:'daily_avg_30', label:'Média 30d', sortable:true, getValue:row=>Number(row.daily_avg_30),
      render:row=>row.daily_avg_30?<span style={{color:'var(--text-muted)',fontSize:13}}>{Number(row.daily_avg_30).toFixed(1)} ml/d</span>:<span style={{color:'var(--text-dim)'}}>—</span> },
    { key:'days_left_30', label:'Previsão 30 dias', sortable:true, getValue:row=>row.days_left_30,
      render:row=><DaysBar days={row.days_left_30}/> },
    { key:'daily_avg_7', label:'Média 7d', sortable:true, getValue:row=>Number(row.daily_avg_7),
      render:row=>row.daily_avg_7?<span style={{color:'var(--text-muted)',fontSize:13}}>{Number(row.daily_avg_7).toFixed(1)} ml/d</span>:<span style={{color:'var(--text-dim)'}}>—</span> },
    { key:'days_left_7', label:'Previsão 7 dias', sortable:true, getValue:row=>row.days_left_7,
      render:row=><DaysBar days={row.days_left_7}/> },
    { key:'trend', label:'Tendência', sortable:true, getValue:row=>isAccel(row)?0:1,
      render:row=>isAccel(row)
        ?<div style={{display:'flex',alignItems:'center',gap:5}}><TrendingUp size={13} color="var(--warning)" strokeWidth={2}/><span className="badge-warn">Acelerado</span></div>
        :row.days_left_7!==null&&row.days_left_30!==null&&row.days_left_7>row.days_left_30*1.2
        ?<div style={{display:'flex',alignItems:'center',gap:5}}><TrendingDown size={13} color="var(--success)" strokeWidth={2}/><span className="badge-ok">Desacelerado</span></div>
        :<span style={{color:'var(--text-dim)',fontSize:12}}>estável</span> },
  ]

  return (
    <div className="fade-in">
      <div style={{marginBottom:36}}>
        <h1 style={{fontFamily:'var(--font-display)',fontSize:34,fontWeight:300,color:'var(--text)',letterSpacing:'-0.01em'}}>Previsão de estoque</h1>
        <p style={{color:'var(--text-muted)',fontSize:14,marginTop:6}}>Duração estimada · Comparativo 30 dias vs 7 dias</p>
      </div>

      {/* Summary */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(185px,1fr))',gap:16,marginBottom:32}}>
        {[
          {label:'Críticos (<10d)', value:critical,    color:critical>0?'var(--danger)':'var(--text-dim)'},
          {label:'Consumo acelerado',value:accelerated, color:accelerated>0?'var(--warning)':'var(--text-dim)'},
          {label:'Com previsão',    value:withData,     color:'var(--gold)'},
        ].map(({label,value,color})=>(
          <div key={label} className="kpi-card" style={{cursor:'default'}}>
            <div style={{fontFamily:'var(--font-system)',fontSize:11,textTransform:'uppercase',letterSpacing:'0.08em',color:'var(--text-muted)',fontWeight:600,marginBottom:14}}>{label}</div>
            <div style={{fontFamily:'var(--font-display)',fontSize:40,color,fontWeight:300}}>{loading?'—':value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
        <input style={{...glass.input, maxWidth:240}} placeholder="Buscar produto..." value={search} onChange={e=>setSearch(e.target.value)}/>
        {(['all','critical','accelerated','ok'] as const).map(f=>(
          <button key={f} className={filter===f?'btn-outline':'btn-ghost'} onClick={()=>setFilter(f)} style={{padding:'8px 14px'}}>
            {f==='all'?'Todos':f==='critical'?'Críticos':f==='accelerated'?'Acelerado':'OK'}
          </button>
        ))}
      </div>

      <div style={{...glass.card, overflow:'hidden'}}>
        {loading
          ? <div style={{padding:48,textAlign:'center',color:'var(--text-dim)',fontSize:14}}>Carregando…</div>
          : <SortableTable columns={columns} data={filtered} defaultSort="days_left_7" defaultDir="asc"/>}
      </div>

      <div style={{marginTop:14,display:'flex',gap:20,flexWrap:'wrap'}}>
        {[{color:'var(--danger)',label:'Menos de 10 dias'},{color:'var(--warning)',label:'10 a 20 dias'},{color:'var(--success)',label:'Mais de 20 dias'}].map(({color,label})=>(
          <div key={label} style={{display:'flex',alignItems:'center',gap:7}}>
            <div style={{width:7,height:7,borderRadius:'50%',background:color}}/>
            <span style={{fontFamily:'var(--font-system)',fontSize:11,color:'var(--text-muted)'}}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function PrevisaoPage() {
  return <Suspense fallback={<div style={{padding:48,textAlign:'center',color:'var(--text-dim)'}}>Carregando…</div>}><PrevisaoInner/></Suspense>
}
