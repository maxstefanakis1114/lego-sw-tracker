import type { CatalogMinifig, CollectionEntry, ExportSettings, WhatnotCSVRow } from '../types';
import { getMarketPrice } from './priceService';
import { applyMarkupAndRound } from './financialService';

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function buildWhatnotRows(
  forSaleEntries: Array<{ entry: CollectionEntry; minifig: CatalogMinifig }>,
  settings: ExportSettings
): WhatnotCSVRow[] {
  const rows: WhatnotCSVRow[] = [];

  for (const { entry, minifig } of forSaleEntries) {
    const description = settings.descriptionTemplate
      .replace('{name}', minifig.name)
      .replace('{id}', minifig.id)
      .replace('{year}', String(minifig.year))
      .replace('{condition}', entry.condition)
      .replace('{notes}', entry.notes);

    const conditionMap: Record<string, string> = {
      new: 'Brand New',
      used: 'Used',
      damaged: 'Used',
    };

    // Calculate price with optional markup and rounding
    let price = entry.askingPrice ?? getMarketPrice(minifig.id) ?? 0;
    if (settings.markupPercent && settings.markupPercent > 0 && entry.pricePaid !== null) {
      price = applyMarkupAndRound(entry.pricePaid, settings.markupPercent, settings.roundTo99 ?? false);
    } else if (settings.roundTo99 && price > 0) {
      price = Math.floor(price) + 0.99;
    }

    // Photo URLs: main image + up to 4 additional from photoUrls
    const photos = entry.photoUrls ?? [];
    const condition = conditionMap[entry.condition] || settings.defaultCondition;
    const mainPhoto = entry.customImageUrl || minifig.imageUrl;

    const cracked = entry.crackedQuantity ?? 0;
    const totalQty = entry.quantity;
    const normalQty = totalQty - cracked;

    if (cracked > 0 && normalQty > 0) {
      // Split into two rows: normal copies and cracked copies
      rows.push({
        Title: `LEGO Star Wars Minifigure - ${minifig.name}`,
        Description: description,
        SKU: entry.sku || minifig.id,
        Quantity: String(normalQty),
        Price: String(price),
        'Shipping Price': settings.shippingPrice || '0',
        Category: 'Toys & Hobbies',
        'Sub Category': 'LEGO',
        Condition: condition,
        Shipping: '1-3 oz',
        Hazmat: 'Not Hazmat',
        'Photo 1 URL': mainPhoto,
        'Photo 2 URL': photos[0] ?? '',
        'Photo 3 URL': photos[1] ?? '',
        'Photo 4 URL': photos[2] ?? '',
        'Photo 5 URL': photos[3] ?? '',
      });
      rows.push({
        Title: `LEGO Star Wars Minifigure - ${minifig.name} (Cracked)`,
        Description: description,
        SKU: (entry.sku || minifig.id) + '-CRACKED',
        Quantity: String(cracked),
        Price: String(price),
        'Shipping Price': settings.shippingPrice || '0',
        Category: 'Toys & Hobbies',
        'Sub Category': 'LEGO',
        Condition: 'Used',
        Shipping: '1-3 oz',
        Hazmat: 'Not Hazmat',
        'Photo 1 URL': mainPhoto,
        'Photo 2 URL': photos[0] ?? '',
        'Photo 3 URL': photos[1] ?? '',
        'Photo 4 URL': photos[2] ?? '',
        'Photo 5 URL': photos[3] ?? '',
      });
    } else {
      // All same — single row (append "(Cracked)" if all are cracked)
      const titleSuffix = cracked > 0 && cracked === totalQty ? ' (Cracked)' : '';
      const skuSuffix = cracked > 0 && cracked === totalQty ? '-CRACKED' : '';
      rows.push({
        Title: `LEGO Star Wars Minifigure - ${minifig.name}${titleSuffix}`,
        Description: description,
        SKU: (entry.sku || minifig.id) + skuSuffix,
        Quantity: String(totalQty),
        Price: String(price),
        'Shipping Price': settings.shippingPrice || '0',
        Category: 'Toys & Hobbies',
        'Sub Category': 'LEGO',
        Condition: cracked > 0 ? 'Used' : condition,
        Shipping: '1-3 oz',
        Hazmat: 'Not Hazmat',
        'Photo 1 URL': mainPhoto,
        'Photo 2 URL': photos[0] ?? '',
        'Photo 3 URL': photos[1] ?? '',
        'Photo 4 URL': photos[2] ?? '',
        'Photo 5 URL': photos[3] ?? '',
      });
    }
  }

  return rows;
}

export function generateCSV(rows: WhatnotCSVRow[]): string {
  if (rows.length === 0) return '';

  const headers = Object.keys(rows[0]) as Array<keyof WhatnotCSVRow>;
  const lines = [
    headers.map(h => escapeCSV(h)).join(','),
    ...rows.map(row => headers.map(h => escapeCSV(row[h])).join(',')),
  ];
  return lines.join('\n');
}

export function downloadCSV(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
