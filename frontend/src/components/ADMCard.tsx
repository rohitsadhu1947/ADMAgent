'use client';

import { ADM } from '@/data/types';
import { Phone, TrendingUp, TrendingDown, Minus, MessageSquare } from 'lucide-react';
import ProgressRing from './ProgressRing';

interface ADMCardProps {
  adm: ADM;
}

const tierConfig = {
  high: { label: 'High Performer', className: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' },
  average: { label: 'Average', className: 'bg-amber-500/10 text-amber-400 border border-amber-500/20' },
  struggling: { label: 'Needs Support', className: 'bg-red-500/10 text-red-400 border border-red-500/20' },
};

function getTier(score: number): 'high' | 'average' | 'struggling' {
  if (score >= 85) return 'high';
  if (score >= 70) return 'average';
  return 'struggling';
}

export default function ADMCard({ adm }: ADMCardProps) {
  const tier = getTier(adm.score);
  const tierStyle = tierConfig[tier];
  const capacityPercent = (adm.agents_assigned / adm.capacity) * 100;

  return (
    <div className="glass-card-hover p-5 group">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-brand-red to-brand-navy flex items-center justify-center">
            <span className="text-white font-bold text-sm">{adm.avatar_initials}</span>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white group-hover:text-brand-red-light transition-colors">
              {adm.name}
            </h3>
            <p className="text-xs text-gray-500">
              {adm.city}, {adm.region}
            </p>
          </div>
        </div>
        <span className={`badge text-[10px] ${tierStyle.className}`}>
          {tierStyle.label}
        </span>
      </div>

      {/* Activation Rate Ring + Stats */}
      <div className="flex items-center gap-4 mb-4">
        <ProgressRing
          progress={adm.activation_rate}
          size={70}
          strokeWidth={5}
          color={adm.activation_rate >= 70 ? '#10B981' : adm.activation_rate >= 50 ? '#F59E0B' : '#EF4444'}
          label="Rate"
        />
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Agents Activated</span>
            <span className="text-sm font-medium text-white">{adm.agents_activated}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Avg Response</span>
            <span className="text-sm font-medium text-white">{adm.avg_response_time} days</span>
          </div>
        </div>
      </div>

      {/* Capacity Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-500">Capacity</span>
          <span className="text-xs text-gray-400">
            {adm.agents_assigned}/{adm.capacity} agents
          </span>
        </div>
        <div className="h-2 bg-surface-card rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${capacityPercent}%`,
              background:
                capacityPercent > 90
                  ? 'linear-gradient(90deg, #EF4444, #F87171)'
                  : capacityPercent > 70
                  ? 'linear-gradient(90deg, #F59E0B, #FBBF24)'
                  : 'linear-gradient(90deg, #10B981, #34D399)',
            }}
          />
        </div>
      </div>

      {/* Footer Stats */}
      <div className="flex items-center justify-between pt-3 border-t border-surface-border/40">
        <div className="flex items-center gap-1.5">
          <Phone className="w-3.5 h-3.5 text-gray-500" />
          <span className="text-xs text-gray-400">{adm.calls_today} calls today</span>
        </div>
        <div className="flex items-center gap-1.5">
          {adm.trend === 'up' ? (
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
          ) : adm.trend === 'down' ? (
            <TrendingDown className="w-3.5 h-3.5 text-red-400" />
          ) : (
            <Minus className="w-3.5 h-3.5 text-gray-400" />
          )}
          <span className="text-xs font-medium text-gray-400">Score: {adm.score}</span>
        </div>
      </div>
    </div>
  );
}
