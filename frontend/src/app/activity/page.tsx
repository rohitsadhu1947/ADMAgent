'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import {
  Phone,
  MessageCircle,
  Mail,
  MapPin,
  GraduationCap,
  RefreshCw,
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  MinusCircle,
  AlertCircle,
  ArrowDown,
  Loader2,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAPI } from '@/lib/useAPI';
import ChartCard from '@/components/ChartCard';

const typeConfig: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  call: { label: 'Phone Call', icon: Phone, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  whatsapp: { label: 'WhatsApp', icon: MessageCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  email: { label: 'Email', icon: Mail, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  visit: { label: 'Branch Visit', icon: MapPin, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  telegram: { label: 'Telegram', icon: MessageCircle, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  training: { label: 'Training', icon: GraduationCap, color: 'text-brand-red-light', bg: 'bg-brand-red/10' },
  follow_up: { label: 'Follow-up', icon: RefreshCw, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
};

const outcomeConfig: Record<string, { label: string; icon: React.ElementType; color: string; bg: string; border: string }> = {
  connected: { label: 'Connected', icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  not_answered: { label: 'No Answer', icon: AlertCircle, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  callback_requested: { label: 'Callback', icon: Phone, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  follow_up_scheduled: { label: 'Follow-up', icon: Clock, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
  positive: { label: 'Positive', icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  neutral: { label: 'Neutral', icon: MinusCircle, color: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-500/20' },
  negative: { label: 'Negative', icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
  no_response: { label: 'No Response', icon: AlertCircle, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
};

export default function ActivityPage() {
  const { data: apiInteractions, loading } = useAPI(() => api.listInteractions({ limit: '100' }), 10000);
  const { data: apiADMs } = useAPI(() => api.listADMs());
  const { data: apiAgents } = useAPI(() => api.listAgents({ limit: '200' }));

  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [admFilter, setAdmFilter] = useState<string>('all');
  const [outcomeFilter, setOutcomeFilter] = useState<string>('all');
  const [autoScroll, setAutoScroll] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(8);

  // Build name lookup maps
  const admNamesMap = useMemo(() => {
    const map: Record<number, string> = {};
    (apiADMs || []).forEach((a: any) => { map[a.id] = a.name; });
    return map;
  }, [apiADMs]);

  const agentNames = useMemo(() => {
    const map: Record<number, string> = {};
    const agents = apiAgents?.items || apiAgents || [];
    (agents as any[]).forEach((a: any) => { map[a.id] = a.name; });
    return map;
  }, [apiAgents]);

  // Enrich interactions with names
  const interactions = useMemo(() => {
    const raw = apiInteractions?.items || apiInteractions || [];
    return (raw as any[]).map((i: any) => ({
      ...i,
      adm_name: admNamesMap[i.adm_id] || `ADM #${i.adm_id}`,
      agent_name: agentNames[i.agent_id] || `Agent #${i.agent_id}`,
      timestamp: i.created_at,
    }));
  }, [apiInteractions, admNamesMap, agentNames]);

  // ADM names list for filter dropdown
  const admNamesList = useMemo(() => {
    return [...new Set(interactions.map((i: any) => i.adm_name))].sort();
  }, [interactions]);

  const filteredInteractions = useMemo(() => {
    return [...interactions]
      .filter((i: any) => {
        const matchType = typeFilter === 'all' || i.type === typeFilter;
        const matchADM = admFilter === 'all' || i.adm_name === admFilter;
        const matchOutcome = outcomeFilter === 'all' || i.outcome === outcomeFilter;
        return matchType && matchADM && matchOutcome;
      })
      .sort((a: any, b: any) => new Date(b.timestamp || b.created_at).getTime() - new Date(a.timestamp || a.created_at).getTime());
  }, [interactions, typeFilter, admFilter, outcomeFilter]);

  // Simulated auto-scroll
  useEffect(() => {
    if (!autoScroll) return;
    const interval = setInterval(() => {
      setVisibleCount((prev) => {
        if (prev >= filteredInteractions.length) return prev;
        return prev + 1;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [autoScroll, filteredInteractions.length]);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [visibleCount, autoScroll]);

  const displayedInteractions = filteredInteractions.slice(0, visibleCount);

  // Summary stats
  const stats = useMemo(() => ({
    total: interactions.length,
    calls: interactions.filter((i: any) => i.type === 'call').length,
    positive: interactions.filter((i: any) => i.outcome === 'connected').length,
    avgDuration: interactions.filter((i: any) => i.duration_minutes).length > 0
      ? Math.round(interactions.filter((i: any) => i.duration_minutes).reduce((acc: number, i: any) => acc + (i.duration_minutes || 0), 0) / interactions.filter((i: any) => i.duration_minutes).length)
      : 0,
  }), [interactions]);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-gray-500 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Live Activity Feed</h1>
          <p className="text-sm text-gray-400 mt-1">
            Real-time timeline of all ADM-Agent interactions
          </p>
        </div>
        <button
          onClick={() => setAutoScroll(!autoScroll)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            autoScroll
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
              : 'bg-surface-card border border-surface-border text-gray-400'
          }`}
        >
          <div className={`w-2 h-2 rounded-full ${autoScroll ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'}`} />
          {autoScroll ? 'Auto-scroll ON' : 'Auto-scroll OFF'}
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Interactions', value: stats.total, color: 'text-white' },
          { label: 'Phone Calls', value: stats.calls, color: 'text-blue-400' },
          { label: 'Positive Outcomes', value: stats.positive, color: 'text-emerald-400' },
          { label: 'Avg Duration', value: `${stats.avgDuration} min`, color: 'text-amber-400' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="glass-card p-3 text-center"
          >
            <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="glass-card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Filter className="w-4 h-4 text-gray-500" />

          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setVisibleCount(8); }}
            className="input-dark text-sm py-2"
          >
            <option value="all">All Types</option>
            <option value="call">Phone Call</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="email">Email</option>
            <option value="visit">Branch Visit</option>
            <option value="telegram">Telegram</option>
            <option value="training">Training</option>
            <option value="follow_up">Follow-up</option>
          </select>

          <select
            value={admFilter}
            onChange={(e) => { setAdmFilter(e.target.value); setVisibleCount(8); }}
            className="input-dark text-sm py-2"
          >
            <option value="all">All ADMs</option>
            {admNamesList.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>

          <select
            value={outcomeFilter}
            onChange={(e) => { setOutcomeFilter(e.target.value); setVisibleCount(8); }}
            className="input-dark text-sm py-2"
          >
            <option value="all">All Outcomes</option>
            <option value="connected">Connected</option>
            <option value="not_answered">No Answer</option>
            <option value="callback_requested">Callback</option>
            <option value="follow_up_scheduled">Follow-up</option>
          </select>

          <span className="text-xs text-gray-500 ml-auto">
            {displayedInteractions.length} of {filteredInteractions.length} interactions
          </span>
        </div>
      </div>

      {/* Timeline */}
      <div
        ref={scrollRef}
        className="max-h-[600px] overflow-y-auto space-y-1 scroll-smooth pr-1"
      >
        {displayedInteractions.map((interaction, index) => {
          const typeStyle = typeConfig[interaction.type] || typeConfig.call;
          const outcomeStyle = outcomeConfig[interaction.outcome] || outcomeConfig.connected;
          const TypeIcon = typeStyle.icon;
          const OutcomeIcon = outcomeStyle.icon;

          const date = new Date(interaction.timestamp);
          const timeStr = date.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
          });
          const dateStr = date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
          });

          return (
            <div
              key={interaction.id}
              className="flex gap-4 animate-slide-up"
              style={{ animationDelay: `${Math.min(index, 8) * 50}ms` }}
            >
              {/* Timeline line + dot */}
              <div className="flex flex-col items-center flex-shrink-0 w-16">
                <span className="text-[11px] text-gray-500 whitespace-nowrap">{timeStr}</span>
                <span className="text-[10px] text-gray-600">{dateStr}</span>
                <div className={`w-3 h-3 rounded-full mt-1 ${typeStyle.bg} border-2 ${typeStyle.color.replace('text-', 'border-')}`} />
                {index < displayedInteractions.length - 1 && (
                  <div className="w-px flex-1 bg-surface-border/60 mt-1" />
                )}
              </div>

              {/* Card */}
              <div className="flex-1 mb-3 p-4 rounded-lg bg-surface-card/40 border border-surface-border/30 hover:bg-surface-card-hover/50 hover:border-surface-border-light/30 transition-all duration-200 group">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    {/* Type Icon */}
                    <div className={`p-2 rounded-lg ${typeStyle.bg}`}>
                      <TypeIcon className={`w-4 h-4 ${typeStyle.color}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">
                          {interaction.adm_name}
                        </span>
                        <span className="text-gray-600">&#8594;</span>
                        <span className="text-sm text-gray-300">{interaction.agent_name}</span>
                      </div>
                      <span className={`text-xs ${typeStyle.color}`}>{typeStyle.label}</span>
                    </div>
                  </div>

                  {/* Outcome Badge */}
                  <span
                    className={`badge text-[10px] ${outcomeStyle.bg} ${outcomeStyle.color} ${outcomeStyle.border} border`}
                  >
                    <OutcomeIcon className="w-3 h-3 mr-1" />
                    {outcomeStyle.label}
                  </span>
                </div>

                <p className="text-sm text-gray-400 leading-relaxed mb-2">
                  {interaction.notes}
                </p>

                {interaction.duration_minutes && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    {interaction.duration_minutes} minutes
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Load More */}
        {visibleCount < filteredInteractions.length && !autoScroll && (
          <div className="flex justify-center py-4">
            <button
              onClick={() => setVisibleCount((prev) => Math.min(prev + 5, filteredInteractions.length))}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-card border border-surface-border text-gray-400 hover:text-white hover:bg-surface-card-hover transition-all text-sm"
            >
              <ArrowDown className="w-4 h-4" />
              Load More ({filteredInteractions.length - visibleCount} remaining)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
