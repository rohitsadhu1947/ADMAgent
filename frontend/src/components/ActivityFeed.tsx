'use client';

import {
  CheckCircle,
  Phone,
  GraduationCap,
  MessageSquare,
  UserCheck,
  Trophy,
  Users,
  UserPlus,
} from 'lucide-react';

const iconMap: Record<string, React.ElementType> = {
  'check-circle': CheckCircle,
  phone: Phone,
  'graduation-cap': GraduationCap,
  'message-square': MessageSquare,
  'user-check': UserCheck,
  trophy: Trophy,
  users: Users,
  'user-plus': UserPlus,
};

const typeColorMap: Record<string, { bg: string; text: string; dot: string }> = {
  activation: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  call: { bg: 'bg-blue-500/10', text: 'text-blue-400', dot: 'bg-blue-400' },
  training: { bg: 'bg-purple-500/10', text: 'text-purple-400', dot: 'bg-purple-400' },
  feedback: { bg: 'bg-amber-500/10', text: 'text-amber-400', dot: 'bg-amber-400' },
  engagement: { bg: 'bg-brand-red/10', text: 'text-brand-red-light', dot: 'bg-brand-red' },
};

interface ActivityItem {
  id: number;
  type: string;
  text: string;
  adm: string;
  time: string;
  icon: string;
}

interface ActivityFeedProps {
  items: ActivityItem[];
  maxItems?: number;
}

export default function ActivityFeed({ items, maxItems }: ActivityFeedProps) {
  const displayItems = maxItems ? items.slice(0, maxItems) : items;

  return (
    <div className="space-y-1">
      {displayItems.map((item, index) => {
        const Icon = iconMap[item.icon] || CheckCircle;
        const colors = typeColorMap[item.type] || typeColorMap.activation;

        return (
          <div
            key={item.id}
            className="flex items-start gap-3 p-3 rounded-lg hover:bg-surface-card/40 transition-all duration-200 group animate-fade-in"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {/* Timeline dot + line */}
            <div className="flex flex-col items-center flex-shrink-0">
              <div className={`p-1.5 rounded-lg ${colors.bg}`}>
                <Icon className={`w-3.5 h-3.5 ${colors.text}`} />
              </div>
              {index < displayItems.length - 1 && (
                <div className="w-px h-6 bg-surface-border mt-1" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-200 leading-snug">{item.text}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-500">{item.adm}</span>
                <span className="text-gray-600">|</span>
                <span className="text-xs text-gray-500">{item.time}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
