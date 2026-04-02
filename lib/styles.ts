// Glass styles via inline — sem backdrop-filter (removido pelo PostCSS)
// Simulamos o efeito com background semiopaco + sombras multicamada

const CARD_BG     = 'rgba(255,255,255,0.92)'
const CARD_BORDER = '1px solid rgba(255,255,255,0.98)'
const CARD_SHADOW = [
  '0 2px 1px rgba(255,255,255,0.9) inset',   // top highlight
  '0 -1px 1px rgba(0,0,0,0.04) inset',        // bottom rim
  '0 8px 32px rgba(0,0,0,0.09)',               // soft lift
  '0 2px 8px rgba(0,0,0,0.06)',                // base shadow
].join(', ')

const KPI_BG     = 'rgba(255,255,255,0.95)'
const KPI_SHADOW = [
  '0 2px 0 rgba(255,255,255,1) inset',        // top specular
  '0 -1px 0 rgba(0,0,0,0.05) inset',          // bottom rim
  '0 12px 40px rgba(0,0,0,0.10)',              // lift
  '0 3px 12px rgba(0,0,0,0.07)',              // base
].join(', ')

export const glass = {
  card: {
    background: CARD_BG,
    border: CARD_BORDER,
    borderRadius: '22px',
    boxShadow: CARD_SHADOW,
    position: 'relative' as const,
  },
  kpi: {
    background: KPI_BG,
    border: '1px solid rgba(255,255,255,0.99)',
    borderRadius: '28px',
    boxShadow: KPI_SHADOW,
    padding: '24px 26px 22px',
    cursor: 'pointer' as const,
    position: 'relative' as const,
    overflow: 'hidden' as const,
    transition: 'all 0.22s cubic-bezier(0.16,1,0.3,1)',
    userSelect: 'none' as const,
  },
  sidebar: {
    background: 'rgba(235,235,241,0.97)',
    borderRight: '1px solid rgba(255,255,255,0.80)',
    boxShadow: '2px 0 24px rgba(0,0,0,0.07)',
  },
  input: {
    background: 'rgba(255,255,255,0.95)',
    border: '1px solid rgba(0,0,0,0.11)',
    borderRadius: '12px',
    outline: 'none' as const,
    width: '100%',
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
    fontSize: '14px',
    fontWeight: 400 as const,
    padding: '11px 15px',
    color: '#1C1C1E',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06) inset',
    transition: 'all 0.18s ease',
  },
  dropdown: {
    position: 'absolute' as const,
    top: 'calc(100% + 6px)',
    left: 0,
    right: 0,
    zIndex: 9999,
    background: 'rgba(255,255,255,0.99)',
    border: '1px solid rgba(0,0,0,0.09)',
    borderRadius: '14px',
    boxShadow: '0 16px 48px rgba(0,0,0,0.16), 0 2px 8px rgba(0,0,0,0.08)',
    maxHeight: '280px',
    overflowY: 'auto' as const,
  },
}

export const kpiHover = {
  transform: 'translateY(-4px) scale(1.015)',
  boxShadow: [
    '0 2px 0 rgba(255,255,255,1) inset',
    '0 20px 60px rgba(0,0,0,0.13)',
    '0 6px 20px rgba(0,0,0,0.09)',
  ].join(', '),
  background: 'rgba(255,255,255,0.99)',
}
