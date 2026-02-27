import type { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  color?: string;
}

const glowMap: Record<string, string> = {
  'text-sw-gold': 'rgba(255, 197, 0, 0.06)',
  'text-sw-green': 'rgba(102, 187, 106, 0.06)',
  'text-sw-blue': 'rgba(79, 195, 247, 0.06)',
  'text-sw-orange': 'rgba(255, 167, 38, 0.06)',
  'text-sw-purple': 'rgba(171, 71, 188, 0.06)',
  'text-sw-red': 'rgba(239, 83, 80, 0.06)',
  'text-sw-text': 'rgba(232, 232, 232, 0.04)',
};

export function StatCard({ label, value, icon, color = 'text-sw-gold' }: StatCardProps) {
  const glow = glowMap[color] || 'rgba(255, 197, 0, 0.06)';

  return (
    <div
      className="glass rounded-xl p-4 flex flex-col gap-1 relative overflow-hidden"
      style={{ backgroundImage: `radial-gradient(ellipse at bottom right, ${glow}, transparent 70%)` }}
    >
      <div className="flex items-center gap-2 text-sw-text-dim text-sm">
        {icon}
        {label}
      </div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
    </div>
  );
}
