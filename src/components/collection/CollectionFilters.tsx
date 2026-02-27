import { Search } from 'lucide-react';
import type { ItemStatus } from '../../types';

interface CollectionFiltersProps {
  search: string;
  onSearchChange: (search: string) => void;
  statusFilter: ItemStatus | 'all';
  onStatusFilterChange: (status: ItemStatus | 'all') => void;
  dealCount?: number;
}

const statusTabs: Array<{ value: ItemStatus | 'all'; label: string; color: string }> = [
  { value: 'all', label: 'All', color: 'text-sw-gold border-sw-gold' },
  { value: 'owned', label: 'Owned', color: 'text-sw-green border-sw-green' },
  { value: 'wanted', label: 'Wanted', color: 'text-sw-blue border-sw-blue' },
  { value: 'for-sale', label: 'For Sale', color: 'text-sw-orange border-sw-orange' },
  { value: 'sold', label: 'Sold', color: 'text-sw-purple border-sw-purple' },
];

export function CollectionFilters({ search, onSearchChange, statusFilter, onStatusFilterChange, dealCount }: CollectionFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
      <div className="flex gap-1 overflow-x-auto">
        {statusTabs.map(({ value, label, color }) => (
          <button
            key={value}
            onClick={() => onStatusFilterChange(value)}
            className={`px-3 py-1.5 text-sm rounded-lg border transition-colors cursor-pointer whitespace-nowrap ${
              statusFilter === value
                ? `${color} font-semibold`
                : 'text-sw-text-dim border-sw-border hover:text-sw-text'
            }`}
          >
            {label}
            {value === 'wanted' && dealCount != null && dealCount > 0 && (
              <span className="ml-1 text-[10px] bg-sw-green/20 text-sw-green px-1 py-0.5 rounded-full">
                {dealCount}
              </span>
            )}
          </button>
        ))}
      </div>
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-sw-text-dim" size={16} />
        <input
          type="text"
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          placeholder="Search collection..."
          className="w-full bg-sw-dark border border-sw-border rounded-lg pl-9 pr-3 py-2 text-sm text-sw-text placeholder:text-sw-text-dim/50 focus:outline-none focus:border-sw-gold/50"
        />
      </div>
    </div>
  );
}
