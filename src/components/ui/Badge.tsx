import type { ItemStatus } from '../../types';

const statusStyles: Record<ItemStatus, string> = {
  owned: 'bg-sw-green/20 text-sw-green border-sw-green/30',
  wanted: 'bg-sw-blue/20 text-sw-blue border-sw-blue/30',
  'for-sale': 'bg-sw-orange/20 text-sw-orange border-sw-orange/30',
  sold: 'bg-sw-purple/20 text-sw-purple border-sw-purple/30',
};

const statusLabels: Record<ItemStatus, string> = {
  owned: 'Owned',
  wanted: 'Wanted',
  'for-sale': 'For Sale',
  sold: 'Sold',
};

export function Badge({ status }: { status: ItemStatus }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border ${statusStyles[status]}`}>
      {statusLabels[status]}
    </span>
  );
}

export function StatusDot({ status }: { status: ItemStatus }) {
  const dotColors: Record<ItemStatus, string> = {
    owned: 'bg-sw-green',
    wanted: 'bg-sw-blue',
    'for-sale': 'bg-sw-orange',
    sold: 'bg-sw-purple',
  };
  return <span className={`inline-block w-2.5 h-2.5 rounded-full ${dotColors[status]}`} />;
}
