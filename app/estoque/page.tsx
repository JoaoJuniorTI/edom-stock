'use client'
import { useEffect, useState } from 'react'
import { Plus, Settings } from 'lucide-react'
import { SortableTable, Column } from '@/components/SortableTable'
import { glass } from '@/lib/styles'

interface Product { id: number; name: string; brand: string }
interface StockItem { id:number; name:string; brand:string; balance_ml:number; total_in:number; total_out:number; alert_ml:number|null; is_low:boolean }

export default function EstoquePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [stock, setStock] = useState<StockItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showEntry, setShowEntry] = useState(false)
  const [showThreshold, setShowThreshold] = useState<number|null>(null)
  const [form, setForm] = useState({ product_id:'', type:'inicial', quantity_ml:'', note:'' })
  const [thresholdVal, setThresholdVal] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState({ text:'', ok:true })
  const [search, setSearch] = useState('')

  async function load() {
    const [s, p] = await Promise.all([
      fetch('/api/stock').then(r=>r.json()),
      fetch('/api/products').then(r=>r.json()),
    ])
    setStock(s.stock||[]); setProducts(p.products||[]); setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleEntry(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    const res = await fetch('/api/stock', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({...form, product_id:Number(form.product_id), quantity_ml:Number(form.quantity_ml)}) })
    const data = await res.json()
    if (data.success) { setMsg({text:'Entrada registrada!',ok:true}); setShowEntry(false); setForm({product_id:'',type:'inicial',quantity_ml:'',note:''}); await load() }
    else { setMsg({text:data.error||'Erro',ok:false}) }
    setSaving(false); setTimeout(()=>setMsg({text:'',ok:true}),3000)
  }

  async function handleThreshold(productId: number) {
    setSaving(true)
    await fetch('/api/stock',{ method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({product_id:productId, alert_ml:Number(thresholdVal)}) })
    setShowThreshold(null); setThresholdVal(''); await load(); setSaving(false)
  }

  const columns: Column<StockItem>[] = [
    {
      key:'name', label:'Produto', sortable:true,
      render: row => (
        <div>
          <div style={{fontWeight:500,fontSize:13}}>{row.name}</div>
          <div style={{fontSize:11,color:'var(--text-dim)',marginTop:1}}>{row.brand}</div>
        </div>
      ),
    },
    { key:'balance_ml', label:'Saldo atual', sortable:true, getValue:row=>Number(row.balance_ml),
      render:row=><span style={{fontWeight:600,color:row.balance_ml<=0?'var(--danger)':row.is_low?'var(--warning)':'var(--text)'}}>{Number(row.balance_ml).toFixed(1)} ml</span> },
    { key:'total_in',  label:'Total entradas', sortable:true, getValue:row=>Number(row.total_in),  render:row=><span style={{color:'var(--text-muted)'}}>{Number(row.total_in).toFixed(1)} ml</span> },
    { key:'total_out', label:'Total saídas',   sortable:true, getValue:row=>Number(row.total_out), render:row=><span style={{color:'var(--text-muted)'}}>{Number(row.total_out).toFixed(1)} ml</span> },
    { key:'alert_ml',  label:'Limiar alerta',  sortable:true, getValue:row=>row.alert_ml,
      render:row=>row.alert_ml ? <span style={{color:'var(--text-muted)'}}>{row.alert_ml} ml</span> : <span style={{color:'var(--text-dim)',fontSize:12}}>não definido</span> },
    { key:'is_low', label:'Status', sortable:true, getValue:row=>row.is_low?0:1,
      render:row=>row.is_low?<span className="badge-low">Baixo</span>:row.balance_ml<=0?<span className="badge-low">Zerado</span>:<span className="badge-ok">OK</span> },
    { key:'actions', label:'', sortable:false,
      render:row=>(
        <button className="btn-ghost" style={{padding:'6px 10px',fontSize:12,display:'flex',alignItems:'center',gap:4}}
          onClick={()=>{setShowThreshold(showThreshold===row.id?null:row.id);setThresholdVal(String(row.alert_ml||''))}}>
          <Settings size={12}/> Limiar
        </button>
      ),
    },
  ]

  const filtered = stock.filter(s=>s.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="fade-in">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:32}}>
        <div>
          <h1 style={{fontFamily:'var(--font-display)',fontSize:34,fontWeight:300,color:'var(--text)',letterSpacing:'-0.01em'}}>Estoque</h1>
          <p style={{color:'var(--text-muted)',fontSize:14,marginTop:6}}>Saldos, entradas e configurações de alerta</p>
        </div>
        <button className="btn-gold" onClick={()=>setShowEntry(!showEntry)}><Plus size={14} style={{display:'inline',marginRight:6}}/>Nova entrada</button>
      </div>

      {msg.text && <div style={{marginBottom:16,padding:'10px 16px',background:msg.ok?'var(--success-bg)':'var(--danger-bg)',border:`1px solid ${msg.ok?'var(--success-border)':'var(--danger-border)'}`,borderRadius:10,color:msg.ok?'#1D9641':'var(--danger)',fontSize:13}}>{msg.text}</div>}

      {showEntry && (
        <div style={{...glass.card, padding:24,marginBottom:24}}>
          <h3 style={{fontFamily:'var(--font-display)',fontSize:18,fontWeight:400,marginBottom:20}}>Registrar entrada de estoque</h3>
          <form onSubmit={handleEntry} style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:16}}>
            <div><label className="label">Produto</label>
              <select style={{...glass.input}} value={form.product_id} onChange={e=>setForm({...form,product_id:e.target.value})} required>
                <option value="">Selecione...</option>
                {products.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
              </select></div>
            <div><label className="label">Tipo</label>
              <select style={{...glass.input}} value={form.type} onChange={e=>setForm({...form,type:e.target.value})}>
                <option value="inicial">Estoque inicial</option>
                <option value="reposicao">Reposição</option>
              </select></div>
            <div><label className="label">Quantidade (ml)</label>
              <input type="number" style={{...glass.input}} placeholder="ex: 100" step="0.1" min="0.1" value={form.quantity_ml} onChange={e=>setForm({...form,quantity_ml:e.target.value})} required/></div>
            <div><label className="label">Nota (opcional)</label>
              <input type="text" style={{...glass.input}} placeholder="Observação..." value={form.note} onChange={e=>setForm({...form,note:e.target.value})}/></div>
            <div style={{display:'flex',alignItems:'flex-end',gap:8}}>
              <button type="submit" className="btn-gold" disabled={saving}>{saving?'Salvando...':'Registrar'}</button>
              <button type="button" className="btn-ghost" onClick={()=>setShowEntry(false)}>Cancelar</button>
            </div>
          </form>
        </div>
      )}

      <div style={{marginBottom:16}}>
        <input style={{...glass.input, maxWidth:320}} placeholder="Buscar produto..." value={search} onChange={e=>setSearch(e.target.value)}/>
      </div>

      <div style={{...glass.card, overflow:'hidden'}}>
        {loading
          ? <div style={{padding:48,textAlign:'center',color:'var(--text-dim)',fontSize:14}}>Carregando…</div>
          : <>
            <SortableTable columns={columns} data={filtered} defaultSort="balance_ml" defaultDir="asc"/>
            {/* Inline threshold editor */}
            {showThreshold!==null && (
              <div style={{padding:'14px 20px',background:'rgba(168,132,44,0.04)',borderTop:'1px solid var(--border)'}}>
                <div style={{display:'flex',alignItems:'center',gap:12,flexWrap:'wrap'}}>
                  <span style={{fontSize:13,color:'var(--text-muted)'}}>
                    Alertar <strong style={{color:'var(--text)'}}>
                      {stock.find(s=>s.id===showThreshold)?.name}
                    </strong> quando saldo ≤
                  </span>
                  <input type="number" style={{...glass.input, width:90}} placeholder="ml" step="0.1" value={thresholdVal} onChange={e=>setThresholdVal(e.target.value)}/>
                  <span style={{fontSize:13,color:'var(--text-muted)'}}>ml</span>
                  <button className="btn-gold" style={{padding:'8px 16px'}} onClick={()=>handleThreshold(showThreshold)} disabled={saving}>Salvar</button>
                  <button className="btn-ghost" style={{padding:'8px 16px'}} onClick={()=>setShowThreshold(null)}>Cancelar</button>
                </div>
              </div>
            )}
          </>
        }
      </div>
    </div>
  )
}
