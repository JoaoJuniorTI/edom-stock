'use client'
import { useState, useMemo } from 'react'

export interface Column<T> {
  key: string
  label: string
  sortable?: boolean
  render?: (row: T) => React.ReactNode
  getValue?: (row: T) => string | number | null
}

interface Props<T> {
  columns: Column<T>[]
  data: T[]
  defaultSort?: string
  defaultDir?: 'asc' | 'desc'
  emptyMessage?: string
}

export function SortableTable<T extends { id?: number | string }>({
  columns, data, defaultSort, defaultDir = 'asc', emptyMessage = 'Nenhum dado encontrado.',
}: Props<T>) {
  const [sortKey, setSortKey] = useState<string>(defaultSort || '')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>(defaultDir)

  function handleSort(key: string) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const sorted = useMemo(() => {
    if (!sortKey) return data
    const col = columns.find(c => c.key === sortKey)
    return [...data].sort((a: any, b: any) => {
      const av = col?.getValue ? col.getValue(a) : a[sortKey]
      const bv = col?.getValue ? col.getValue(b) : b[sortKey]
      if (av === null || av === undefined) return 1
      if (bv === null || bv === undefined) return -1
      const cmp = typeof av === 'number' && typeof bv === 'number'
        ? av - bv
        : String(av).localeCompare(String(bv), 'pt-BR')
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [data, sortKey, sortDir, columns])

  function SortIcon({ col }: { col: Column<T> }) {
    if (!col.sortable) return null
    const active = sortKey === col.key
    const icon = !active ? '↕' : sortDir === 'asc' ? '↑' : '↓'
    return <span className="sort-icon">{icon}</span>
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map(col => (
              <th
                key={col.key}
                className={[
                  col.sortable ? 'sortable' : '',
                  sortKey === col.key ? `sort-${sortDir}` : '',
                ].join(' ')}
                onClick={() => col.sortable && handleSort(col.key)}
              >
                {col.label}<SortIcon col={col}/>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 ? (
            <tr>
              <td colSpan={columns.length} style={{ textAlign: 'center', padding: 40, color: 'var(--text-dim)', fontStyle: 'italic' }}>
                {emptyMessage}
              </td>
            </tr>
          ) : sorted.map((row: any, i) => (
            <tr key={row.id ?? i}>
              {columns.map(col => (
                <td key={col.key}>
                  {col.render ? col.render(row) : row[col.key] ?? <span style={{ color: 'var(--text-dim)' }}>—</span>}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
