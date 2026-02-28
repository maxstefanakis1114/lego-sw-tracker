export interface CatalogMinifig {
  id: string;
  name: string;
  imageUrl: string;
  year: number;
  sets: Array<{ id: string; name: string; year: number }>;
  faction: string;
  numSets: number;
}

export type ItemStatus = 'owned' | 'wanted' | 'for-sale' | 'sold';

export type ItemCondition = 'new' | 'used' | 'damaged';

export interface CollectionEntry {
  minifigId: string;
  status: ItemStatus;
  quantity: number;
  forSaleQuantity: number;
  condition: ItemCondition;
  pricePaid: number | null;
  priceSold: number | null;
  askingPrice: number | null;
  notes: string;
  customImageUrl: string;
  sku: string;
  dateAdded: string;
  dateModified: string;
  purchaseLotId?: string;
  storageLocation?: string;
  photoUrls?: string[];
  wantPriority?: WantPriority;
  targetPrice?: number | null;
  crackedQuantity?: number;
}

export interface WhatnotCSVRow {
  Title: string;
  Description: string;
  SKU: string;
  Quantity: string;
  Price: string;
  'Shipping Price': string;
  Category: string;
  'Sub Category': string;
  Condition: string;
  Shipping: string;
  Hazmat: string;
  'Photo 1 URL': string;
  'Photo 2 URL': string;
  'Photo 3 URL': string;
  'Photo 4 URL': string;
  'Photo 5 URL': string;
}

export interface CatalogFilter {
  search: string;
  yearMin: number | null;
  yearMax: number | null;
  faction: string;
  status: ItemStatus | 'all' | 'none';
  sortBy: 'name' | 'year' | 'id' | 'value';
  sortDir: 'asc' | 'desc';
}

export interface CollectionStats {
  totalOwned: number;
  totalWanted: number;
  totalForSale: number;
  totalSold: number;
  totalInCollection: number;
  catalogSize: number;
  completionPercent: number;
  totalPaid: number;
  totalSoldValue: number;
  totalAskingValue: number;
  factionBreakdown: Array<{ faction: string; count: number; total: number }>;
  yearBreakdown: Array<{ year: number; count: number }>;
  recentActivity: Array<{ entry: CollectionEntry; minifig: CatalogMinifig }>;
}

export interface ExportSettings {
  shippingPrice: string;
  defaultCondition: string;
  descriptionTemplate: string;
  markupPercent?: number;
  roundTo99?: boolean;
}

export type TabId = 'dashboard' | 'catalog' | 'collection' | 'inventory' | 'sales' | 'export';

// Want list priority
export type WantPriority = 'high' | 'medium' | 'low';

// Sale platforms
export type SalePlatform = 'whatnot' | 'ebay' | 'bricklink' | 'mercari' | 'other';

// Purchase lot for tracking bulk buys
export interface PurchaseLotItem {
  minifigId: string;
  allocatedCost: number;
}

export interface PurchaseLot {
  id: string;
  name: string;
  source: string;
  totalCost: number;
  items: PurchaseLotItem[];
  notes: string;
  dateCreated: string;
  dateModified: string;
}

// Sale record with full financial breakdown
export interface SaleRecord {
  id: string;
  minifigId: string;
  salePrice: number;
  platform: SalePlatform;
  platformFee: number;
  shippingCost: number;
  shippingCharged: number;
  costBasis: number;
  netProfit: number;
  date: string;
  notes: string;
  dateCreated: string;
}

// Export history entry
export interface ExportHistoryEntry {
  id: string;
  date: string;
  itemCount: number;
  filename: string;
}

// Business stats for dashboard
export interface BusinessStats {
  totalRevenue: number;
  totalCOGS: number;
  totalFees: number;
  totalShippingCost: number;
  totalShippingCharged: number;
  netProfit: number;
  margin: number;
  totalSales: number;
  monthlySales: Array<{ month: string; revenue: number; profit: number; count: number }>;
  topSellers: Array<{ minifigId: string; name: string; profit: number; count: number }>;
  inventoryCostBasis: number;
  inventoryMarketValue: number;
  unrealizedGain: number;
}
