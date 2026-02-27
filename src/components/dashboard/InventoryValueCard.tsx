import { TrendingUp } from 'lucide-react';

interface InventoryValueCardProps {
  costBasis: number;
  marketValue: number;
  unrealizedGain: number;
}

export function InventoryValueCard({ costBasis, marketValue, unrealizedGain }: InventoryValueCardProps) {
  if (costBasis === 0 && marketValue === 0) return null;

  const gainColor = unrealizedGain >= 0 ? 'text-sw-green' : 'text-sw-red';

  return (
    <div className="glass rounded-xl p-5">
      <h3 className="text-sm font-semibold text-sw-text-dim mb-3 flex items-center gap-1.5">
        <TrendingUp size={14} />
        Inventory Value
      </h3>
      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-sw-text-dim">Cost Basis</span>
          <span className="text-sw-text font-semibold">${costBasis.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-sw-text-dim">Market Value</span>
          <span className="text-sw-gold font-semibold">${marketValue.toFixed(2)}</span>
        </div>
        <div className="border-t border-sw-border pt-2 flex justify-between text-sm">
          <span className="text-sw-text-dim">Unrealized Gain</span>
          <span className={`font-bold ${gainColor}`}>
            {unrealizedGain >= 0 ? '+' : ''}${unrealizedGain.toFixed(2)}
          </span>
        </div>
        {/* Visual bar */}
        {marketValue > 0 && (
          <div className="h-2 rounded-full bg-sw-border overflow-hidden">
            <div
              className="h-full bg-sw-gold/70 rounded-full transition-all"
              style={{ width: `${Math.min((costBasis / marketValue) * 100, 100)}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
