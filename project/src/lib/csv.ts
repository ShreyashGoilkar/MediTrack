/** Convert an array of objects to CSV and trigger a browser download. */
export function downloadCSV(filename: string, rows: Record<string, string | number>[]): void {
  if (rows.length === 0) {
    // Still produce a header-less file if rows is empty
    const blob = new Blob([''], { type: 'text/csv;charset=utf-8;' });
    triggerDownload(filename, blob);
    return;
  }

  const headers = Object.keys(rows[0]);
  const escape = (val: string | number) => {
    const s = String(val ?? '');
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const lines = [
    headers.join(','),
    ...rows.map((row) => headers.map((h) => escape(row[h])).join(',')),
  ];

  const csv = lines.join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(filename, blob);
}

function triggerDownload(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
