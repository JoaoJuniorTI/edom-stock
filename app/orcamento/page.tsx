'use client'
import { useEffect, useState, useRef, KeyboardEvent } from 'react'
import { glass } from '@/lib/styles'
import { generateQuotePDF } from '@/lib/pdf'
import { Plus, Trash2, FileText, Search, User, Truck, Tag, Save, RefreshCw, FilePlus } from 'lucide-react'

interface Product { id:number;name:string;brand:string;volumes:{volume_ml:number;price:number}[] }
interface QuoteItem { product_id:number;product_name:string;brand:string;volume_ml:number;price:number }

export default function OrcamentoPage() {
  const [products,setProducts]           = useState<Product[]>([])
  const [items,setItems]                 = useState<QuoteItem[]>([])
  const [clientName,setClientName]       = useState('')
  const [clientContact,setClientContact] = useState('')
  const [search,setSearch]               = useState('')
  const [showSugg,setShowSugg]           = useState(false)
  const [selProduct,setSelProduct]       = useState<Product|null>(null)
  const [selVolume,setSelVolume]         = useState('')
  const [note,setNote]                   = useState('')
  const [freteValor,setFreteValor]       = useState('')
  const [freteTransp,setFreteTransp]     = useState('')
  const [descontoTipo,setDescontoTipo]   = useState<'reais'|'percent'>('reais')
  const [descontoValor,setDescontoValor] = useState('')
  const [generating,setGenerating]       = useState(false)
  const [suggIdx,setSuggIdx]             = useState(-1)

  // Persistência do orçamento (item 2)
  const [quoteId,setQuoteId]             = useState<number|null>(null)
  const [quoteNumber,setQuoteNumber]     = useState<string|null>(null)
  const [quoteCreatedAt,setQuoteCreatedAt] = useState<string|null>(null)
  const [saving,setSaving]               = useState(false)
  const [saveMsg,setSaveMsg]             = useState<{text:string;ok:boolean}>({text:'',ok:true})

  const clientNameRef    = useRef<HTMLInputElement>(null)
  const clientContactRef = useRef<HTMLInputElement>(null)
  const searchRef        = useRef<HTMLInputElement>(null)
  const volumeRef        = useRef<HTMLSelectElement>(null)
  const addBtnRef        = useRef<HTMLButtonElement>(null)
  const freteTranspRef   = useRef<HTMLInputElement>(null)
  const freteValorRef    = useRef<HTMLInputElement>(null)
  const descontoTipoRef  = useRef<HTMLSelectElement>(null)
  const descontoValorRef = useRef<HTMLInputElement>(null)
  const noteRef          = useRef<HTMLTextAreaElement>(null)
  const pdfBtnRef        = useRef<HTMLButtonElement>(null)

  useEffect(()=>{
    fetch('/api/products').then(r=>r.json()).then(d=>setProducts(d.products||[]))
    // Se a URL tem ?id=, carrega o orçamento salvo para edição
    const id = typeof window!=='undefined' ? new URLSearchParams(window.location.search).get('id') : null
    if(id){
      fetch('/api/quotes?id='+id).then(r=>r.json()).then(d=>{
        const q = d.quote
        if(!q) return
        setQuoteId(q.id)
        setQuoteNumber(q.number)
        setQuoteCreatedAt(q.created_at)
        setClientName(q.client_name||'')
        setClientContact(q.client_contact||'')
        setItems(Array.isArray(q.items)?q.items:[])
        setFreteValor(Number(q.frete_valor)>0?String(Number(q.frete_valor)):'')
        setFreteTransp(q.frete_transp||'')
        setDescontoTipo(q.desconto_tipo==='percent'?'percent':'reais')
        setDescontoValor(Number(q.desconto_valor)>0?String(Number(q.desconto_valor)):'')
        setNote(q.note||'')
      })
    }
  }, [])

  const n = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  const suggs = products.filter(p=>search.length>1&&n(p.name).includes(n(search))).slice(0,8)

  function selProd(p:Product){
    setSelProduct(p); setSearch(p.name); setShowSugg(false); setSelVolume(''); setSuggIdx(-1)
    setTimeout(()=>volumeRef.current?.focus(), 50)
  }

  function addItem(){
    if(!selProduct||!selVolume) return
    const v = selProduct.volumes.find(v=>v.volume_ml===Number(selVolume))
    if(!v) return
    setItems(prev=>[...prev,{product_id:selProduct.id,product_name:selProduct.name,brand:selProduct.brand,volume_ml:v.volume_ml,price:Number(v.price)}])
    setSearch(''); setSelProduct(null); setSelVolume(''); setSuggIdx(-1)
    setTimeout(()=>searchRef.current?.focus(), 50)
  }

  function removeItem(idx:number){ setItems(prev=>prev.filter((_,i)=>i!==idx)) }

  // Navega no dropdown de sugestões com setas e seleciona com Enter
  function handleSearchKey(e: KeyboardEvent<HTMLInputElement>){
    if(!showSugg||suggs.length===0) return
    if(e.key==='ArrowDown'){
      e.preventDefault()
      setSuggIdx(i=>Math.min(i+1, suggs.length-1))
    } else if(e.key==='ArrowUp'){
      e.preventDefault()
      setSuggIdx(i=>Math.max(i-1, 0))
    } else if(e.key==='Enter'){
      e.preventDefault()
      if(suggIdx>=0 && suggs[suggIdx]) selProd(suggs[suggIdx])
      else if(suggs.length===1) selProd(suggs[0])
    } else if(e.key==='Tab'){
      setShowSugg(false)
      setSuggIdx(-1)
    }
  }

  function handleVolumeKey(e: KeyboardEvent<HTMLSelectElement>){
    if(e.key==='Tab' && !e.shiftKey){
      e.preventDefault()
      addBtnRef.current?.focus()
    }
  }

  function handleAddBtnKey(e: KeyboardEvent<HTMLButtonElement>){
    if(e.key==='Enter'||e.key===' '){
      e.preventDefault()
      addItem()
    }
    if(e.key==='Tab' && !e.shiftKey){
      e.preventDefault()
      freteTranspRef.current?.focus()
    }
  }

  function handleFreteTranspKey(e: KeyboardEvent<HTMLInputElement>){
    if(e.key==='Tab' && !e.shiftKey){
      e.preventDefault()
      freteValorRef.current?.focus()
    }
  }

  function handleFreteValorKey(e: KeyboardEvent<HTMLInputElement>){
    if(e.key==='Tab' && !e.shiftKey){
      e.preventDefault()
      descontoTipoRef.current?.focus()
    }
  }

  function handleDescontoTipoKey(e: KeyboardEvent<HTMLSelectElement>){
    if(e.key==='Tab' && !e.shiftKey){
      e.preventDefault()
      descontoValorRef.current?.focus()
    }
  }

  function handleDescontoValorKey(e: KeyboardEvent<HTMLInputElement>){
    if(e.key==='Tab' && !e.shiftKey){
      e.preventDefault()
      noteRef.current?.focus()
    }
  }

  function handleNoteKey(e: KeyboardEvent<HTMLTextAreaElement>){
    if(e.key==='Tab' && !e.shiftKey){
      e.preventDefault()
      pdfBtnRef.current?.focus()
    }
  }

  const subtotal    = items.reduce((s,i)=>s+i.price,0)
  const frete       = parseFloat(freteValor)||0
  const descontoRaw = parseFloat(descontoValor)||0
  const desconto    = descontoTipo==='percent' ? subtotal*(descontoRaw/100) : descontoRaw
  const total       = subtotal+frete-desconto

  // Monta os dados no formato esperado pelo gerador de PDF
  function buildQuoteData(){
    return {
      number: quoteNumber || `ED-${Date.now().toString().slice(-6)}`,
      client_name: clientName,
      client_contact: clientContact,
      items: items.map(i=>({product_name:i.product_name,brand:i.brand,volume_ml:i.volume_ml,price:i.price})),
      frete_valor: frete,
      frete_transp: freteTransp,
      desconto_tipo: descontoTipo,
      desconto_valor: descontoRaw,
      note,
      created_at: quoteCreatedAt || undefined,
    }
  }

  async function generatePDF(){
    if(generating) return
    setGenerating(true)
    try {
      await generateQuotePDF(buildQuoteData())
    } catch(err){
      console.error('Erro ao gerar PDF:', err)
      alert('Erro ao gerar PDF. Tente novamente.')
    } finally {
      setGenerating(false)
    }
  }

  // Salva (novo) ou atualiza (existente) o orçamento no banco
  async function saveQuote(){
    if(saving || !clientName || items.length===0) return
    setSaving(true)
    const payload = {
      client_name: clientName,
      client_contact: clientContact,
      items,
      frete_valor: frete,
      frete_transp: freteTransp,
      desconto_tipo: descontoTipo,
      desconto_valor: descontoRaw,
      note,
      total,
    }
    const editing = quoteId!=null
    try {
      const res = editing
        ? await fetch('/api/quotes',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:quoteId,...payload})})
        : await fetch('/api/quotes',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
      const d = await res.json()
      if(d.quote){
        setQuoteId(d.quote.id)
        setQuoteNumber(d.quote.number)
        setQuoteCreatedAt(d.quote.created_at)
        setSaveMsg({text: editing?'Orçamento atualizado!':`Orçamento salvo (${d.quote.number}).`, ok:true})
      } else {
        setSaveMsg({text: d.error||'Erro ao salvar', ok:false})
      }
    } catch {
      setSaveMsg({text:'Erro de conexão', ok:false})
    } finally {
      setSaving(false)
      setTimeout(()=>setSaveMsg({text:'',ok:true}), 4000)
    }
  }

  // Atualiza os preços (e nome/marca) dos itens com os valores atuais do catálogo
  function updatePrices(){
    let changed = 0
    setItems(prev=>prev.map(it=>{
      const p = products.find(pr=>pr.id===it.product_id)
      if(!p) return it
      const v = p.volumes.find(vv=>vv.volume_ml===it.volume_ml)
      if(!v) return it
      if(Number(v.price)!==it.price || p.name!==it.product_name || p.brand!==it.brand) changed++
      return {...it, price:Number(v.price), product_name:p.name, brand:p.brand}
    }))
    setSaveMsg({text: changed>0?`Preços atualizados (${changed} ${changed===1?'item':'itens'}).`:'Os preços já estavam atualizados.', ok:true})
    setTimeout(()=>setSaveMsg({text:'',ok:true}), 4000)
  }

  // Limpa tudo para começar um novo orçamento
  function newQuote(){
    setQuoteId(null); setQuoteNumber(null); setQuoteCreatedAt(null)
    setClientName(''); setClientContact(''); setItems([])
    setFreteValor(''); setFreteTransp(''); setDescontoTipo('reais'); setDescontoValor(''); setNote('')
    setSearch(''); setSelProduct(null); setSelVolume(''); setSuggIdx(-1)
    setSaveMsg({text:'',ok:true})
    if(typeof window!=='undefined' && window.history) window.history.replaceState(null,'','/orcamento')
  }

  return (
    <div className="fade-in">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:16,marginBottom:28,flexWrap:'wrap'}}>
        <div>
          <h1 style={{fontFamily:'var(--font-display)',fontSize:34,fontWeight:300,color:'var(--t1)',letterSpacing:'-0.01em'}}>
            {quoteId?'Editar orçamento':'Gerar orçamento'}
          </h1>
          <p style={{color:'var(--t3)',fontSize:14.5,marginTop:7}}>
            {quoteNumber ? `Editando ${quoteNumber}` : 'Monte o orçamento, salve para editar depois e exporte em PDF'}
          </p>
        </div>
        {quoteId && (
          <button className="btn-ghost" onClick={newQuote}>
            <FilePlus size={14}/> Novo orçamento
          </button>
        )}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr',gap:18}} className="orcamento-grid">

        {/* Dados do cliente */}
        <div style={{...glass.card,padding:22}}>
          <h3 style={{marginBottom:16,display:'flex',alignItems:'center',gap:8}}><User size={13} strokeWidth={2}/> Dados do cliente</h3>
          <div style={{display:'grid',gap:12}} className="client-grid">
            <div>
              <label className="label">Nome *</label>
              <input
                ref={clientNameRef}
                style={{...glass.input}}
                placeholder="Nome do cliente"
                value={clientName}
                onChange={e=>setClientName(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Contato</label>
              <input
                ref={clientContactRef}
                style={{...glass.input}}
                placeholder="WhatsApp, e-mail…"
                value={clientContact}
                onChange={e=>setClientContact(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Adicionar produto */}
        <div style={{...glass.card,padding:22}}>
          <h3 style={{marginBottom:16}}>Adicionar produto</h3>
          <div style={{display:'flex',gap:12,flexWrap:'wrap',alignItems:'flex-end'}}>

            {/* Busca */}
            <div style={{flex:2,minWidth:200,position:'relative'}}>
              <label className="label">Produto</label>
              <div style={{position:'relative'}}>
                <Search size={14} style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'var(--t4)',pointerEvents:'none'}}/>
                <input
                  ref={searchRef}
                  style={{...glass.input,paddingLeft:36}}
                  placeholder="Buscar perfume…"
                  value={search}
                  onChange={e=>{setSearch(e.target.value);setShowSugg(true);setSelProduct(null);setSuggIdx(-1)}}
                  onFocus={()=>setShowSugg(true)}
                  onBlur={()=>setTimeout(()=>setShowSugg(false),180)}
                  onKeyDown={handleSearchKey}
                />
              </div>
              {showSugg&&suggs.length>0&&(
                <div style={{position:'absolute',top:'calc(100% + 6px)',left:0,right:0,zIndex:9999,background:'rgba(255,255,255,0.98)',backdropFilter:'blur(32px)',WebkitBackdropFilter:'blur(32px)',border:'1px solid rgba(255,255,255,0.95)',borderRadius:14,maxHeight:240,overflowY:'auto',boxShadow:'0 16px 48px rgba(0,0,0,0.16)'}}>
                  {suggs.map((p,i)=>(
                    <button key={p.id} onMouseDown={()=>selProd(p)}
                      style={{display:'block',width:'100%',padding:'11px 16px',background:i===suggIdx?'rgba(184,148,63,0.12)':'transparent',border:'none',borderBottom:'1px solid rgba(0,0,0,0.045)',color:'var(--t1)',fontSize:13.5,textAlign:'left',cursor:'pointer',transition:'background 0.1s'}}
                      onMouseEnter={e=>(e.currentTarget.style.background='rgba(184,148,63,0.07)')}
                      onMouseLeave={e=>(e.currentTarget.style.background=i===suggIdx?'rgba(184,148,63,0.12)':'transparent')}>
                      <span style={{fontWeight:500}}>{p.name}</span>
                      <span style={{fontSize:11.5,color:'var(--t4)',marginLeft:8}}>{p.brand}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Volumetria */}
            <div style={{minWidth:160}}>
              <label className="label">Volumetria</label>
              <select
                ref={volumeRef}
                style={{...glass.input}}
                value={selVolume}
                onChange={e=>setSelVolume(e.target.value)}
                onKeyDown={handleVolumeKey}
                disabled={!selProduct}
              >
                <option value="">Selecione…</option>
                {selProduct?.volumes.map(v=>(
                  <option key={v.volume_ml} value={v.volume_ml}>{v.volume_ml}ml — R$ {Number(v.price).toFixed(2).replace('.',',')}</option>
                ))}
              </select>
            </div>

            {/* Botão Adicionar */}
            <button
              ref={addBtnRef}
              className="btn-gold"
              onClick={addItem}
              onKeyDown={handleAddBtnKey}
              disabled={!selProduct||!selVolume}
              style={{marginBottom:1}}
              tabIndex={0}
            >
              <Plus size={14}/> Adicionar
            </button>
          </div>
        </div>

        {/* Lista de itens */}
        {items.length>0 ? (
          <div style={{...glass.card,overflow:'hidden'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:10,padding:'13px 18px',borderBottom:'1px solid rgba(0,0,0,0.05)',flexWrap:'wrap'}}>
              <span style={{fontSize:13,fontWeight:600,color:'var(--t2)'}}>Itens ({items.length})</span>
              <button className="btn-ghost" style={{padding:'6px 11px',fontSize:12}} onClick={updatePrices} tabIndex={-1} title="Recarrega os preços atuais do catálogo">
                <RefreshCw size={12}/> Atualizar preços
              </button>
            </div>
            <div style={{overflowX:'auto'}}>
              <table style={{minWidth:400}}>
                <thead><tr><th style={{width:32}}>#</th><th>Produto</th><th>Volume</th><th>Preço</th><th style={{width:40}}></th></tr></thead>
                <tbody>
                  {items.map((item,idx)=>(
                    <tr key={idx}>
                      <td style={{color:'var(--t5)',fontSize:12}}>{idx+1}</td>
                      <td>
                        <div style={{fontWeight:500,fontSize:13.5}}>{item.product_name}</div>
                        <div style={{fontSize:11.5,color:'var(--t4)',marginTop:1}}>{item.brand}</div>
                      </td>
                      <td><span style={{color:'var(--gold)',fontWeight:700,fontSize:13.5}}>{item.volume_ml}ml</span></td>
                      <td><span style={{fontWeight:600,fontSize:14}}>R$ {item.price.toFixed(2).replace('.',',')}</span></td>
                      <td><button className="btn-ghost" style={{padding:'5px 8px',border:'none',background:'transparent'}} onClick={()=>removeItem(idx)} tabIndex={-1}><Trash2 size={14} style={{color:'var(--danger)'}}/></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div style={{textAlign:'center',padding:'32px 20px',color:'var(--t4)'}}>
            <FileText size={28} style={{opacity:.3,marginBottom:10}}/>
            <p style={{fontSize:14}}>Nenhum produto adicionado</p>
            <p style={{fontSize:12.5,marginTop:4}}>Use o campo acima para buscar perfumes</p>
          </div>
        )}

        {/* Resumo / coluna direita */}
        <div style={{...glass.card,padding:22}}>
          <h3 style={{marginBottom:18}}>Resumo</h3>

          <div style={{marginBottom:14}}>
            <div style={{fontSize:10.5,fontWeight:700,letterSpacing:'0.07em',textTransform:'uppercase',color:'var(--t4)',marginBottom:4}}>Cliente</div>
            <div style={{fontSize:15,fontFamily:'var(--font-display)',color:clientName?'var(--t1)':'var(--t5)',fontWeight:400}}>{clientName||'não informado'}</div>
          </div>

          <div className="gold-line" style={{margin:'14px 0'}}/>

          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
            <div style={{fontSize:12,color:'var(--t3)',fontWeight:500}}>Subtotal ({items.length} {items.length===1?'item':'itens'})</div>
            <div style={{fontFamily:'var(--font-display)',fontSize:20,color:'var(--t2)',fontWeight:400}}>R$ {subtotal.toFixed(2).replace('.',',')}</div>
          </div>

          {/* Frete */}
          <div style={{...glass.card,padding:14,marginBottom:14,background:'rgba(0,0,0,0.025)',boxShadow:'none',borderColor:'var(--b2)'}}>
            <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:12}}>
              <Truck size={13} style={{color:'var(--t3)'}} strokeWidth={2}/>
              <span style={{fontSize:11,fontWeight:700,letterSpacing:'0.07em',textTransform:'uppercase',color:'var(--t3)'}}>Frete</span>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}} className="frete-grid">
              <div>
                <label className="label">Transportadora</label>
                <input
                  ref={freteTranspRef}
                  style={{...glass.input}}
                  placeholder="Ex: Correios…"
                  value={freteTransp}
                  onChange={e=>setFreteTransp(e.target.value)}
                  onKeyDown={handleFreteTranspKey}
                />
              </div>
              <div>
                <label className="label">Valor (R$)</label>
                <input
                  ref={freteValorRef}
                  type="number"
                  style={{...glass.input}}
                  placeholder="0,00"
                  step="0.01"
                  min="0"
                  value={freteValor}
                  onChange={e=>setFreteValor(e.target.value)}
                  onKeyDown={handleFreteValorKey}
                />
              </div>
            </div>
          </div>

          {/* Desconto */}
          <div style={{...glass.card,padding:14,marginBottom:14,background:'rgba(0,0,0,0.025)',boxShadow:'none',borderColor:'var(--b2)'}}>
            <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:12}}>
              <Tag size={13} style={{color:'var(--t3)'}} strokeWidth={2}/>
              <span style={{fontSize:11,fontWeight:700,letterSpacing:'0.07em',textTransform:'uppercase',color:'var(--t3)'}}>Desconto</span>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'auto 1fr',gap:10,alignItems:'end'}} className="desconto-grid">
              <div>
                <label className="label">Tipo</label>
                <select
                  ref={descontoTipoRef}
                  style={{...glass.input,width:'auto'}}
                  value={descontoTipo}
                  onChange={e=>setDescontoTipo(e.target.value as 'reais'|'percent')}
                  onKeyDown={handleDescontoTipoKey}
                >
                  <option value="reais">R$ (valor fixo)</option>
                  <option value="percent">% (percentual)</option>
                </select>
              </div>
              <div>
                <label className="label">{descontoTipo==='reais'?'Valor (R$)':'Percentual (%)'}</label>
                <input
                  ref={descontoValorRef}
                  type="number"
                  style={{...glass.input}}
                  placeholder={descontoTipo==='reais'?'0,00':'0'}
                  step={descontoTipo==='reais'?'0.01':'1'}
                  min="0"
                  max={descontoTipo==='percent'?'100':undefined}
                  value={descontoValor}
                  onChange={e=>setDescontoValor(e.target.value)}
                  onKeyDown={handleDescontoValorKey}
                />
              </div>
            </div>
            {desconto>0&&(
              <div style={{marginTop:10,fontSize:12.5,color:'#2e7d32',fontWeight:500,background:'rgba(46,125,50,0.07)',borderRadius:8,padding:'6px 10px'}}>
                Desconto: - R$ {desconto.toFixed(2).replace('.',',')}
              </div>
            )}
          </div>

          {/* Total */}
          <div style={{background:'var(--gold-bg)',border:'1px solid var(--gold-border)',borderRadius:14,padding:'14px 18px',marginBottom:16,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div style={{fontSize:11,fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase',color:'var(--gold)'}}>Total</div>
            <div style={{fontFamily:'var(--font-display)',fontSize:28,color:'var(--gold)',fontWeight:300}}>R$ {total.toFixed(2).replace('.',',')}</div>
          </div>

          {/* Observação */}
          <div style={{marginBottom:16}}>
            <label className="label">Observação (opcional)</label>
            <textarea
              ref={noteRef}
              style={{...glass.input,resize:'vertical',fontFamily:'var(--font-ui)'}}
              rows={3}
              placeholder="Ex: válido por 7 dias…"
              value={note}
              onChange={e=>setNote(e.target.value)}
              onKeyDown={handleNoteKey}
            />
          </div>

          {/* Mensagem de salvamento */}
          {saveMsg.text && (
            <div style={{marginBottom:12,fontSize:12.5,fontWeight:500,borderRadius:10,padding:'8px 12px',lineHeight:1.4,
              color:saveMsg.ok?'var(--success-dark)':'var(--danger)',
              background:saveMsg.ok?'var(--success-bg)':'var(--danger-bg)',
              border:`1px solid ${saveMsg.ok?'var(--success-border)':'var(--danger-border)'}`}}>
              {saveMsg.text}
            </div>
          )}

          {/* Botão Salvar */}
          <button
            className="btn-outline"
            onClick={saveQuote}
            disabled={items.length===0||!clientName||saving}
            style={{width:'100%',padding:'12px 20px',marginBottom:10,justifyContent:'center',opacity:(items.length===0||!clientName||saving)?0.45:1}}
          >
            <Save size={15}/> {saving?'Salvando…':(quoteId?'Atualizar orçamento':'Salvar orçamento')}
          </button>

          {/* Botão PDF */}
          <button
            ref={pdfBtnRef}
            className="btn-gold"
            onClick={generatePDF}
            disabled={items.length===0||!clientName||generating}
            style={{width:'100%',padding:'13px 20px',fontSize:14}}
          >
            <FileText size={15}/> {generating?'Gerando PDF…':'Gerar PDF'}
          </button>
          {(!clientName||items.length===0)&&(
            <p style={{fontSize:12,color:'var(--t4)',textAlign:'center',marginTop:8}}>
              {!clientName?'Informe o nome do cliente':'Adicione ao menos 1 produto'}
            </p>
          )}
        </div>
      </div>

      <style>{`
        @media (min-width: 900px) {
          .orcamento-grid { grid-template-columns: 1fr 360px !important; }
          .orcamento-grid > *:nth-child(1) { grid-column: 1; }
          .orcamento-grid > *:nth-child(2) { grid-column: 1; }
          .orcamento-grid > *:nth-child(3) { grid-column: 1; }
          .orcamento-grid > *:nth-child(4) { grid-column: 2; grid-row: 1 / 5; position: sticky; top: 24px; align-self: start; }
        }
        @media (min-width: 640px) {
          .client-grid { grid-template-columns: 1fr 1fr !important; }
          .frete-grid  { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 639px) {
          .frete-grid    { grid-template-columns: 1fr !important; }
          .desconto-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
