'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import {
  Users,
  UserCheck,
  AlertTriangle,
  Phone,
  Clock,
  CalendarDays,
  BookOpen,
  MessageCircle,
  GraduationCap,
  TrendingUp,
  ArrowRight,
  Loader2,
  RefreshCw,
  CheckCircle,
  Zap,
  Sun,
  Moon,
  Sunrise,
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { api } from '@/lib/api';
import { useAPI } from '@/lib/useAPI';

function getGreeting(): { text: string; icon: React.ElementType } {
  const hour = new Date().getHours();
  if (hour < 12) return { text: 'Good morning', icon: Sunrise };
  if (hour < 17) return { text: 'Good afternoon', icon: Sun };
  return { text: 'Good evening', icon: Moon };
}

function formatDate(): string {
  return new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

const typeIcons: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  call: { icon: Phone, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  whatsapp: { icon: MessageCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  email: { icon: MessageCircle, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  visit: { icon: Users, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  telegram: { icon: MessageCircle, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  training: { icon: GraduationCap, color: 'text-brand-red-light', bg: 'bg-brand-red/10' },
  follow_up: { icon: RefreshCw, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
};

export default function ADMDashboard() {
  const { user } = useAuth();
  const admId = user?.adm_id;

  // Fetch ADM-specific data
  const { data: briefing, loading: loadingBriefing } = useAPI(
    () => (admId ? api.getBriefing(admId) : Promise.resolve(null)),
  );
  const { data: todaySchedule, loading: loadingSchedule } = useAPI(
    () => (admId ? api.getDiaryToday(admId) : Promise.resolve([])),
  );
  const { data: myAgents, loading: loadingAgents } = useAPI(
    () => (admId ? api.getADMAgents(admId) : Promise.resolve([])),
  );
  const { data: overdueData } = useAPI(() => api.getOverdueFollowups());
  const { data: recentActivity, loading: loadingActivity } = useAPI(
    () => api.listInteractions(admId ? { adm_id: String(admId), limit: '10' } : { limit: '10' }),
  );

  const { data: refreshedBriefing, loading: generatingBriefing, refetch: doGenerate } = useAPI(
    () => Promise.resolve(null),
  );
  const activeBriefing = refreshedBriefing || briefing;

  const greeting = getGreeting();
  const GreetingIcon = greeting.icon;

  // Agent state counts
  const agentCounts = useMemo(() => {
    const agents = Array.isArray(myAgents) ? myAgents : (myAgents as any)?.items || [];
    return {
      total: agents.length,
      active: agents.filter((a: any) => a.lifecycle_state === 'active').length,
      dormant: agents.filter((a: any) => a.lifecycle_state === 'dormant').length,
      at_risk: agents.filter((a: any) => a.lifecycle_state === 'at_risk').length,
      contacted: agents.filter((a: any) => a.lifecycle_state === 'contacted').length,
      engaged: agents.filter((a: any) => a.lifecycle_state === 'engaged').length,
      trained: agents.filter((a: any) => a.lifecycle_state === 'trained').length,
    };
  }, [myAgents]);

  // Today's schedule items
  // Backend returns { schedule: [...] } with items having time/type fields
  const scheduleItems = useMemo(() => {
    let items: any[] = [];
    if (Array.isArray(todaySchedule)) {
      items = todaySchedule;
    } else if (todaySchedule) {
      items = (todaySchedule as any)?.schedule || (todaySchedule as any)?.items || [];
    }
    // Normalize field names from backend
    return items.map((e: any) => ({
      ...e,
      scheduled_time: e.time || e.scheduled_time,
      entry_type: e.type || e.entry_type,
      status: e.status === 'scheduled' ? 'pending' : e.status,
    })).sort((a: any, b: any) => {
      const timeA = a.scheduled_time || '23:59';
      const timeB = b.scheduled_time || '23:59';
      return timeA.localeCompare(timeB);
    });
  }, [todaySchedule]);

  // Overdue count
  const overdueCount = useMemo(() => {
    if (Array.isArray(overdueData)) return overdueData.length;
    if (overdueData?.items) return overdueData.items.length;
    if (overdueData?.count !== undefined) return overdueData.count;
    return 0;
  }, [overdueData]);

  // Recent interactions
  const recentInteractions = useMemo(() => {
    const items = Array.isArray(recentActivity) ? recentActivity : (recentActivity as any)?.items || [];
    return items.slice(0, 10);
  }, [recentActivity]);

  // Briefing data
  // Backend returns { summary_text, priority_agents (JSON string), action_items (JSON string), pending_followups, ... }
  const briefingData = useMemo(() => {
    if (!activeBriefing) return null;
    // Parse JSON strings if needed
    let priorityAgents = activeBriefing.priority_agents || [];
    if (typeof priorityAgents === 'string') {
      try { priorityAgents = JSON.parse(priorityAgents); } catch { priorityAgents = []; }
    }
    let actionItems = activeBriefing.action_items || activeBriefing.actions || [];
    if (typeof actionItems === 'string') {
      try { actionItems = JSON.parse(actionItems); } catch { actionItems = []; }
    }
    return {
      summary: activeBriefing.summary_text || activeBriefing.summary || activeBriefing.text || 'No briefing available yet.',
      priority_agents: Array.isArray(priorityAgents) ? priorityAgents : [],
      pending_followups: activeBriefing.pending_followups ?? activeBriefing.followups_count ?? 0,
      action_items: Array.isArray(actionItems) ? actionItems : [],
    };
  }, [activeBriefing]);

  const handleGenerateBriefing = async () => {
    if (!admId) return;
    try {
      await api.generateBriefing(admId);
      // Refetch briefing after generation
      window.location.reload();
    } catch (err) {
      console.error('Failed to generate briefing:', err);
    }
  };

  const isLoading = loadingBriefing && loadingSchedule && loadingAgents;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-gray-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Row 1: Greeting + Quick Stats */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-red to-brand-navy flex items-center justify-center">
              <GreetingIcon className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                {greeting.text}, {user?.name?.split(' ')[0] || 'ADM'}
              </h1>
              <p className="text-sm text-gray-400 mt-0.5">{formatDate()}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {overdueCount > 0 && (
              <Link
                href="/planner"
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium hover:bg-red-500/20 transition-all"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                {overdueCount} overdue
              </Link>
            )}
          </div>
        </div>

        {/* Quick Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
          <div className="bg-surface-card/60 rounded-xl p-4 border border-surface-border/30">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-gray-500" />
              <span className="text-xs text-gray-500">My Agents</span>
            </div>
            <p className="text-2xl font-bold text-white">{agentCounts.total}</p>
          </div>
          <div className="bg-surface-card/60 rounded-xl p-4 border border-surface-border/30">
            <div className="flex items-center gap-2 mb-1">
              <UserCheck className="w-4 h-4 text-emerald-500" />
              <span className="text-xs text-gray-500">Active Today</span>
            </div>
            <p className="text-2xl font-bold text-emerald-400">{agentCounts.active}</p>
          </div>
          <div className="bg-surface-card/60 rounded-xl p-4 border border-surface-border/30">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <span className="text-xs text-gray-500">Overdue Follow-ups</span>
            </div>
            <p className={`text-2xl font-bold ${overdueCount > 0 ? 'text-red-400' : 'text-gray-400'}`}>
              {overdueCount}
            </p>
          </div>
          <div className="bg-surface-card/60 rounded-xl p-4 border border-surface-border/30">
            <div className="flex items-center gap-2 mb-1">
              <CalendarDays className="w-4 h-4 text-blue-500" />
              <span className="text-xs text-gray-500">Today&apos;s Tasks</span>
            </div>
            <p className="text-2xl font-bold text-blue-400">{scheduleItems.length}</p>
          </div>
        </div>
      </div>

      {/* Row 2: Today's Briefing */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <Zap className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Today&apos;s Briefing</h2>
              <p className="text-xs text-gray-500">Your AI-generated daily briefing</p>
            </div>
          </div>
          <button
            onClick={handleGenerateBriefing}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-card border border-surface-border text-gray-400 hover:text-white text-xs font-medium transition-all hover:bg-surface-card-hover"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Generate Fresh
          </button>
        </div>

        {loadingBriefing ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-6 h-6 text-gray-500 animate-spin" />
          </div>
        ) : briefingData ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-300 leading-relaxed">{briefingData.summary}</p>

            {/* Priority Agents */}
            {briefingData.priority_agents.length > 0 && (
              <div>
                <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-2">Priority Agents</h3>
                <div className="flex flex-wrap gap-2">
                  {briefingData.priority_agents.slice(0, 5).map((agent: any, idx: number) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs"
                    >
                      {typeof agent === 'string' ? agent : agent.name || `Agent #${agent.id}`}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Action Items */}
            {briefingData.action_items.length > 0 && (
              <div>
                <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-2">Action Items</h3>
                <ul className="space-y-1.5">
                  {briefingData.action_items.map((item: any, idx: number) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-400">
                      <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span>{typeof item === 'string' ? item : item.text || item.description}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span>Pending follow-ups: {briefingData.pending_followups}</span>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Zap className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No briefing generated yet</p>
            <p className="text-gray-600 text-xs mt-1">Click &quot;Generate Fresh&quot; to create your daily briefing</p>
          </div>
        )}
      </div>

      {/* Row 3: Today's Schedule + Row 4: My Agents Overview (side by side on large screens) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Schedule */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <CalendarDays className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Today&apos;s Schedule</h2>
                <p className="text-xs text-gray-500">{scheduleItems.length} entries</p>
              </div>
            </div>
            <Link
              href="/planner"
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors"
            >
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {loadingSchedule ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-gray-500 animate-spin" />
            </div>
          ) : scheduleItems.length === 0 ? (
            <div className="text-center py-8">
              <CalendarDays className="w-10 h-10 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">No entries scheduled for today</p>
              <Link
                href="/planner"
                className="inline-block mt-3 text-xs text-brand-red-light hover:underline"
              >
                Add a schedule entry
              </Link>
            </div>
          ) : (
            <div className="space-y-2 max-h-[320px] overflow-y-auto">
              {scheduleItems.slice(0, 8).map((entry: any, idx: number) => {
                const entryTypeColors: Record<string, string> = {
                  follow_up: 'border-l-cyan-400',
                  first_contact: 'border-l-emerald-400',
                  training: 'border-l-brand-red',
                  escalation: 'border-l-red-400',
                  review: 'border-l-purple-400',
                };
                const borderColor = entryTypeColors[entry.entry_type] || 'border-l-gray-500';
                const isDone = entry.status === 'completed' || entry.completed;

                return (
                  <div
                    key={entry.id || idx}
                    className={`flex items-center gap-3 p-3 rounded-lg bg-surface-card/40 border-l-2 ${borderColor} ${
                      isDone ? 'opacity-50' : ''
                    }`}
                  >
                    <div className="flex-shrink-0 text-center w-12">
                      <p className="text-sm font-bold text-white">
                        {entry.scheduled_time || '--:--'}
                      </p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${isDone ? 'text-gray-500 line-through' : 'text-white'}`}>
                        {entry.agent_name || `Agent #${entry.agent_id}`}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">
                        {(entry.entry_type || '').replace(/_/g, ' ')}
                        {entry.priority === 'high' && (
                          <span className="ml-2 text-red-400">!! High Priority</span>
                        )}
                      </p>
                    </div>
                    {isDone ? (
                      <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    ) : (
                      <Clock className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* My Agents Overview */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <Users className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">My Agents Overview</h2>
                <p className="text-xs text-gray-500">{agentCounts.total} total agents</p>
              </div>
            </div>
            <Link
              href="/my-agents"
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors"
            >
              Manage <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Active', count: agentCounts.active, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', filter: 'active' },
              { label: 'Dormant', count: agentCounts.dormant, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', filter: 'dormant' },
              { label: 'At Risk', count: agentCounts.at_risk, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', filter: 'at_risk' },
              { label: 'Contacted', count: agentCounts.contacted, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', filter: 'contacted' },
              { label: 'Engaged', count: agentCounts.engaged, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', filter: 'engaged' },
              { label: 'Trained', count: agentCounts.trained, color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', filter: 'trained' },
            ].map((item) => (
              <Link
                key={item.label}
                href={`/my-agents?filter=${item.filter}`}
                className={`p-4 rounded-xl ${item.bg} border ${item.border} hover:scale-[1.02] transition-all cursor-pointer`}
              >
                <p className={`text-2xl font-bold ${item.color}`}>{item.count}</p>
                <p className="text-xs text-gray-400 mt-0.5">{item.label}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Row 5: Recent Activity */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <TrendingUp className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
              <p className="text-xs text-gray-500">Your latest interactions</p>
            </div>
          </div>
          <Link
            href="/activity"
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors"
          >
            View All <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {loadingActivity ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-gray-500 animate-spin" />
          </div>
        ) : recentInteractions.length === 0 ? (
          <div className="text-center py-8">
            <TrendingUp className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No recent activity</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {recentInteractions.map((interaction: any, idx: number) => {
              const typeStyle = typeIcons[interaction.type] || typeIcons.call;
              const TypeIcon = typeStyle.icon;
              const date = new Date(interaction.created_at || interaction.timestamp);
              const timeStr = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
              const dateStr = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

              return (
                <div
                  key={interaction.id || idx}
                  className="flex items-center gap-3 p-3 rounded-lg bg-surface-card/30 hover:bg-surface-card/50 transition-colors"
                >
                  <div className={`p-2 rounded-lg ${typeStyle.bg} flex-shrink-0`}>
                    <TypeIcon className={`w-4 h-4 ${typeStyle.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">
                      {interaction.agent_name || `Agent #${interaction.agent_id}`}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {interaction.notes || (interaction.type || '').replace(/_/g, ' ')}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-gray-400">{timeStr}</p>
                    <p className="text-[10px] text-gray-600">{dateStr}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Action Links */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { href: '/my-agents', label: 'My Agents', icon: Users, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
          { href: '/planner', label: 'Daily Planner', icon: CalendarDays, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
          { href: '/playbooks', label: 'Action Plans', icon: BookOpen, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
          { href: '/comms', label: 'Communication', icon: MessageCircle, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
          { href: '/training', label: 'Training', icon: GraduationCap, color: 'text-brand-red-light', bg: 'bg-brand-red/10', border: 'border-brand-red/20' },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl ${item.bg} border ${item.border} hover:scale-[1.03] transition-all`}
          >
            <item.icon className={`w-6 h-6 ${item.color}`} />
            <span className="text-xs font-medium text-gray-300">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
