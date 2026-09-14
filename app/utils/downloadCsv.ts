/**
 * Hand the browser a CSV to save — the way a selected set of rows leaves a
 * dashboard table. Values are quoted only when they need to be (a comma, a
 * quote, a line break), and the file opens with a BOM so Excel on Windows
 * reads the UTF-8 rather than guessing a legacy code page.
 */
export function downloadCsv(filename: string, headers: string[], rows: (string | number | null | undefined)[][]): void {
  const escape = (value: string | number | null | undefined): string => {
    const text = value === null || value === undefined ? '' : String(value)
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
  }
  const content = [headers, ...rows].map(row => row.map(escape).join(',')).join('\r\n')
  const blob = new Blob([`\ufeff${content}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}
