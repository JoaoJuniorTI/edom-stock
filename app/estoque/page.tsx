'use client'
import { useEffect, useState } from 'react'
import { Plus, ChevronDown, ChevronUp, Settings } from 'lucide-react'

interface Product { id: number; name: string; brand: string; volumes: {volume_ml:number;price:number}[] }
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
  const [msg, setMsg] = useState('')
  const [search, setSearch] = useState('')

  async function load() {
    const [s, p] = await Promise.all([
      fetch('/api/stock').then(r=>r.json()),
      fetch('/api/products').then(r=>r.json()),
    ])
    setStock(s.stock || [])
    setProducts(p.products || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleEntry(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/stock', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({...form, product_id:Number(form.product_id), quantity_ml:Number(form.quantity_ml)})
    })
    const data = await res.json()
    if (data.success) {
      setMsg('Entrada registrada!'); setShowEntry(false); setForm({product_id:'',type:'inicial',quantity_ml:'',note:''})
      await load()
    } else { setMsg(data.error || 'Erro') }
    setSaving(false)
    setTimeout(() => setMsg(''), 3000)
  }

  async function handleThreshold(productId: number) {
    setSaving(true)
    await fetch('/api/stock', {
      method:'PATCH', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({product_id:productId, alert_ml:Number(thresholdVal)})
    })
    setShowThreshold(null); setThresholdVal('')
    await load(); setSaving(false)
  }

  const filtered = stock.filter(s => s.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="fade-in">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:32}}>
        <div>
          <h1 style={{fontSize:32,fontWeight:300,color:'var(--gold)',letterSpacing:'0.02em'}}>Estoque</h1>
          <p style={{color:'var(--text-muted)',fontSize:14,marginTop:4}}>Saldos, entradas e configurações de alerta</p>
        </div>
        <button className="btn-gold" onClick={()=>setShowEntry(!showEntry)}>
          <Plus size={14} style={{display:'inline',marginRight:6}}/> Nova entrada
        </button>
      </div>

      {msg && <div style={{marginBottom:16,padding:'10px 16px',background:'rgba(201,168,76,0.08)',border:'1px solid var(--border-hover)',borderRadius:6,color:'var(--gold)',fontSize:13}}>{msg}</div>}

      {/* Entry form */}
      {showEntry && (
        <div className="card" style={{padding:24,marginBottom:24}}>
          <h3 style={{fontSize:16,fontWeight:400,marginBottom:20}}>Registrar entrada de estoque</h3>
          <form onSubmit={handleEntry} style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:16}}>
            <div>
              <label className="label">Produto</label>
              <select className="input" value={form.product_id} onChange={e=>setForm({...form,product_id:e.target.value})} required>
                <option value="">Selecione...</option>
                {products.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Tipo</label>
              <select className="input" value={form.type} onChange={e=>setForm({...form,type:e.target.value})}>
                <option value="inicial">Estoque inicial</option>
                <option value="reposicao">Reposição</option>
              </select>
            </div>
            <div>
              <label className="label">Quantidade (ml)</label>
              <input type="number" className="input" placeholder="ex: 100" step="0.1" min="0.1"
                value={form.quantity_ml} onChange={e=>setForm({...form,quantity_ml:e.target.value})} required/>
            </div>
            <div>
              <label className="label">Nota (opcional)</label>
              <input type="text" className="input" placeholder="Observação..."
                value={form.note} onChange={e=>setForm({...form,note:e.target.value})}/>
            </div>
            <div style={{display:'flex',alignItems:'flex-end',gap:8}}>
              <button type="submit" className="btn-gold" disabled={saving}>{saving?'Salvando...':'Registrar'}</button>
              <button type="button" className="btn-ghost" onClick={()=>setShowEntry(false)}>Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {/* Search */}
      <div style={{marginBottom:16}}>
        <input className="input" placeholder="Buscar produto..." value={search} onChange={e=>setSearch(e.target.value)} style={{maxWidth:320}}/>
      </div>

      <div className="card">
        {loading ? (
          <div style={{padding:40,textAlign:'center',color:'var(--text-dim)'}}>Carregando...</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Saldo atual</th>
                  <th>Total entradas</th>
                  <th>Total saídas</th>
                  <th>Limiar de alerta</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(item => (
                  <>
                  <tr key={item.id}>
                    <td>
                      <div style={{fontWeight:400}}>{item.name}</div>
                      <div style={{fontSize:11,color:'var(--text-dim)'}}>{item.brand}</div>
                    </td>
                    <td style={{color:item.balance_ml<=0?'var(--danger)':item.is_low?'var(--warning)':'var(--text)',fontWeight:500,fontSize:15}}>
                      {Number(item.balance_ml).toFixed(1)} ml
                    </td>
                    <td style={{color:'var(--text-muted)'}}>{Number(item.total_in).toFixed(1)} ml</td>
                    <td style={{color:'var(--text-muted)'}}>{Number(item.total_out).toFixed(1)} ml</td>
                    <td style={{color:'var(--text-muted)'}}>
                      {item.alert_ml ? `${item.alert_ml} ml` : <span style={{color:'var(--text-dim)'}}>não definido</span>}
                    </td>
                    <td>
                      {item.is_low ? <span className="badge-low">Baixo</span>
                       : item.balance_ml <= 0 ? <span className="badge-low">Zerado</span>
                       : <span className="badge-ok">OK</span>}
                    </td>
                    <td>
                      <button className="btn-ghost" style={{padding:'6px 10px',fontSize:12,display:'flex',alignItems:'center',gap:4}}
                        onClick={()=>{setShowThreshold(showThreshold===item.id?null:item.id);setThresholdVal(String(item.alert_ml||''))}}>
                        <Settings size={12}/> Limiar
                      </button>
                    </td>
                  </tr>
                  {showThreshold===item.id && (
                    <tr key={`t-${item.id}`}>
                      <td colSpan={7} style={{background:'var(--bg3)',padding:'12px 16px'}}>
                        <div style={{display:'flex',alignItems:'center',gap:12}}>
                          <span style={{fontSize:13,color:'var(--text-muted)'}}>Alertar quando saldo ≤</span>
                          <input type="number" className="input" placeholder="ml" step="0.1" value={thresholdVal}
                            onChange={e=>setThresholdVal(e.target.value)} style={{width:100}}/>
                          <span style={{fontSize:13,color:'var(--text-muted)'}}>ml</span>
                          <button className="btn-gold" style={{padding:'8px 16px'}} onClick={()=>handleThreshold(item.id)} disabled={saving}>Salvar</button>
                          <button className="btn-ghost" style={{padding:'8px 16px'}} onClick={()=>setShowThreshold(null)}>Cancelar</button>
                        </div>
                      </td>
                    </tr>
                  )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
