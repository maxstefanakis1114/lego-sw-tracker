import { useEffect, useState } from 'react';
import { Search, RotateCcw } from 'lucide-react';
import type { CatalogFilter } from '../../types';
import { getAllFactions, getYearRange } from '../../services/catalogService';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';

interface CatalogFiltersProps {
  filter: CatalogFilter;
  onFilterChange: (updates: Partial<CatalogFilter>) => void;
  onReset: () => void;
  totalResults: number;
}

const factions = getAllFactions();
const [yearMin, yearMax] = getYearRange();

export function CatalogFilters({ filter, onFilterChange, onReset, totalResults }: CatalogFiltersProps) {
  const [searchInput, setSearchInput] = useState(filter.search);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filter.search) {
        onFilterChange({ search: searchInput });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, filter.search, onFilterChange]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[200px]">
          <label className="text-xs text-sw-text-dim">Search</label>
          <div className="relative mt-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-sw-text-dim" size={16} />
            <input
              type="text"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Name, ID, or set name..."
              className="w-full bg-sw-dark border border-sw-border rounded-lg pl-9 pr-3 py-2 text-sm text-sw-text placeholder:text-sw-text-dim/50 focus:outline-none focus:border-sw-gold/50 transition-colors"
            />
          </div>
        </div>

        <Select
          label="Faction"
          value={filter.faction}
          onChange={e => onFilterChange({ faction: e.target.value })}
          options={[
            { value: 'all', label: 'All Factions' },
            ...factions.map(f => ({ value: f, label: f })),
          ]}
        />

        <Select
          label="Status"
          value={filter.status}
          onChange={e => onFilterChange({ status: e.target.value as CatalogFilter['status'] })}
          options={[
            { value: 'all', label: 'All Items' },
            { value: 'none', label: 'Not in Collection' },
            { value: 'owned', label: 'Owned' },
            { value: 'wanted', label: 'Wanted' },
            { value: 'for-sale', label: 'For Sale' },
            { value: 'sold', label: 'Sold' },
          ]}
        />

        <div className="flex gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-sw-text-dim">Year</label>
            <div className="flex gap-1 items-center">
              <input
                type="number"
                min={yearMin}
                max={yearMax}
                value={filter.yearMin ?? ''}
                onChange={e => onFilterChange({ yearMin: e.target.value ? Number(e.target.value) : null })}
                placeholder={String(yearMin)}
                className="w-20 bg-sw-dark border border-sw-border rounded-lg px-2 py-2 text-sm text-sw-text focus:outline-none focus:border-sw-gold/50"
              />
              <span className="text-sw-text-dim">-</span>
              <input
                type="number"
                min={yearMin}
                max={yearMax}
                value={filter.yearMax ?? ''}
                onChange={e => onFilterChange({ yearMax: e.target.value ? Number(e.target.value) : null })}
                placeholder={String(yearMax)}
                className="w-20 bg-sw-dark border border-sw-border rounded-lg px-2 py-2 text-sm text-sw-text focus:outline-none focus:border-sw-gold/50"
              />
            </div>
          </div>
        </div>

        <Select
          label="Sort"
          value={`${filter.sortBy}-${filter.sortDir}`}
          onChange={e => {
            const [sortBy, sortDir] = e.target.value.split('-') as [CatalogFilter['sortBy'], CatalogFilter['sortDir']];
            onFilterChange({ sortBy, sortDir });
          }}
          options={[
            { value: 'name-asc', label: 'Name A-Z' },
            { value: 'name-desc', label: 'Name Z-A' },
            { value: 'year-asc', label: 'Year Old→New' },
            { value: 'year-desc', label: 'Year New→Old' },
            { value: 'id-asc', label: 'ID A-Z' },
            { value: 'id-desc', label: 'ID Z-A' },
          ]}
        />

        <Button variant="ghost" size="sm" onClick={onReset} className="mb-0.5">
          <RotateCcw size={14} />
          Reset
        </Button>
      </div>

      <div className="text-sm text-sw-text-dim">
        {totalResults} minifigures found
      </div>
    </div>
  );
}
