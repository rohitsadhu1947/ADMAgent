import { LifecycleState } from '@/data/types';

interface StatusBadgeProps {
  status: LifecycleState;
  size?: 'sm' | 'md';
}

const statusConfig: Record<LifecycleState, { label: string; className: string; dot: string }> = {
  dormant: {
    label: 'Dormant',
    className: 'bg-red-500/10 text-red-400 border border-red-500/20',
    dot: 'bg-red-400',
  },
  at_risk: {
    label: 'At Risk',
    className: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    dot: 'bg-amber-400',
  },
  contacted: {
    label: 'Contacted',
    className: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
    dot: 'bg-blue-400',
  },
  engaged: {
    label: 'Engaged',
    className: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
    dot: 'bg-purple-400',
  },
  trained: {
    label: 'Trained',
    className: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',
    dot: 'bg-indigo-400',
  },
  active: {
    label: 'Active',
    className: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    dot: 'bg-emerald-400',
  },
};

export default function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${config.className} ${
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-1 text-xs'
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot} animate-pulse`} />
      {config.label}
    </span>
  );
}
