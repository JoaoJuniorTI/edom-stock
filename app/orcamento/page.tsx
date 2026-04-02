'use client'
import { useEffect, useState, useRef } from 'react'
import { glass } from '@/lib/styles'
import { Plus, Trash2, FileText, Search, User, Truck } from 'lucide-react'

interface Product { id:number;name:string;brand:string;volumes:{volume_ml:number;price:number}[] }
interface QuoteItem { product_id:number;product_name:string;brand:string;volume_ml:number;price:number }

export default function OrcamentoPage() {
  const [products,setProducts]=useState<Product[]>([])
  const [items,setItems]=useState<QuoteItem[]>([])
  const [clientName,setClientName]=useState('')
  const [clientContact,setClientContact]=useState('')
  const [search,setSearch]=useState('')
  const [showSugg,setShowSugg]=useState(false)
  const [selProduct,setSelProduct]=useState<Product|null>(null)
  const [selVolume,setSelVolume]=useState('')
  const [note,setNote]=useState('')
  const [freteValor,setFreteValor]=useState('')
  const [freteTransp,setFreteTransp]=useState('')
  const searchRef=useRef<HTMLInputElement>(null)

  useEffect(()=>{fetch('/api/products').then(r=>r.json()).then(d=>setProducts(d.products||[]))}, [])

  const suggs=products.filter(p=>search.length>1&&p.name.toLowerCase().includes(search.toLowerCase())).slice(0,8)

  function selProd(p:Product){setSelProduct(p);setSearch(p.name);setShowSugg(false);setSelVolume('')}
  function addItem(){
    if(!selProduct||!selVolume)return
    const v=selProduct.volumes.find(v=>v.volume_ml===Number(selVolume))
    if(!v)return
    setItems(prev=>[...prev,{product_id:selProduct.id,product_name:selProduct.name,brand:selProduct.brand,volume_ml:v.volume_ml,price:Number(v.price)}])
    setSearch('');setSelProduct(null);setSelVolume('')
    searchRef.current?.focus()
  }
  function removeItem(idx:number){setItems(prev=>prev.filter((_,i)=>i!==idx))}

  const subtotal=items.reduce((s,i)=>s+i.price,0)
  const frete=parseFloat(freteValor)||0
  const total=subtotal+frete

  function generatePDF(){
    const date=new Date().toLocaleDateString('pt-BR',{day:'2-digit',month:'long',year:'numeric'})
    const num=`ED-${Date.now().toString().slice(-6)}`
    const rows=items.map(i=>`<tr><td>${i.product_name}</td><td style="color:#888;font-size:12px">${i.brand}</td><td style="text-align:center">${i.volume_ml}ml</td><td style="text-align:right;font-weight:600;color:#1C1C1E">R$\u00a0${i.price.toFixed(2).replace('.',',')}</td></tr>`).join('')
    const freteRow=frete>0?`<tr style="border-top:1px solid #e8e0d0"><td colspan="3" style="color:#666;font-style:italic">Frete${freteTransp?` · ${freteTransp}`:''}</td><td style="text-align:right;font-weight:600">R$\u00a0${frete.toFixed(2).replace('.',',')}</td></tr>`:''
    const html=`<!DOCTYPE html><html><head><meta charset="utf-8"/>
<style>
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@300;400&family=Inter:wght@300;400;500;600&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Inter',Arial,sans-serif;color:#1C1C1E;background:#fff;font-size:14px;line-height:1.5}
.page{max-width:780px;margin:0 auto;padding:52px 48px}
.header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:44px;padding-bottom:28px;border-bottom:1.5px solid #E8D5A3}
.brand h1{font-family:'Playfair Display',serif;font-size:34px;font-weight:300;color:#A8842C;letter-spacing:0.07em;line-height:1}
.brand p{font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#C7C7CC;margin-top:5px;font-weight:500}
.meta{text-align:right;font-size:12.5px;color:#6C6C70;line-height:1.9}
.meta strong{color:#3A3A3C;font-weight:600}
.meta .num{font-size:11px;color:#B8943F;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;margin-top:4px}
.client{background:#FAF7F0;border:1px solid #EDE0C8;border-radius:12px;padding:18px 22px;margin-bottom:32px}
.client-lbl{font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#C7C7CC;margin-bottom:6px}
.client-name{font-family:'Playfair Display',serif;font-size:20px;color:#1C1C1E;font-weight:400}
.client-contact{font-size:13px;color:#6C6C70;margin-top:3px}
.section-lbl{font-size:10.5px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#AEAEB2;margin-bottom:14px}
table{width:100%;border-collapse:collapse}
th{text-align:left;padding:9px 14px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.09em;color:#B8943F;border-bottom:1.5px solid #E8D5A3;background:#FAF7F0}
th:last-child{text-align:right}th:nth-child(3){text-align:center}
td{padding:13px 14px;border-bottom:1px solid #F5EFE4;font-size:13.5px}
.subtotal-row td{padding-top:16px;border-top:1px solid #EDE0C8;border-bottom:none;font-weight:600;color:#6C6C70;font-size:12.5px}
.total-row{display:flex;justify-content:flex-end;align-items:baseline;gap:20px;margin-top:20px;padding-top:18px;border-top:2px solid #B8943F}
.total-label{font-size:12px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#AEAEB2}
.total-value{font-family:'Playfair Display',serif;font-size:32px;color:#A8842C;font-weight:300}
.note{margin-top:30px;padding:14px 18px;background:#FAF7F0;border-left:3px solid #B8943F;font-size:13px;color:#6C6C70;line-height:1.6;border-radius:0 8px 8px 0}
.footer{margin-top:52px;padding-top:20px;border-top:1px solid #F0EBE0;display:flex;justify-content:space-between;align-items:center}
.footer-brand{font-family:'Playfair Display',serif;font-size:15px;color:#B8943F;letter-spacing:0.07em}
.footer-text{font-size:11px;color:#C7C7CC;text-align:right;line-height:1.7}
@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style></head><body><div class="page">
<div class="header">
  <div class="brand"><h1>EDOM DECANTS</h1><p>Decants de Luxo</p></div>
  <div class="meta"><div><strong>Orçamento</strong></div><div>${num}</div><div>${date}</div><div class="num">Proposta Comercial</div></div>
</div>
<div class="client">
  <div class="client-lbl">Orçamento para</div>
  <div class="client-name">${clientName}</div>
  ${clientContact?`<div class="client-contact">${clientContact}</div>`:''}
</div>
<div class="section-lbl">Itens selecionados</div>
<table>
  <thead><tr><th>Perfume</th><th>Marca</th><th style="text-align:center">Volume</th><th style="text-align:right">Valor</th></tr></thead>
  <tbody>
    ${rows}
    ${freteRow}
  </tbody>
</table>
<div class="total-row">
  <span class="total-label">Total</span>
  <span class="total-value">R$\u00a0${total.toFixed(2).replace('.',',')}</span>
</div>
${note?`<div class="note">${note}</div>`:''}
<div class="footer">
  <div class="footer-brand">EDOM DECANTS</div>
  <div class="footer-text">Orçamento válido por 7 dias<br/>Preços sujeitos à disponibilidade de estoque</div>
</div>
</div></body></html>`
    const win=window.open('','_blank')
    if(win){win.document.write(html);win.document.close();setTimeout(()=>win.print(),700)}
  }

  return(
    <div className="fade-in">
      <div style={{marginBottom:36}}>
        <h1>Gerar orçamento</h1>
        <p style={{color:'var(--t3)',fontSize:14.5,marginTop:7}}>Monte o orçamento e exporte em PDF para o cliente</p>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 360px',gap:24,alignItems:'start'}}>
        {/* LEFT */}
        <div style={{display:'flex',flexDirection:'column',gap:18}}>

          {/* Client */}
          <div style={{...glass.card, padding:26}}>
            <h3 style={{marginBottom:18,display:'flex',alignItems:'center',gap:8}}><User size={13} strokeWidth={2}/> Dados do cliente</h3>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
              <div><label className="label">Nome *</label><input style={{...glass.input}} placeholder="Nome do cliente" value={clientName} onChange={e=>setClientName(e.target.value)}/></div>
              <div><label className="label">Contato</label><input style={{...glass.input}} placeholder="WhatsApp, e-mail…" value={clientContact} onChange={e=>setClientContact(e.target.value)}/></div>
            </div>
          </div>

          {/* Add product */}
          <div style={{...glass.card, padding:26}}>
            <h3 style={{marginBottom:18}}>Adicionar produto</h3>
            <div style={{display:'flex',gap:12,flexWrap:'wrap',alignItems:'flex-end'}}>
              <div style={{flex:2,minWidth:220,position:'relative'}}>
                <label className="label">Produto</label>
                <div style={{position:'relative'}}>
                  <Search size={14} style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'var(--t4)',pointerEvents:'none'}}/>
                  <input ref={searchRef} style={{...glass.input, paddingLeft:36}} placeholder="Buscar perfume…" value={search}
                    onChange={e=>{setSearch(e.target.value);setShowSugg(true);setSelProduct(null)}}
                    onFocus={()=>setShowSugg(true)} onBlur={()=>setTimeout(()=>setShowSugg(false),180)}/>
                </div>
                {showSugg&&suggs.length>0&&(
                  <div style={{position:'absolute',top:'calc(100% + 6px)',left:0,right:0,zIndex:9999,background:'rgba(255,255,255,0.98)',backdropFilter:'blur(32px) saturate(200%)',WebkitBackdropFilter:'blur(32px) saturate(200%)',border:'1px solid rgba(255,255,255,0.95)',borderRadius:14,maxHeight:260,overflowY:'auto',boxShadow:'0 16px 48px rgba(0,0,0,0.16)'}}>
                    {suggs.map(p=>(
                      <button key={p.id} onMouseDown={()=>selProd(p)}
                        style={{display:'block',width:'100%',padding:'11px 16px',background:'transparent',border:'none',borderBottom:'1px solid rgba(0,0,0,0.045)',color:'var(--t1)',fontSize:13.5,textAlign:'left',cursor:'pointer',transition:'background 0.1s'}}
                        onMouseEnter={e=>(e.currentTarget.style.background='rgba(184,148,63,0.07)')}
                        onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
                        <span style={{fontWeight:500}}>{p.name}</span>
                        <span style={{fontSize:11.5,color:'var(--t4)',marginLeft:8}}>{p.brand}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div style={{minWidth:175}}>
                <label className="label">Volumetria</label>
                <select style={{...glass.input}} value={selVolume} onChange={e=>setSelVolume(e.target.value)} disabled={!selProduct}>
                  <option value="">Selecione…</option>
                  {selProduct?.volumes.map(v=>(
                    <option key={v.volume_ml} value={v.volume_ml}>{v.volume_ml}ml — R$ {Number(v.price).toFixed(2).replace('.',',')}</option>
                  ))}
                </select>
              </div>
              <button className="btn-gold" onClick={addItem} disabled={!selProduct||!selVolume} style={{marginBottom:1}}>
                <Plus size={14}/> Adicionar
              </button>
            </div>
          </div>

          {/* Items list */}
          {items.length>0?(
            <div style={{...glass.card, overflow:'hidden'}}>
              <table>
                <thead><tr><th style={{width:32}}>#</th><th>Produto</th><th>Volume</th><th>Preço</th><th style={{width:40}}></th></tr></thead>
                <tbody>
                  {items.map((item,idx)=>(
                    <tr key={idx}>
                      <td style={{color:'var(--t5)',fontSize:12}}>{idx+1}</td>
                      <td><div style={{fontWeight:500,fontSize:13.5}}>{item.product_name}</div><div style={{fontSize:11.5,color:'var(--t4)',marginTop:1}}>{item.brand}</div></td>
                      <td><span style={{color:'var(--gold)',fontWeight:700,fontSize:13.5}}>{item.volume_ml}ml</span></td>
                      <td><span style={{fontWeight:600,fontSize:14}}>R$ {item.price.toFixed(2).replace('.',',')}</span></td>
                      <td><button className="btn-ghost" style={{padding:'5px 8px',border:'none',background:'transparent'}} onClick={()=>removeItem(idx)}><Trash2 size={14} style={{color:'var(--danger)'}}/></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ):(
            <div style={{textAlign:'center',padding:'40px 20px',color:'var(--t4)'}}>
              <FileText size={28} style={{opacity:.3,marginBottom:10}}/>
              <p style={{fontSize:14}}>Nenhum produto adicionado</p>
              <p style={{fontSize:12.5,marginTop:4}}>Use o campo acima para buscar perfumes</p>
            </div>
          )}
        </div>

        {/* RIGHT — Resumo */}
        <div style={{position:'sticky',top:24}}>
          <div style={{...glass.card, padding:26}}>
            <h3 style={{marginBottom:22}}>Resumo</h3>

            <div style={{marginBottom:16}}>
              <div style={{fontSize:10.5,fontWeight:700,letterSpacing:'0.07em',textTransform:'uppercase',color:'var(--t4)',marginBottom:5}}>Cliente</div>
              <div style={{fontSize:15.5,fontFamily:'Playfair Display,serif',color:clientName?'var(--t1)':'var(--t5)',fontWeight:400}}>{clientName||'não informado'}</div>
            </div>

            <div className="gold-line" style={{margin:'16px 0'}}/>

            {/* Subtotal */}
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
              <div style={{fontSize:12,color:'var(--t3)',fontWeight:500}}>Subtotal ({items.length} {items.length===1?'item':'itens'})</div>
              <div style={{fontFamily:'Playfair Display,serif',fontSize:20,color:'var(--t2)',fontWeight:400}}>R$ {subtotal.toFixed(2).replace('.',',')}</div>
            </div>

            {/* Frete */}
            <div style={{...glass.card, padding:16,marginBottom:16,background:'rgba(0,0,0,0.025)',boxShadow:'none',borderColor:'var(--b2)'}}>
              <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:14}}>
                <Truck size={13} style={{color:'var(--t3)'}} strokeWidth={2}/>
                <span style={{fontSize:11,fontWeight:700,letterSpacing:'0.07em',textTransform:'uppercase',color:'var(--t3)'}}>Frete</span>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:10}}>
                <div>
                  <label className="label">Transportadora</label>
                  <input style={{...glass.input}} placeholder="Ex: Correios, Jadlog…" value={freteTransp} onChange={e=>setFreteTransp(e.target.value)}/>
                </div>
                <div>
                  <label className="label">Valor (R$)</label>
                  <input type="number" style={{...glass.input}} placeholder="0,00" step="0.01" min="0" value={freteValor} onChange={e=>setFreteValor(e.target.value)}/>
                </div>
              </div>
            </div>

            {/* Total */}
            <div style={{background:'var(--gold-bg)',border:'1px solid var(--gold-border)',borderRadius:14,padding:'16px 18px',marginBottom:18,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div style={{fontSize:11,fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase',color:'var(--gold)'}}>Total</div>
              <div style={{fontFamily:'Playfair Display,serif',fontSize:30,color:'var(--gold)',fontWeight:300}}>R$ {total.toFixed(2).replace('.',',')}</div>
            </div>

            <div style={{marginBottom:18}}>
              <label className="label">Observação (opcional)</label>
              <textarea style={{...glass.input, resize:'vertical', fontFamily:'var(--font-ui)'}} rows={3} placeholder="Ex: válido por 7 dias…" value={note} onChange={e=>setNote(e.target.value)}/>
            </div>

            <button className="btn-gold" onClick={generatePDF} disabled={items.length===0||!clientName} style={{width:'100%',padding:'13px 20px',fontSize:14}}>
              <FileText size={15}/> Gerar PDF
            </button>
            {(!clientName||items.length===0)&&(
              <p style={{fontSize:12,color:'var(--t4)',textAlign:'center',marginTop:9}}>
                {!clientName?'Informe o nome do cliente':'Adicione ao menos 1 produto'}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
