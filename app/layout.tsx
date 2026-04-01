'use client'
import './globals.css'
import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Package, BarChart2, FileText, ClipboardList, RefreshCw, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'

const nav = [
  { href:'/dashboard', label:'Dashboard',  icon:LayoutDashboard },
  { href:'/estoque',   label:'Estoque',    icon:Package },
  { href:'/previsao',  label:'Previsão',   icon:BarChart2 },
  { href:'/producao',  label:'Produção',   icon:ClipboardList },
  { href:'/orcamento', label:'Orçamento',  icon:FileText },
]

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router   = useRouter()
  const [col, setCol]         = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState('')
  const [syncOk, setSyncOk]   = useState(true)

  async function handleSync() {
    setSyncing(true); setSyncMsg('')
    try {
      const d = await fetch('/api/sync',{method:'POST'}).then(r=>r.json())
      setSyncOk(d.success!==false)
      setSyncMsg(d.message||(d.success?'Sincronizado!':d.error||'Erro'))
      setTimeout(()=>setSyncMsg(''),5000)
    } catch { setSyncOk(false); setSyncMsg('Erro de conexão') }
    finally { setSyncing(false) }
  }

  return (
    <html lang="pt-BR">
      <head>
        <title>Edom Decants · Estoque</title>
        <meta name="viewport" content="width=device-width,initial-scale=1"/>
      </head>
      <body style={{display:'flex',minHeight:'100vh'}}>
        <aside className="glass-sidebar" style={{
          width:col?64:228, minHeight:'100vh', flexShrink:0,
          display:'flex', flexDirection:'column',
          position:'sticky', top:0, height:'100vh', overflow:'hidden',
          transition:'width 0.28s cubic-bezier(0.16,1,0.3,1)',
        }}>
          {/* Logo */}
          <div style={{padding:col?'22px 0':'26px 20px 22px', textAlign:col?'center':'left', borderBottom:'1px solid rgba(0,0,0,0.07)', transition:'padding 0.28s'}}>
            {!col ? (
              <div>
                <div style={{fontFamily:'Playfair Display,serif',fontSize:22,color:'var(--gold)',letterSpacing:'0.05em',fontWeight:400,lineHeight:1}}>EDOM</div>
                <div style={{fontSize:9.5,letterSpacing:'0.18em',textTransform:'uppercase',color:'var(--t4)',marginTop:3,fontWeight:700}}>Decants · Estoque</div>
              </div>
            ) : (
              <div style={{fontFamily:'Playfair Display,serif',fontSize:20,color:'var(--gold)',textAlign:'center'}}>E</div>
            )}
          </div>

          {/* Nav */}
          <nav style={{flex:1,padding:'14px 8px',display:'flex',flexDirection:'column',gap:2}}>
            {nav.map(({href,label,icon:Icon})=>(
              <button key={href}
                className={`sidebar-link${pathname===href?' active':''}`}
                onClick={()=>router.push(href)}
                title={col?label:undefined}
                style={{justifyContent:col?'center':'flex-start',padding:col?'10px 0':'9px 12px'}}>
                <Icon size={17} strokeWidth={1.7}/>
                {!col&&<span style={{marginLeft:2}}>{label}</span>}
              </button>
            ))}
          </nav>

          {/* Footer */}
          <div style={{padding:'10px 8px 18px',borderTop:'1px solid rgba(0,0,0,0.07)'}}>
            {!col&&syncMsg&&(
              <div style={{
                fontSize:11.5, fontWeight:500, marginBottom:8,
                color:syncOk?'var(--success-dark)':'var(--danger)',
                background:syncOk?'var(--success-bg)':'var(--danger-bg)',
                border:`1px solid ${syncOk?'var(--success-border)':'var(--danger-border)'}`,
                borderRadius:10, padding:'7px 11px', lineHeight:1.4,
              }}>{syncMsg}</div>
            )}
            <button className="sidebar-link" onClick={handleSync} disabled={syncing}
              title={col?'Sincronizar CSV':undefined}
              style={{justifyContent:col?'center':'flex-start',opacity:syncing?0.65:1}}>
              {syncing
                ? <Loader2 size={16} strokeWidth={1.7} className="spin"/>
                : <RefreshCw size={16} strokeWidth={1.7}/>}
              {!col&&<span style={{marginLeft:2}}>{syncing?'Sincronizando…':'Sincronizar CSV'}</span>}
            </button>
            <button className="sidebar-link" onClick={()=>setCol(!col)} style={{justifyContent:col?'center':'flex-start',marginTop:2}}>
              {col?<ChevronRight size={16} strokeWidth={1.7}/>:<><ChevronLeft size={16} strokeWidth={1.7}/><span style={{marginLeft:2}}>Recolher</span></>}
            </button>
          </div>
        </aside>

        <main style={{flex:1,padding:'40px 44px',overflowY:'auto',maxWidth:'100%',minHeight:'100vh'}}>
          {children}
        </main>
      </body>
    </html>
  )
}
