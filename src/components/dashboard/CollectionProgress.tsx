interface CollectionProgressProps {
  owned: number;
  total: number;
  percent: number;
}

export function CollectionProgress({ owned, total, percent }: CollectionProgressProps) {
  return (
    <div className="glass rounded-xl p-5">
      <h3 className="text-sm font-semibold text-sw-text-dim mb-3">Collection Progress</h3>
      <div className="flex items-end gap-3 mb-3">
        <span className="text-3xl font-bold text-sw-gold">{percent.toFixed(1)}%</span>
        <span className="text-sm text-sw-text-dim mb-1">{owned} / {total} unique minifigs</span>
      </div>
      <div className="w-full h-3 bg-sw-dark rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-sw-gold-dim to-sw-gold rounded-full transition-all duration-500"
          style={{ width: `${Math.min(100, percent)}%` }}
        />
      </div>
    </div>
  );
}
