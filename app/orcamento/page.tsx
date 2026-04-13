'use client'
import { useEffect, useState, useRef, KeyboardEvent } from 'react'
import { glass } from '@/lib/styles'
import { Plus, Trash2, FileText, Search, User, Truck, Tag } from 'lucide-react'

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

  useEffect(()=>{ fetch('/api/products').then(r=>r.json()).then(d=>setProducts(d.products||[])) }, [])

  const suggs = products.filter(p=>search.length>1&&p.name.toLowerCase().includes(search.toLowerCase())).slice(0,8)

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
      // Tab fecha sugestões e segue fluxo normal
      setShowSugg(false)
      setSuggIdx(-1)
    }
  }

  // Tab na volumetria foca no botão Adicionar
  function handleVolumeKey(e: KeyboardEvent<HTMLSelectElement>){
    if(e.key==='Tab' && !e.shiftKey){
      e.preventDefault()
      addBtnRef.current?.focus()
    }
  }

  // Enter/Space no botão Adicionar dispara addItem e volta para busca
  function handleAddBtnKey(e: KeyboardEvent<HTMLButtonElement>){
    if(e.key==='Enter'||e.key===' '){
      e.preventDefault()
      addItem()
    }
    // Tab no botão Adicionar vai para Transportadora
    if(e.key==='Tab' && !e.shiftKey){
      e.preventDefault()
      freteTranspRef.current?.focus()
    }
  }

  // Tab na transportadora vai para valor do frete
  function handleFreteTranspKey(e: KeyboardEvent<HTMLInputElement>){
    if(e.key==='Tab' && !e.shiftKey){
      e.preventDefault()
      freteValorRef.current?.focus()
    }
  }

  // Tab no valor do frete vai para tipo de desconto
  function handleFreteValorKey(e: KeyboardEvent<HTMLInputElement>){
    if(e.key==='Tab' && !e.shiftKey){
      e.preventDefault()
      descontoTipoRef.current?.focus()
    }
  }

  // Tab no tipo de desconto vai para valor do desconto
  function handleDescontoTipoKey(e: KeyboardEvent<HTMLSelectElement>){
    if(e.key==='Tab' && !e.shiftKey){
      e.preventDefault()
      descontoValorRef.current?.focus()
    }
  }

  // Tab no valor do desconto vai para observação
  function handleDescontoValorKey(e: KeyboardEvent<HTMLInputElement>){
    if(e.key==='Tab' && !e.shiftKey){
      e.preventDefault()
      noteRef.current?.focus()
    }
  }

  // Tab na observação vai para botão Gerar PDF
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

  function fmt(v:number){ return 'R$\u00a0'+v.toFixed(2).replace('.',',') }

  async function generatePDF(){
    if(generating) return
    setGenerating(true)
    try {
      const date = new Date().toLocaleDateString('pt-BR',{day:'2-digit',month:'long',year:'numeric'})
      const num  = `ED-${Date.now().toString().slice(-6)}`

      const freteRow = frete>0
        ? `<tr>
            <td colspan="3" style="padding:10px 12px;font-size:13px;color:#888;font-style:italic;border-top:1px solid #EDE0C8">Frete${freteTransp?` · ${freteTransp}`:''}</td>
            <td style="padding:10px 12px;text-align:right;font-weight:600;font-size:13px;border-top:1px solid #EDE0C8">${fmt(frete)}</td>
           </tr>` : ''

      const descontoRow = desconto>0
        ? `<tr>
            <td colspan="3" style="padding:10px 12px;font-size:13px;color:#2e7d32;font-style:italic;border-top:1px solid #EDE0C8">Desconto${descontoTipo==='percent'?` (${descontoRaw}%)`:''}</td>
            <td style="padding:10px 12px;text-align:right;font-weight:600;font-size:13px;color:#2e7d32;border-top:1px solid #EDE0C8">- ${fmt(desconto)}</td>
           </tr>` : ''

      const itemRows = items.map(i=>`
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #F5EFE4;font-size:13px">${i.product_name}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #F5EFE4;font-size:11.5px;color:#888">${i.brand}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #F5EFE4;text-align:center;font-size:13px">${i.volume_ml}ml</td>
          <td style="padding:10px 12px;border-bottom:1px solid #F5EFE4;text-align:right;font-weight:600;font-size:13px">${fmt(i.price)}</td>
        </tr>`).join('')

      const container = document.createElement('div')
      container.style.cssText = 'position:fixed;left:-9999px;top:0;width:700px;background:#fff;font-family:Arial,sans-serif'
      container.innerHTML = `
        <div style="padding:44px 48px;background:#fff;width:700px">

          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px;padding-bottom:22px;border-bottom:1.5px solid #E8D5A3">
            <div>
              <div style="font-size:28px;font-weight:300;color:#A8842C;letter-spacing:3px;line-height:1;font-family:Georgia,serif">EDOM DECANTS</div>
              <div style="font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#C7C7CC;margin-top:5px;font-weight:500">Decants de Luxo</div>
            </div>
            <div style="text-align:right;font-size:12px;color:#6C6C70;line-height:1.9">
              <div><strong style="color:#3A3A3C">Orçamento</strong></div>
              <div>${num}</div>
              <div>${date}</div>
              <div style="font-size:10px;color:#B8943F;font-weight:600;letter-spacing:1px;text-transform:uppercase;margin-top:3px">Proposta Comercial</div>
            </div>
          </div>

          <div style="background:#FAF7F0;border:1px solid #EDE0C8;border-radius:10px;padding:16px 20px;margin-bottom:26px">
            <div style="font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#C7C7CC;margin-bottom:5px">Orçamento para</div>
            <div style="font-size:18px;color:#1C1C1E;font-weight:400;font-family:Georgia,serif">${clientName}</div>
            ${clientContact?`<div style="font-size:12px;color:#6C6C70;margin-top:2px">${clientContact}</div>`:''}
          </div>

          <div style="font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#AEAEB2;margin-bottom:12px">Itens selecionados</div>
          <table style="width:100%;border-collapse:collapse">
            <thead>
              <tr style="background:#FAF7F0;border-bottom:1.5px solid #E8D5A3">
                <th style="text-align:left;padding:8px 12px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#B8943F">Perfume</th>
                <th style="text-align:left;padding:8px 12px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#B8943F">Marca</th>
                <th style="text-align:center;padding:8px 12px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#B8943F">Volume</th>
                <th style="text-align:right;padding:8px 12px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#B8943F">Valor</th>
              </tr>
            </thead>
            <tbody>
              ${itemRows}
              ${freteRow}
              ${descontoRow}
            </tbody>
          </table>

          <div style="display:flex;justify-content:flex-end;align-items:baseline;gap:14px;margin-top:16px;padding-top:16px;border-top:2px solid #B8943F">
            <span style="font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#AEAEB2">Total</span>
            <span style="font-size:26px;color:#A8842C;font-weight:300;font-family:Georgia,serif">${fmt(total)}</span>
          </div>

          ${note?`<div style="margin-top:22px;padding:12px 16px;background:#FAF7F0;border-left:3px solid #B8943F;font-size:12px;color:#6C6C70;line-height:1.6">${note}</div>`:''}

          <div style="margin-top:40px;padding-top:16px;border-top:1px solid #F0EBE0;display:flex;justify-content:space-between;align-items:center">
            <div style="font-size:13px;color:#B8943F;letter-spacing:2px;font-family:Georgia,serif">EDOM DECANTS</div>
            <div style="font-size:10px;color:#C7C7CC;text-align:right;line-height:1.7">Orçamento válido por 7 dias<br/>Preços sujeitos à disponibilidade de estoque</div>
          </div>

        </div>
      `
      document.body.appendChild(container)

      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ])

      const canvas = await html2canvas(container.firstElementChild as HTMLElement, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      })

      document.body.removeChild(container)

      const imgData = canvas.toDataURL('image/jpeg', 0.95)
      const pdf = new jsPDF({ orientation:'portrait', unit:'mm', format:'a4' })

      const pageW = pdf.internal.pageSize.getWidth()
      const pageH = pdf.internal.pageSize.getHeight()
      const imgW  = pageW
      const imgH  = (canvas.height * pageW) / canvas.width

      if(imgH <= pageH){
        pdf.addImage(imgData,'JPEG',0,0,imgW,imgH)
      } else {
        let y = 0
        while(y < imgH){
          pdf.addImage(imgData,'JPEG',0,-y,imgW,imgH)
          y += pageH
          if(y < imgH) pdf.addPage()
        }
      }

      const fileName = `orcamento-${clientName.toLowerCase().replace(/\s+/g,'-')}-${num}.pdf`
      pdf.save(fileName)

    } catch(err){
      console.error('Erro ao gerar PDF:', err)
      alert('Erro ao gerar PDF. Tente novamente.')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="fade-in">
      <div style={{marginBottom:28}}>
        <h1>Gerar orçamento</h1>
        <p style={{color:'var(--t3)',fontSize:14.5,marginTop:7}}>Monte o orçamento e exporte em PDF para o cliente</p>
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
          <div style={{...glass.card,overflow:'hidden',overflowX:'auto'}}>
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
