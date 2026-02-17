'use client';

import { FunnelData } from '@/data/types';

interface FunnelChartProps {
  data: FunnelData[];
}

export default function FunnelChart({ data }: FunnelChartProps) {
  const maxCount = data[0]?.count || 1;

  return (
    <div className="space-y-3">
      {data.map((item, index) => {
        const widthPercent = (item.count / maxCount) * 100;
        return (
          <div key={item.stage} className="group">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm text-gray-300 font-medium">{item.stage}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-white">
                  {item.count.toLocaleString()}
                </span>
                <span className="text-xs text-gray-500 w-10 text-right">
                  {item.percentage}%
                </span>
              </div>
            </div>
            <div className="relative h-8 bg-surface-card rounded-lg overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 rounded-lg transition-all duration-1000 ease-out group-hover:brightness-110"
                style={{
                  width: `${widthPercent}%`,
                  background: `linear-gradient(90deg, ${item.color}CC, ${item.color}88)`,
                  animationDelay: `${index * 150}ms`,
                }}
              />
              <div
                className="absolute inset-y-0 left-0 rounded-lg opacity-30"
                style={{
                  width: `${widthPercent}%`,
                  background: `linear-gradient(180deg, rgba(255,255,255,0.1) 0%, transparent 100%)`,
                }}
              />
            </div>
            {index < data.length - 1 && (
              <div className="flex justify-center my-0.5">
                <div className="text-[10px] text-gray-500">
                  {Math.round(((data[index + 1].count / item.count) * 100))}% conversion
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
