'use client'
import './globals.css'
import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Package, BarChart2, FileText, ClipboardList, RefreshCw, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/estoque', label: 'Estoque', icon: Package },
  { href: '/previsao', label: 'Previsão', icon: BarChart2 },
  { href: '/producao', label: 'Produção', icon: ClipboardList },
  { href: '/orcamento', label: 'Orçamento', icon: FileText },
]

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState('')

  async function handleSync() {
    setSyncing(true); setSyncMsg('')
    try {
      const res = await fetch('/api/sync', { method: 'POST' })
      const data = await res.json()
      setSyncMsg(data.message || 'Sync concluído')
      setTimeout(() => setSyncMsg(''), 4000)
    } catch { setSyncMsg('Erro no sync') }
    finally { setSyncing(false) }
  }

  return (
    <html lang="pt-BR">
      <head><title>Edom Decants · Estoque</title><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
      <body style={{display:'flex',minHeight:'100vh'}}>
        <aside style={{width:collapsed?56:220,minHeight:'100vh',background:'var(--bg2)',borderRight:'1px solid var(--border)',display:'flex',flexDirection:'column',transition:'width 0.2s',flexShrink:0,position:'sticky',top:0,height:'100vh',overflow:'hidden'}}>
          <div style={{padding:'20px 14px 16px',borderBottom:'1px solid var(--border)'}}>
            {!collapsed ? (
              <div>
                <div style={{fontFamily:'Cormorant Garamond,serif',fontSize:20,color:'var(--gold)',letterSpacing:'0.04em'}}>EDOM</div>
                <div style={{fontSize:10,letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--text-dim)',marginTop:1}}>Decants · Estoque</div>
              </div>
            ) : (
              <div style={{fontFamily:'Cormorant Garamond,serif',fontSize:18,color:'var(--gold)',textAlign:'center'}}>E</div>
            )}
          </div>
          <nav style={{flex:1,padding:'12px 8px',display:'flex',flexDirection:'column',gap:2}}>
            {nav.map(({href,label,icon:Icon}) => (
              <button key={href} className={`sidebar-link${pathname===href?' active':''}`} onClick={()=>router.push(href)} title={collapsed?label:undefined} style={{justifyContent:collapsed?'center':'flex-start'}}>
                <Icon size={16}/>{!collapsed&&<span>{label}</span>}
              </button>
            ))}
          </nav>
          <div style={{padding:'12px 8px',borderTop:'1px solid var(--border)'}}>
            {!collapsed&&syncMsg&&<div style={{fontSize:11,color:'var(--gold)',marginBottom:8,padding:'4px 8px',background:'rgba(201,168,76,0.08)',borderRadius:4}}>{syncMsg}</div>}
            <button className="sidebar-link" onClick={handleSync} disabled={syncing} title={collapsed?'Sincronizar CSV':undefined} style={{justifyContent:collapsed?'center':'flex-start',opacity:syncing?0.7:1}}>
              {syncing?<Loader2 size={16} style={{animation:'pulse-gold 1s infinite'}}/>:<RefreshCw size={16}/>}
              {!collapsed&&<span>{syncing?'Sincronizando...':'Sincronizar CSV'}</span>}
            </button>
            <button className="sidebar-link" onClick={()=>setCollapsed(!collapsed)} style={{justifyContent:collapsed?'center':'flex-start',marginTop:4}}>
              {collapsed?<ChevronRight size={16}/>:<><ChevronLeft size={16}/><span>Recolher</span></>}
            </button>
          </div>
        </aside>
        <main style={{flex:1,padding:'32px',overflowY:'auto',maxWidth:'100%'}}>{children}</main>
      </body>
    </html>
  )
}
