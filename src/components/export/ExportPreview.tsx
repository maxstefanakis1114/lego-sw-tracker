import type { WhatnotCSVRow } from '../../types';

interface ExportPreviewProps {
  rows: WhatnotCSVRow[];
}

export function ExportPreview({ rows }: ExportPreviewProps) {
  if (rows.length === 0) return null;

  const previewRows = rows.slice(0, 10);

  return (
    <div className="glass rounded-xl p-5">
      <h3 className="text-sm font-semibold text-sw-text-dim mb-3">
        Preview ({rows.length} items{rows.length > 10 ? ', showing first 10' : ''})
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-sw-border">
              <th className="text-left py-2 px-2 text-sw-text-dim font-medium">Title</th>
              <th className="text-left py-2 px-2 text-sw-text-dim font-medium">SKU</th>
              <th className="text-right py-2 px-2 text-sw-text-dim font-medium">Qty</th>
              <th className="text-right py-2 px-2 text-sw-text-dim font-medium">Price</th>
              <th className="text-left py-2 px-2 text-sw-text-dim font-medium">Condition</th>
            </tr>
          </thead>
          <tbody>
            {previewRows.map((row, i) => (
              <tr key={i} className="border-b border-sw-border/50 hover:bg-sw-border/20">
                <td className="py-2 px-2 text-sw-text max-w-[300px] truncate">{row.Title}</td>
                <td className="py-2 px-2 text-sw-text-dim font-mono">{row.SKU}</td>
                <td className="py-2 px-2 text-sw-text text-right">{row.Quantity}</td>
                <td className="py-2 px-2 text-sw-gold text-right">${row.Price}</td>
                <td className="py-2 px-2 text-sw-text-dim">{row.Condition}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
