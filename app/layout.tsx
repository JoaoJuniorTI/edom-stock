'use client'
import './globals.css'
import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Package, BarChart2, FileText, ClipboardList, RefreshCw, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'

const nav = [
  { href: '/dashboard', label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/estoque',   label: 'Estoque',    icon: Package },
  { href: '/previsao',  label: 'Previsão',   icon: BarChart2 },
  { href: '/producao',  label: 'Produção',   icon: ClipboardList },
  { href: '/orcamento', label: 'Orçamento',  icon: FileText },
]

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname  = usePathname()
  const router    = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [syncing, setSyncing]     = useState(false)
  const [syncMsg, setSyncMsg]     = useState('')
  const [syncOk, setSyncOk]       = useState(true)

  async function handleSync() {
    setSyncing(true); setSyncMsg('')
    try {
      const res  = await fetch('/api/sync', { method: 'POST' })
      const data = await res.json()
      setSyncOk(data.success !== false)
      setSyncMsg(data.message || (data.success ? 'Sync concluído' : data.error))
      setTimeout(() => setSyncMsg(''), 5000)
    } catch {
      setSyncOk(false); setSyncMsg('Erro de conexão')
    } finally { setSyncing(false) }
  }

  return (
    <html lang="pt-BR">
      <head>
        <title>Edom Decants · Estoque</title>
        <meta name="viewport" content="width=device-width,initial-scale=1"/>
        <meta name="theme-color" content="#F2F2F7"/>
      </head>
      <body style={{ display:'flex', minHeight:'100vh' }}>

        {/* ── Sidebar ── */}
        <aside style={{
          width: collapsed ? 60 : 224,
          minHeight: '100vh',
          background: 'rgba(242,242,247,0.88)',
          backdropFilter: 'blur(40px) saturate(200%)',
          WebkitBackdropFilter: 'blur(40px) saturate(200%)',
          borderRight: '1px solid rgba(255,255,255,0.7)',
          boxShadow: '2px 0 24px rgba(0,0,0,0.05)',
          display: 'flex', flexDirection: 'column',
          transition: 'width 0.25s cubic-bezier(0.16,1,0.3,1)',
          flexShrink: 0, position: 'sticky', top: 0, height: '100vh', overflow: 'hidden',
        }}>

          {/* Logo */}
          <div style={{ padding: collapsed ? '20px 0' : '24px 20px 20px', textAlign: collapsed ? 'center' : 'left', borderBottom: '1px solid rgba(0,0,0,0.06)', transition: 'padding 0.25s' }}>
            {!collapsed ? (
              <div>
                <div style={{ fontFamily:'Playfair Display,serif', fontSize:20, color:'#A8842C', letterSpacing:'0.06em', fontWeight:400 }}>EDOM</div>
                <div style={{ fontFamily:'Geist,sans-serif', fontSize:10, letterSpacing:'0.14em', textTransform:'uppercase', color:'#AEAEB2', marginTop:2 }}>Decants · Estoque</div>
              </div>
            ) : (
              <div style={{ fontFamily:'Playfair Display,serif', fontSize:18, color:'#A8842C' }}>E</div>
            )}
          </div>

          {/* Nav */}
          <nav style={{ flex:1, padding:'12px 8px', display:'flex', flexDirection:'column', gap:2 }}>
            {nav.map(({ href, label, icon:Icon }) => (
              <button key={href}
                className={`sidebar-link${pathname===href?' active':''}`}
                onClick={() => router.push(href)}
                title={collapsed ? label : undefined}
                style={{ justifyContent: collapsed ? 'center' : 'flex-start', padding: collapsed ? '10px 0' : '9px 12px' }}>
                <Icon size={16} strokeWidth={1.8}/>
                {!collapsed && <span>{label}</span>}
              </button>
            ))}
          </nav>

          {/* Footer */}
          <div style={{ padding:'12px 8px 16px', borderTop:'1px solid rgba(0,0,0,0.06)' }}>
            {!collapsed && syncMsg && (
              <div style={{ fontSize:11, color: syncOk ? '#1D9641' : '#FF3B30', marginBottom:8, padding:'6px 10px', background: syncOk ? 'rgba(52,199,89,0.08)' : 'rgba(255,59,48,0.08)', borderRadius:8, border:`1px solid ${syncOk ? 'rgba(52,199,89,0.2)' : 'rgba(255,59,48,0.2)'}`, lineHeight:1.4 }}>
                {syncMsg}
              </div>
            )}
            <button className="sidebar-link" onClick={handleSync} disabled={syncing}
              title={collapsed ? 'Sincronizar CSV' : undefined}
              style={{ justifyContent:collapsed?'center':'flex-start', opacity:syncing?0.6:1 }}>
              {syncing
                ? <Loader2 size={15} strokeWidth={1.8} className="pulse"/>
                : <RefreshCw size={15} strokeWidth={1.8}/>}
              {!collapsed && <span>{syncing ? 'Sincronizando…' : 'Sincronizar CSV'}</span>}
            </button>
            <button className="sidebar-link" onClick={() => setCollapsed(!collapsed)}
              style={{ justifyContent:collapsed?'center':'flex-start', marginTop:2 }}>
              {collapsed
                ? <ChevronRight size={15} strokeWidth={1.8}/>
                : <><ChevronLeft size={15} strokeWidth={1.8}/><span>Recolher</span></>}
            </button>
          </div>
        </aside>

        {/* ── Main ── */}
        <main style={{ flex:1, padding:'36px 40px', overflowY:'auto', maxWidth:'100%', minHeight:'100vh' }}>
          {children}
        </main>
      </body>
    </html>
  )
}
