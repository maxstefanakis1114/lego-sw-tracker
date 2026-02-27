import { LayoutDashboard, BookOpen, FolderHeart, Warehouse, Receipt, Download } from 'lucide-react';
import type { TabId } from '../../types';

const tabs: Array<{ id: TabId; label: string; icon: typeof LayoutDashboard }> = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'catalog', label: 'Catalog', icon: BookOpen },
  { id: 'collection', label: 'Collection', icon: FolderHeart },
  { id: 'inventory', label: 'Inventory', icon: Warehouse },
  { id: 'sales', label: 'Sales', icon: Receipt },
  { id: 'export', label: 'Export', icon: Download },
];

interface TabBarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export function TabBar({ activeTab, onTabChange }: TabBarProps) {
  return (
    <nav className="border-b border-sw-border bg-sw-dark/50">
      <div className="max-w-7xl mx-auto px-4 flex gap-1 overflow-x-auto">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === id
                ? 'border-sw-gold text-sw-gold'
                : 'border-transparent text-sw-text-dim hover:text-sw-text hover:border-sw-border'
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>
    </nav>
  );
}
