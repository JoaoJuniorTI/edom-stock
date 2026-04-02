const FONT = "'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif"

const CARD_SHADOW = [
  '0 1px 0 rgba(255,255,255,0.95) inset',
  '0 -0.5px 0 rgba(0,0,0,0.04) inset',
  '0 4px 16px rgba(0,0,0,0.07)',
  '0 1px 4px rgba(0,0,0,0.05)',
].join(', ')

const KPI_SHADOW = [
  '0 2px 0 rgba(255,255,255,1) inset',
  '0 -0.5px 0 rgba(0,0,0,0.05) inset',
  '0 8px 28px rgba(0,0,0,0.09)',
  '0 2px 8px rgba(0,0,0,0.06)',
].join(', ')

export const glass = {
  card: {
    background: 'rgba(255,255,255,0.92)',
    border: '1px solid rgba(255,255,255,0.98)',
    borderRadius: '18px',
    boxShadow: CARD_SHADOW,
    position: 'relative' as const,
  },
  kpi: {
    background: 'rgba(255,255,255,0.94)',
    border: '1px solid rgba(255,255,255,0.99)',
    borderRadius: '22px',
    boxShadow: KPI_SHADOW,
    padding: '22px 24px 20px',
    cursor: 'pointer' as const,
    position: 'relative' as const,
    overflow: 'hidden' as const,
    transition: 'all 0.2s cubic-bezier(0.16,1,0.3,1)',
    userSelect: 'none' as const,
  },
  sidebar: {
    background: 'rgba(233,233,240,0.97)',
    borderRight: '1px solid rgba(255,255,255,0.80)',
    boxShadow: '2px 0 20px rgba(0,0,0,0.06)',
  },
  input: {
    background: 'rgba(255,255,255,0.96)',
    border: '1px solid rgba(0,0,0,0.10)',
    borderRadius: '10px',
    outline: 'none' as const,
    width: '100%',
    fontFamily: FONT,
    fontSize: '13.5px',
    fontWeight: 400 as const,
    letterSpacing: '-0.01em',
    padding: '10px 14px',
    color: '#111318',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05) inset',
    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
  },
  dropdown: {
    position: 'absolute' as const,
    top: 'calc(100% + 6px)',
    left: 0,
    right: 0,
    zIndex: 9999,
    background: 'rgba(255,255,255,0.99)',
    border: '1px solid rgba(0,0,0,0.09)',
    borderRadius: '12px',
    boxShadow: '0 12px 40px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.08)',
    maxHeight: '280px',
    overflowY: 'auto' as const,
  },
}

export const kpiHover = {
  transform: 'translateY(-3px) scale(1.012)',
  boxShadow: [
    '0 2px 0 rgba(255,255,255,1) inset',
    '0 16px 48px rgba(0,0,0,0.12)',
    '0 4px 16px rgba(0,0,0,0.08)',
  ].join(', '),
  background: 'rgba(255,255,255,0.98)',
}
