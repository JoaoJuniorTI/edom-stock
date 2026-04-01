'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Package, TrendingUp, Clock, ArrowRight } from 'lucide-react'
import { SortableTable, Column } from '@/components/SortableTable'

interface StockItem { id:number;name:string;brand:string;balance_ml:number;is_low:boolean;days_left_30:number|null;days_left_7:number|null;daily_avg_30:number|null;daily_avg_7:number|null }

const best=(i:StockItem)=>i.days_left_7??i.days_left_30
function fColor(d:number|null){if(d===null)return'var(--t4)';if(d<10)return'var(--danger)';if(d<20)return'var(--warning)';return'var(--success)'}
function StatusBadge({item}:{item:StockItem}){
  const b=best(item)
  if(item.balance_ml<=0)return<span className="badge-low">Zerado</span>
  if(item.is_low)return<span className="badge-low">Crítico</span>
  if(b!==null&&b<20)return<span className="badge-warn">Atenção</span>
  return<span className="badge-ok">OK</span>
}

export default function Dashboard() {
  const [stock,setStock]=useState<StockItem[]>([])
  const [loading,setLoading]=useState(true)
  const router=useRouter()

  useEffect(()=>{fetch('/api/stock').then(r=>r.json()).then(d=>{setStock(d.stock||[]);setLoading(false)})}, [])

  const lowItems=stock.filter(s=>s.is_low)
  const withStock=stock.filter(s=>s.balance_ml>0).length
  const noData=stock.filter(s=>best(s)===null&&s.balance_ml>0).length
  const accel=stock.filter(s=>s.days_left_7!==null&&s.days_left_30!==null&&s.days_left_7<s.days_left_30*0.7).length

  const kpis=[
    { label:'Com estoque',       value:withStock,       icon:Package,       accent:'#B8943F', bg:'rgba(184,148,63,0.10)', route:'/estoque',            hint:'Ver estoque' },
    { label:'Abaixo de 10 dias', value:lowItems.length, icon:AlertTriangle, accent:lowItems.length>0?'#FF3B30':'#AEAEB2', bg:lowItems.length>0?'rgba(255,59,48,0.09)':'rgba(0,0,0,0.04)', route:'/previsao?f=critical',   hint:'Ver críticos' },
    { label:'Consumo acelerado', value:accel,           icon:TrendingUp,    accent:accel>0?'#FF9F0A':'#AEAEB2', bg:accel>0?'rgba(255,159,10,0.09)':'rgba(0,0,0,0.04)', route:'/previsao?f=accelerated', hint:'Ver previsão' },
    { label:'Sem histórico',     value:noData,          icon:Clock,         accent:noData>0?'#FF9F0A':'#AEAEB2', bg:noData>0?'rgba(255,159,10,0.09)':'rgba(0,0,0,0.04)', route:'/previsao',               hint:'Ver previsão' },
  ]

  const columns:Column<StockItem>[]=[
    {key:'name',label:'Produto',sortable:true,render:row=><div><div style={{fontWeight:500,fontSize:13.5,color:'var(--t1)'}}>{row.name}</div><div style={{fontSize:11.5,color:'var(--t4)',marginTop:2}}>{row.brand}</div></div>},
    {key:'balance_ml',label:'Saldo (ml)',sortable:true,getValue:row=>Number(row.balance_ml),render:row=><span style={{fontWeight:600,fontSize:14,color:row.balance_ml<=0?'var(--danger)':row.balance_ml<20?'var(--warning)':'var(--t1)'}}>{Number(row.balance_ml).toFixed(1)}</span>},
    {key:'days_left_30',label:'Previsão 30d',sortable:true,getValue:row=>row.days_left_30,render:row=>row.days_left_30!==null?<span style={{color:fColor(row.days_left_30),fontWeight:600}}>{row.days_left_30}d</span>:<span style={{color:'var(--t5)'}}>—</span>},
    {key:'days_left_7',label:'Previsão 7d',sortable:true,getValue:row=>row.days_left_7,render:row=>row.days_left_7!==null?<span style={{color:fColor(row.days_left_7),fontWeight:600}}>{row.days_left_7}d</span>:<span style={{color:'var(--t5)'}}>—</span>},
    {key:'best',label:'Melhor estimativa',sortable:true,getValue:row=>best(row),render:row=>{const b=best(row);return b!==null?<span style={{color:fColor(b),fontWeight:700,fontSize:14}}>{b} dias</span>:<span style={{color:'var(--t5)',fontSize:12,fontStyle:'italic'}}>sem histórico</span>}},
    {key:'status',label:'Status',sortable:true,getValue:row=>row.balance_ml<=0?0:row.is_low?1:(best(row)??99)<20?2:3,render:row=><StatusBadge item={row}/>},
  ]

  return(
    <div className="fade-in">
      <div style={{marginBottom:38}}>
        <h1>Dashboard</h1>
        <p style={{color:'var(--t3)',fontSize:14.5,marginTop:7,fontWeight:400}}>Visão geral · Alerta automático abaixo de <strong style={{color:'var(--danger)',fontWeight:600}}>10 dias</strong> de estoque</p>
      </div>

      {/* KPIs */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:16,marginBottom:32}}>
        {kpis.map(({label,value,icon:Icon,accent,bg,route,hint})=>(
          <div key={label} className="kpi-card" onClick={()=>router.push(route)}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20}}>
              <span style={{fontSize:11,fontWeight:700,letterSpacing:'0.07em',textTransform:'uppercase',color:'var(--t3)',lineHeight:1.4,maxWidth:120}}>{label}</span>
              <div style={{width:36,height:36,borderRadius:11,background:bg,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,border:`1px solid ${accent}22`}}>
                <Icon size={16} style={{color:accent}} strokeWidth={2}/>
              </div>
            </div>
            <div style={{fontFamily:'Playfair Display,serif',fontSize:46,color:accent,fontWeight:300,lineHeight:1,marginBottom:12}}>
              {loading?'—':value}
            </div>
            <div style={{display:'flex',alignItems:'center',gap:5,fontSize:12,color:'var(--t4)',fontWeight:500}}>
              {hint}<ArrowRight size={11} strokeWidth={2}/>
            </div>
          </div>
        ))}
      </div>

      {/* Alert */}
      {!loading&&lowItems.length>0&&(
        <div className="alert-banner" style={{marginBottom:28}}>
          <div style={{width:34,height:34,borderRadius:10,background:'rgba(255,59,48,0.13)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
            <AlertTriangle size={16} style={{color:'var(--danger)'}} strokeWidth={2.2}/>
          </div>
          <span style={{fontSize:13.5,color:'#C0392B',lineHeight:1.5}}>
            <strong style={{fontWeight:700}}>{lowItems.length} produto{lowItems.length>1?'s':''}</strong> com menos de 10 dias —{' '}
            {lowItems.sort((a,b)=>(best(a)??999)-(best(b)??999)).slice(0,4).map(i=>i.name).join(', ')}
            {lowItems.length>4?` e +${lowItems.length-4}`:''}
          </span>
        </div>
      )}

      {/* Table */}
      <div>
        <h2 style={{marginBottom:16}}>Todos os produtos</h2>
        <div className="card" style={{overflow:'hidden'}}>
          {loading
            ?<div style={{padding:56,textAlign:'center',color:'var(--t4)',fontSize:14}}>Carregando…</div>
            :stock.length===0
            ?<div style={{padding:56,textAlign:'center',color:'var(--t4)',fontSize:14,lineHeight:2}}>Nenhum produto encontrado.<br/><span style={{fontSize:12.5}}>Clique em "Sincronizar CSV" na barra lateral.</span></div>
            :<SortableTable columns={columns} data={stock} defaultSort="best" defaultDir="asc"/>}
        </div>
      </div>

      <div style={{marginTop:14,display:'flex',gap:22,flexWrap:'wrap'}}>
        {[{c:'var(--danger)',l:'Crítico — menos de 10 dias'},{c:'var(--warning)',l:'Atenção — menos de 20 dias'},{c:'var(--success)',l:'OK — mais de 20 dias'}].map(({c,l})=>(
          <div key={l} style={{display:'flex',alignItems:'center',gap:8}}>
            <div style={{width:8,height:8,borderRadius:'50%',background:c,flexShrink:0}}/>
            <span style={{fontSize:12,color:'var(--t3)',fontWeight:500}}>{l}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
