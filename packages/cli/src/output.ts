export function formatTable(rows: Record<string, unknown>[], columns: string[]): string {
  const widths = columns.map(c => Math.max(c.length, ...rows.map(r => String(r[c] ?? '').length)))
  const line = (cells: string[]) => cells.map((cell, i) => cell.padEnd(widths[i])).join('  ')
  const header = line(columns)
  const body = rows.map(r => line(columns.map(c => String(r[c] ?? ''))))
  return [header, ...body].join('\n')
}

export function printResult(data: unknown, asJson: boolean, columns?: string[]): void {
  if (asJson || !columns || !Array.isArray(data)) {
    console.log(JSON.stringify(data, null, 2))
    return
  }
  console.log(formatTable(data as Record<string, unknown>[], columns))
}

export function printError(err: unknown): void {
  const msg = err instanceof Error ? err.message : String(err)
  console.error(`✖ ${msg}`)
}
