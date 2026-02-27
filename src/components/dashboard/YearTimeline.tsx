interface YearTimelineProps {
  data: Array<{ year: number; count: number }>;
}

export function YearTimeline({ data }: YearTimelineProps) {
  if (data.length === 0) {
    return (
      <div className="glass rounded-xl p-5">
        <h3 className="text-sm font-semibold text-sw-text-dim mb-4">Collection by Year</h3>
        <p className="text-sw-text-dim text-sm text-center py-8">No items in collection yet</p>
      </div>
    );
  }

  const maxCount = Math.max(...data.map(d => d.count), 1);

  return (
    <div className="glass rounded-xl p-5">
      <h3 className="text-sm font-semibold text-sw-text-dim mb-4">Collection by Year</h3>
      <div className="flex items-end gap-1 h-32 overflow-x-auto">
        {data.map(({ year, count }) => (
          <div key={year} className="flex flex-col items-center gap-1 min-w-[24px] flex-1">
            <span className="text-[10px] text-sw-text-dim">{count}</span>
            <div
              className="w-full rounded-t bg-sw-gold/80 transition-all duration-300 min-h-[2px]"
              style={{ height: `${(count / maxCount) * 100}%` }}
            />
            <span className="text-[9px] text-sw-text-dim -rotate-45 origin-top-left mt-1 whitespace-nowrap">{year}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
