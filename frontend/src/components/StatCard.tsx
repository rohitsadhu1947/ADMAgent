'use client';

import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import AnimatedCounter from './AnimatedCounter';

interface StatCardProps {
  title: string;
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  icon: LucideIcon;
  trend?: { value: number; label: string };
  trendDirection?: 'up' | 'down' | 'neutral';
  color?: 'red' | 'navy' | 'green' | 'amber' | 'purple' | 'blue';
  delay?: number;
}

const colorMap = {
  red: {
    iconBg: 'bg-brand-red/10',
    iconColor: 'text-brand-red',
    border: 'border-brand-red/20',
    glow: 'shadow-brand-red/5',
  },
  navy: {
    iconBg: 'bg-brand-navy/20',
    iconColor: 'text-blue-400',
    border: 'border-brand-navy-light/20',
    glow: 'shadow-blue-500/5',
  },
  green: {
    iconBg: 'bg-emerald-500/10',
    iconColor: 'text-emerald-400',
    border: 'border-emerald-500/20',
    glow: 'shadow-emerald-500/5',
  },
  amber: {
    iconBg: 'bg-amber-500/10',
    iconColor: 'text-amber-400',
    border: 'border-amber-500/20',
    glow: 'shadow-amber-500/5',
  },
  purple: {
    iconBg: 'bg-purple-500/10',
    iconColor: 'text-purple-400',
    border: 'border-purple-500/20',
    glow: 'shadow-purple-500/5',
  },
  blue: {
    iconBg: 'bg-blue-500/10',
    iconColor: 'text-blue-400',
    border: 'border-blue-500/20',
    glow: 'shadow-blue-500/5',
  },
};

export default function StatCard({
  title,
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
  icon: Icon,
  trend,
  trendDirection = 'up',
  color = 'red',
  delay = 0,
}: StatCardProps) {
  const colors = colorMap[color];

  return (
    <div
      className={`glass-card-hover p-5 ${colors.border} animate-slide-up`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-lg ${colors.iconBg}`}>
          <Icon className={`w-5 h-5 ${colors.iconColor}`} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-medium ${
            trendDirection === 'up' ? 'text-emerald-400' :
            trendDirection === 'down' ? 'text-red-400' : 'text-gray-400'
          }`}>
            {trendDirection === 'up' ? <TrendingUp className="w-3 h-3" /> :
             trendDirection === 'down' ? <TrendingDown className="w-3 h-3" /> :
             <Minus className="w-3 h-3" />}
            <span>{trend.value > 0 ? '+' : ''}{trend.value}%</span>
          </div>
        )}
      </div>

      <div className="space-y-1">
        <AnimatedCounter
          end={value}
          prefix={prefix}
          suffix={suffix}
          decimals={decimals}
          className="stat-value"
          duration={1500 + delay}
        />
        <p className="text-sm text-gray-400">{title}</p>
        {trend && (
          <p className="text-xs text-gray-500">{trend.label}</p>
        )}
      </div>
    </div>
  );
}
