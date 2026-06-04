'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2, Download, FileText } from 'lucide-react'
import { glass } from '@/lib/styles'
import { generateQuotePDF } from '@/lib/pdf'

interface Quote {
  id:number; number:string; client_name:string; client_contact:string|null;
  items:{product_name:string;brand:string;volume_ml:number;price:number}[];
  frete_valor:string; frete_transp:string|null;
  desconto_tipo:'reais'|'percent'; desconto_valor:string; note:string|null;
  total:string; created_at:string; updated_at:string
}

export default function OrcamentosPage(){
  const router = useRouter()
  const [quotes,setQuotes] = useState<Quote[]>([])
  const [loading,setLoading] = useState(true)
  const [busyId,setBusyId] = useState<number|null>(null)

  async function load(){
    setLoading(true)
    const d = await fetch('/api/quotes').then(r=>r.json())
    setQuotes(d.quotes||[]); setLoading(false)
  }
  useEffect(()=>{ load() },[])

  async function del(q:Quote){
    if(!confirm(`Excluir o orçamento ${q.number} de ${q.client_name}? Essa ação não pode ser desfeita.`)) return
    setBusyId(q.id)
    await fetch('/api/quotes?id='+q.id,{method:'DELETE'})
    await load()
    setBusyId(null)
  }

  async function pdf(q:Quote){
    setBusyId(q.id)
    try {
      await generateQuotePDF({
        number:q.number,
        client_name:q.client_name,
        client_contact:q.client_contact,
        items:q.items||[],
        frete_valor:Number(q.frete_valor)||0,
        frete_transp:q.frete_transp,
        desconto_tipo:q.desconto_tipo==='percent'?'percent':'reais',
        desconto_valor:Number(q.desconto_valor)||0,
        note:q.note,
        created_at:q.created_at,
      })
    } catch {
      alert('Erro ao gerar PDF. Tente novamente.')
    } finally {
      setBusyId(null)
    }
  }

  const fmtDate  = (s:string) => new Date(s).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric'})
  const fmtMoney = (v:string|number) => 'R$ '+Number(v).toFixed(2).replace('.',',')

  return (
    <div className="fade-in">
      <div style={{marginBottom:28}}>
        <h1 style={{fontFamily:'var(--font-display)',fontSize:34,fontWeight:300,color:'var(--t1)',letterSpacing:'-0.01em'}}>Orçamentos salvos</h1>
        <p style={{color:'var(--t3)',fontSize:14.5,marginTop:7}}>Orçamentos são removidos automaticamente após 30 dias</p>
      </div>

      {loading ? (
        <div style={{...glass.card,padding:48,textAlign:'center',color:'var(--t4)',fontSize:14}}>Carregando…</div>
      ) : quotes.length===0 ? (
        <div style={{...glass.card,padding:'40px 20px',textAlign:'center',color:'var(--t4)'}}>
          <FileText size={28} style={{opacity:.3,marginBottom:10}}/>
          <p style={{fontSize:14}}>Nenhum orçamento salvo</p>
          <p style={{fontSize:12.5,marginTop:4}}>Crie um na página "Orçamento" e clique em Salvar</p>
        </div>
      ) : (
        <div style={{...glass.card,overflow:'hidden',overflowX:'auto'}}>
          <table style={{minWidth:560}}>
            <thead>
              <tr>
                <th>Nº</th><th>Cliente</th><th style={{textAlign:'center'}}>Itens</th><th>Total</th><th>Data</th><th style={{width:150}}></th>
              </tr>
            </thead>
            <tbody>
              {quotes.map(q=>(
                <tr key={q.id}>
                  <td style={{fontWeight:600,color:'var(--gold)',fontSize:12.5,whiteSpace:'nowrap'}}>{q.number}</td>
                  <td>
                    <div style={{fontWeight:500,fontSize:13.5}}>{q.client_name}</div>
                    {q.client_contact && <div style={{fontSize:11.5,color:'var(--t4)',marginTop:1}}>{q.client_contact}</div>}
                  </td>
                  <td style={{textAlign:'center',color:'var(--t3)'}}>{(q.items||[]).length}</td>
                  <td style={{fontWeight:600,whiteSpace:'nowrap'}}>{fmtMoney(q.total)}</td>
                  <td style={{color:'var(--t3)',fontSize:12.5,whiteSpace:'nowrap'}}>{fmtDate(q.created_at)}</td>
                  <td>
                    <div style={{display:'flex',gap:5,justifyContent:'flex-end'}}>
                      <button className="btn-ghost" title="Editar" style={{padding:'6px 9px'}} disabled={busyId===q.id} onClick={()=>router.push('/orcamento?id='+q.id)}><Pencil size={13}/></button>
                      <button className="btn-ghost" title="Gerar PDF" style={{padding:'6px 9px'}} disabled={busyId===q.id} onClick={()=>pdf(q)}><Download size={13}/></button>
                      <button className="btn-ghost" title="Excluir" style={{padding:'6px 9px'}} disabled={busyId===q.id} onClick={()=>del(q)}><Trash2 size={13} style={{color:'var(--danger)'}}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
