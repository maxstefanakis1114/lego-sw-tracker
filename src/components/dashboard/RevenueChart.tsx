interface RevenueChartProps {
  data: Array<{ month: string; revenue: number; profit: number; count: number }>;
}

export function RevenueChart({ data }: RevenueChartProps) {
  if (data.length === 0) return null;

  const maxRevenue = Math.max(...data.map(d => d.revenue), 1);

  return (
    <div className="glass rounded-xl p-5">
      <h3 className="text-sm font-semibold text-sw-text-dim mb-4">Monthly Revenue & Profit</h3>
      <div className="flex items-end gap-2 h-32 overflow-x-auto">
        {data.map(({ month, revenue, profit }) => {
          const revenueH = (revenue / maxRevenue) * 100;
          const profitH = Math.abs(profit) / maxRevenue * 100;
          return (
            <div key={month} className="flex flex-col items-center gap-1 min-w-[40px] flex-1">
              <span className="text-[10px] text-sw-gold">${revenue.toFixed(0)}</span>
              <div className="w-full flex flex-col items-center gap-0.5 relative" style={{ height: `${revenueH}%` }}>
                <div
                  className="w-full rounded-t bg-sw-gold/40 absolute bottom-0"
                  style={{ height: '100%' }}
                />
                <div
                  className={`w-3/4 rounded-t absolute bottom-0 ${profit >= 0 ? 'bg-sw-green/70' : 'bg-sw-red/70'}`}
                  style={{ height: `${profitH}%` }}
                />
              </div>
              <span className="text-[9px] text-sw-text-dim -rotate-45 origin-top-left mt-1 whitespace-nowrap">
                {month}
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-4 mt-4 text-[10px] text-sw-text-dim">
        <span className="flex items-center gap-1"><span className="w-3 h-2 bg-sw-gold/40 rounded" /> Revenue</span>
        <span className="flex items-center gap-1"><span className="w-3 h-2 bg-sw-green/70 rounded" /> Profit</span>
      </div>
    </div>
  );
}
