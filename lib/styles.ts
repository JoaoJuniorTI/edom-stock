// All glass styles applied inline — 100% immune to Tailwind/PostCSS purge
const GLASS_BG         = 'rgba(255,255,255,0.78)'
const GLASS_BORDER     = '1px solid rgba(255,255,255,0.92)'
const GLASS_SHADOW     = '0 4px 24px rgba(0,0,0,0.09), 0 1.5px 0 rgba(255,255,255,0.96) inset, 0 -0.5px 0 rgba(0,0,0,0.05) inset'
const GLASS_BLUR       = 'blur(32px) saturate(200%) brightness(1.02)'
const GLASS_BLUR_KPI   = 'blur(40px) saturate(220%) brightness(1.04)'
const GLASS_BLUR_SIDE  = 'blur(48px) saturate(220%)'

export const glass = {
  card: {
    background: GLASS_BG,
    backdropFilter: GLASS_BLUR,
    WebkitBackdropFilter: GLASS_BLUR,
    border: GLASS_BORDER,
    borderRadius: '22px',
    boxShadow: GLASS_SHADOW,
    position: 'relative' as const,
  },
  kpi: {
    background: 'rgba(255,255,255,0.82)',
    backdropFilter: GLASS_BLUR_KPI,
    WebkitBackdropFilter: GLASS_BLUR_KPI,
    border: '1px solid rgba(255,255,255,0.96)',
    borderRadius: '28px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.09), 0 1.5px 0 rgba(255,255,255,0.98) inset',
    padding: '24px 26px 22px',
    cursor: 'pointer' as const,
    position: 'relative' as const,
    overflow: 'hidden' as const,
    transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
    userSelect: 'none' as const,
  },
  sidebar: {
    background: 'rgba(232,232,238,0.92)',
    backdropFilter: GLASS_BLUR_SIDE,
    WebkitBackdropFilter: GLASS_BLUR_SIDE,
    borderRight: '1px solid rgba(255,255,255,0.78)',
    boxShadow: '2px 0 28px rgba(0,0,0,0.07)',
  },
  input: {
    background: 'rgba(255,255,255,0.88)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    border: '1px solid rgba(0,0,0,0.11)',
    borderRadius: '12px',
    outline: 'none' as const,
    width: '100%',
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
    fontSize: '14px',
    fontWeight: 400,
    padding: '11px 15px',
    color: '#1C1C1E',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05) inset',
    transition: 'all 0.18s ease',
  },
  dropdown: {
    position: 'absolute' as const,
    top: 'calc(100% + 6px)',
    left: 0,
    right: 0,
    zIndex: 9999,
    background: 'rgba(255,255,255,0.98)',
    backdropFilter: 'blur(32px) saturate(200%)',
    WebkitBackdropFilter: 'blur(32px) saturate(200%)',
    border: '1px solid rgba(255,255,255,0.95)',
    borderRadius: '14px',
    boxShadow: '0 16px 48px rgba(0,0,0,0.16), 0 1px 0 rgba(255,255,255,0.9) inset',
    maxHeight: '260px',
    overflowY: 'auto' as const,
  },
}

export const kpiHover = {
  transform: 'translateY(-4px) scale(1.015)',
  boxShadow: '0 20px 60px rgba(0,0,0,0.14), 0 1.5px 0 rgba(255,255,255,1) inset',
  background: 'rgba(255,255,255,0.92)',
}
