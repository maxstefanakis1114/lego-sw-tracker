import { factionColors } from '../../services/factionColors';

interface FactionBreakdownProps {
  data: Array<{ faction: string; count: number; total: number }>;
}

export function FactionBreakdown({ data }: FactionBreakdownProps) {
  const maxTotal = Math.max(...data.map(d => d.total), 1);

  return (
    <div className="glass rounded-xl p-5">
      <h3 className="text-sm font-semibold text-sw-text-dim mb-4">Factions</h3>
      <div className="space-y-2.5 max-h-80 overflow-y-auto">
        {data.map(({ faction, count, total }) => (
          <div key={faction}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-sw-text">{faction}</span>
              <span className="text-sw-text-dim">{count}/{total}</span>
            </div>
            <div className="w-full h-2 bg-sw-dark rounded-full overflow-hidden">
              <div className="h-full rounded-full relative" style={{ width: `${(total / maxTotal) * 100}%` }}>
                <div
                  className="absolute inset-0 rounded-full opacity-25"
                  style={{ backgroundColor: factionColors[faction] || '#757575' }}
                />
                <div
                  className="h-full rounded-full"
                  style={{
                    width: total > 0 ? `${(count / total) * 100}%` : '0%',
                    backgroundColor: factionColors[faction] || '#757575',
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
