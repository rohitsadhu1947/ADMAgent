'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAPI } from '@/lib/useAPI';
import {
  Users,
  UserCheck,
  Activity,
  Clock,
  TrendingUp,
  TrendingDown,
  Target,
  AlertTriangle,
  ArrowRight,
  ArrowDown,
  Zap,
  BarChart3,
  MapPin,
  Phone,
  MessageSquare,
  BookOpen,
  Calendar,
  IndianRupee,
  Award,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend,
  ReferenceLine,
  Label,
} from 'recharts';
import AnimatedCounter from '@/components/AnimatedCounter';
import ChartCard from '@/components/ChartCard';
import FunnelChart from '@/components/FunnelChart';
import ActivityFeed from '@/components/ActivityFeed';
import {
  heroStats,
  funnelData,
  projectedFunnelData,
  dormancyReasonsData,
  regionalData,
  trendData,
  recentActivity,
  impactMetrics,
  costImpact,
} from '@/data/dashboard';

/* ──────────── Custom Tooltip ──────────── */
const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string; dataKey?: string }>;
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-surface-card/95 backdrop-blur-xl border border-surface-border rounded-xl p-4 shadow-2xl shadow-black/40">
        <p className="text-gray-200 font-semibold text-sm mb-2">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-xs flex items-center gap-2 py-0.5" style={{ color: entry.color }}>
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

/* ──────────── Icon mapping for impact metrics ──────────── */
const impactIconMap: Record<string, React.ElementType> = {
  'trending-up': TrendingUp,
  phone: Phone,
  'message-square': MessageSquare,
  calendar: Calendar,
  clock: Clock,
  book: BookOpen,
};

/* ──────────── Regional data sorted + colored ──────────── */
const regionalSorted = [...regionalData]
  .sort((a, b) => b.total_agents - a.total_agents)
  .slice(0, 10);

/* ──────────── Funnel bar data (current) ──────────── */
const funnelBarCurrent = funnelData.slice(1).map((d) => ({
  stage: d.stage.replace(' (by ADMs)', '').replace(' (Punching Policies)', ''),
  count: d.count,
  fill: d.color,
}));

/* ──────────── Funnel bar data (projected) ──────────── */
const funnelBarProjected = projectedFunnelData.slice(1).map((d) => ({
  stage: d.stage.replace(' (by ADMs)', '').replace(' (Punching Policies)', ''),
  count: d.count,
  fill: d.color,
}));

/* ──────────── Combined comparison data for bar chart ──────────── */
const comparisonData = funnelData.slice(1).map((d, i) => ({
  stage: d.stage.replace(' (by ADMs)', '').replace(' (Punching Policies)', ''),
  current: d.count,
  projected: projectedFunnelData[i + 1].count,
}));

export default function AdminDashboard() {
  const [isVisible, setIsVisible] = useState(false);

  // Live data from API
  const { data: liveActivity } = useAPI(() => api.getActivityFeed(15), 5000); // poll every 5s
  const { data: admPerformance } = useAPI(() => api.getADMPerformance());

  const topADMs = (admPerformance || []).slice(0, 5);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="space-y-8 animate-fade-in pb-8">

      {/* ════════════════════════════════════════════════════════════
          SECTION 1 - HERO: THE HEADLINE THAT STOPS THE ROOM
          ════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden rounded-2xl bg-hero-gradient border border-surface-border">
        {/* Decorative background orbs */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-brand-red/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-brand-navy/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 px-8 py-10">
          {/* Live badge */}
          <div className="flex items-center gap-2 mb-6">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-emerald-400 font-medium tracking-wide">LIVE DASHBOARD</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-red/10 border border-brand-red/20">
              <Sparkles className="w-3 h-3 text-brand-red-light" />
              <span className="text-xs text-brand-red-light font-medium tracking-wide">AXIS MAX LIFE</span>
            </div>
          </div>

          {/* Hero headline */}
          <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-tight mb-3">
            <span className="bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
              1 Lakh+ agents.{' '}
            </span>
            <span className="bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
              Only 2% active.
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-400 font-light mb-2">
            <span className="text-red-400 font-semibold">98,420</span> agents are dormant.{' '}
            <span className="text-emerald-400 font-medium">Here&apos;s how we fix it.</span>
          </p>
          <p className="text-sm text-gray-500 max-w-2xl">
            The ADM Agent Activation Platform transforms dormant insurance agents into active policy sellers
            through intelligent tracking, automated follow-ups, and data-driven engagement.
          </p>

          {/* Hero stat cards row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            {/* Total Agents */}
            <div className="relative group p-5 rounded-xl bg-white/[0.03] backdrop-blur-xl border border-white/10 hover:border-blue-500/30 transition-all duration-500 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/5">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Users className="w-4 h-4 text-blue-400" />
                </div>
                <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">Total Agents</span>
              </div>
              <AnimatedCounter
                end={heroStats.totalAgents}
                className="text-3xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent"
                duration={2000}
              />
            </div>

            {/* Activation Rate - THE RED GLOW CARD */}
            <div className="relative group p-5 rounded-xl bg-red-950/20 backdrop-blur-xl border border-red-500/20 hover:border-red-500/40 transition-all duration-500 hover:-translate-y-1 shadow-lg shadow-red-500/10 hover:shadow-xl hover:shadow-red-500/20">
              <div className="absolute inset-0 rounded-xl bg-red-500/5 animate-pulse-glow pointer-events-none" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 rounded-lg bg-red-500/15">
                    <Target className="w-4 h-4 text-red-400" />
                  </div>
                  <span className="text-xs text-red-400/80 uppercase tracking-wider font-medium">Activation Rate</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <AnimatedCounter
                    end={heroStats.activationRate}
                    suffix="%"
                    decimals={1}
                    className="text-4xl font-black text-red-400"
                    duration={1500}
                  />
                </div>
                <div className="flex items-center gap-1.5 mt-2">
                  <TrendingUp className="w-3 h-3 text-emerald-400" />
                  <span className="text-xs text-emerald-400 font-semibold">Target: {heroStats.activationRateTarget}%</span>
                </div>
              </div>
            </div>

            {/* Dormant Agents - PULSING RED */}
            <div className="relative group p-5 rounded-xl bg-white/[0.03] backdrop-blur-xl border border-red-500/10 hover:border-red-500/30 transition-all duration-500 hover:-translate-y-1 hover:shadow-xl hover:shadow-red-500/5">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 rounded-lg bg-red-500/10">
                  <AlertTriangle className="w-4 h-4 text-red-400 animate-pulse" />
                </div>
                <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">Dormant Agents</span>
              </div>
              <div className="animate-pulse-glow">
                <AnimatedCounter
                  end={heroStats.dormantAgents}
                  className="text-3xl font-bold text-red-400"
                  duration={2200}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">94.8% of total force</p>
            </div>

            {/* Active Agents */}
            <div className="relative group p-5 rounded-xl bg-emerald-950/10 backdrop-blur-xl border border-emerald-500/15 hover:border-emerald-500/30 transition-all duration-500 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/5">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                </div>
                <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">Active Agents</span>
              </div>
              <AnimatedCounter
                end={heroStats.activeAgents}
                className="text-3xl font-bold bg-gradient-to-r from-emerald-300 to-emerald-500 bg-clip-text text-transparent"
                duration={1800}
              />
              <p className="text-xs text-gray-500 mt-1">Selling policies today</p>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          SECTION 2 - THE PROBLEM: ACTIVATION FUNNEL
          ════════════════════════════════════════════════════════════ */}
      <section>
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20">
            <BarChart3 className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">The Problem: Massive Drop-off</h2>
            <p className="text-sm text-gray-500">98K agents enter the funnel. Only 2K come out active.</p>
          </div>
        </div>

        <div className="glass-card p-6 border-red-500/10">
          <FunnelChart data={funnelData} />
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          SECTION 3 - DORMANCY REASONS: WHY AGENTS GO DORMANT
          ════════════════════════════════════════════════════════════ */}
      <section>
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <MessageSquare className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Why Agents Go Dormant</h2>
            <p className="text-sm text-gray-500">Root causes identified from agent feedback analysis</p>
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex flex-col lg:flex-row items-center gap-8">
            {/* Pie Chart */}
            <div className="w-full lg:w-1/2 h-[340px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <defs>
                    {dormancyReasonsData.map((entry, index) => (
                      <linearGradient key={`pie-grad-${index}`} id={`pieGrad${index}`} x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor={entry.color} stopOpacity={1} />
                        <stop offset="100%" stopColor={entry.color} stopOpacity={0.6} />
                      </linearGradient>
                    ))}
                  </defs>
                  <Pie
                    data={dormancyReasonsData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={120}
                    paddingAngle={3}
                    dataKey="count"
                    nameKey="reason"
                    stroke="none"
                    animationBegin={200}
                    animationDuration={1200}
                  >
                    {dormancyReasonsData.map((entry, index) => (
                      <Cell key={index} fill={`url(#pieGrad${index})`} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend with bars */}
            <div className="w-full lg:w-1/2 space-y-3">
              {dormancyReasonsData.map((item, index) => (
                <div
                  key={item.reason}
                  className="group flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] border border-transparent hover:border-white/5 transition-all duration-300"
                >
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0 shadow-lg"
                    style={{ backgroundColor: item.color, boxShadow: `0 0 8px ${item.color}40` }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-300 font-medium">{item.reason}</span>
                      <span className="text-sm font-bold text-white">{item.percentage}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-surface-card overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000 ease-out"
                        style={{
                          width: `${item.percentage * 3}%`,
                          background: `linear-gradient(90deg, ${item.color}, ${item.color}88)`,
                          animationDelay: `${index * 100}ms`,
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 w-16 text-right flex-shrink-0">
                    {item.count.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          SECTION 4 - THE SOLUTION: BEFORE vs AFTER IMPACT
          ════════════════════════════════════════════════════════════ */}
      <section>
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <Zap className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">The Solution: Platform Impact Projection</h2>
            <p className="text-sm text-gray-500">From 2% to 15% activation - a 7.5x improvement trajectory</p>
          </div>
        </div>

        {/* Before vs After Comparison Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {impactMetrics.map((item, index) => {
            const Icon = impactIconMap[item.icon] || TrendingUp;
            return (
              <div
                key={item.metric}
                className="relative group p-5 rounded-xl bg-white/[0.02] backdrop-blur-xl border border-surface-border hover:border-emerald-500/20 transition-all duration-500 hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-500/5 animate-slide-up"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-1.5 rounded-lg bg-white/5">
                    <Icon className="w-4 h-4 text-gray-400" />
                  </div>
                  <span className="text-sm text-gray-300 font-medium">{item.metric}</span>
                </div>

                <div className="flex items-center gap-3">
                  {/* Before */}
                  <div className="flex-1 p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                    <p className="text-[10px] text-red-400/70 uppercase tracking-wider mb-1 font-medium">Before</p>
                    <p className="text-lg font-bold text-red-400">{item.before}</p>
                  </div>

                  {/* Arrow */}
                  <div className="flex-shrink-0">
                    <ArrowRight className="w-4 h-4 text-gray-600" />
                  </div>

                  {/* After */}
                  <div className="flex-1 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                    <p className="text-[10px] text-emerald-400/70 uppercase tracking-wider mb-1 font-medium">After</p>
                    <p className="text-lg font-bold text-emerald-400">{item.after}</p>
                  </div>
                </div>

                {/* Improvement badge */}
                <div className="absolute top-4 right-4">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-400">
                    {item.improvement}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Revenue Impact Banner */}
        <div className="glass-card p-6 border-emerald-500/10 bg-gradient-to-r from-emerald-950/20 via-surface-card/60 to-blue-950/20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 font-medium">Current Revenue</p>
              <p className="text-2xl font-bold text-gray-400">
                <span className="text-lg">&#8377;</span>{costImpact.currentRevenue} Cr
              </p>
              <p className="text-xs text-gray-600 mt-1">{heroStats.activeAgents.toLocaleString()} active agents</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 font-medium">Projected Revenue</p>
              <p className="text-2xl font-bold bg-gradient-to-r from-emerald-300 to-emerald-500 bg-clip-text text-transparent">
                <span className="text-lg">&#8377;</span>{costImpact.projectedRevenue} Cr
              </p>
              <p className="text-xs text-emerald-500/60 mt-1">15,577 active agents</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 font-medium">Incremental Revenue</p>
              <p className="text-2xl font-bold text-emerald-400">
                +<span className="text-lg">&#8377;</span>{costImpact.incrementalRevenue} Cr
              </p>
              <p className="text-xs text-emerald-500/60 mt-1">Additional annual revenue</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 font-medium">Platform ROI</p>
              <p className="text-2xl font-bold bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent">
                {costImpact.roiMultiple}x
              </p>
              <p className="text-xs text-amber-500/60 mt-1">Return on investment</p>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          SECTION 5 - FUNNEL COMPARISON: Current vs Projected
          ════════════════════════════════════════════════════════════ */}
      <section>
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
            <BarChart3 className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Funnel Transformation</h2>
            <p className="text-sm text-gray-500">Current state vs projected impact with the platform</p>
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="h-[360px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData} layout="vertical" margin={{ top: 5, right: 40, left: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id="currentBarGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#EF4444" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#EF4444" stopOpacity={0.4} />
                  </linearGradient>
                  <linearGradient id="projectedBarGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#10B981" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#10B981" stopOpacity={0.4} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                  tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v))}
                />
                <YAxis type="category" dataKey="stage" tick={{ fill: '#9CA3AF', fontSize: 11 }} width={100} />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ paddingTop: 10 }}
                  formatter={(value) => <span className="text-xs text-gray-400">{value}</span>}
                />
                <Bar dataKey="current" name="Current" fill="url(#currentBarGrad)" radius={[0, 4, 4, 0]} barSize={16} />
                <Bar dataKey="projected" name="With Platform" fill="url(#projectedBarGrad)" radius={[0, 4, 4, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          SECTION 6 - REGIONAL HEATMAP
          ════════════════════════════════════════════════════════════ */}
      <section>
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <MapPin className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Regional Activation Heatmap</h2>
            <p className="text-sm text-gray-500">Agent distribution and activation rates across top cities</p>
          </div>
        </div>

        <div className="glass-card p-6">
          {/* City cards grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
            {regionalSorted.slice(0, 10).map((city, index) => {
              const isHighRate = city.activation_rate >= 2.2;
              const isLowRate = city.activation_rate <= 1.8;
              return (
                <div
                  key={city.city}
                  className={`relative group p-4 rounded-xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
                    isHighRate
                      ? 'bg-emerald-950/10 border-emerald-500/15 hover:border-emerald-500/30 hover:shadow-emerald-500/5'
                      : isLowRate
                      ? 'bg-red-950/10 border-red-500/15 hover:border-red-500/30 hover:shadow-red-500/5'
                      : 'bg-white/[0.02] border-surface-border hover:border-amber-500/20 hover:shadow-amber-500/5'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-white">{city.city}</span>
                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                      isHighRate ? 'bg-emerald-500/10 text-emerald-400' :
                      isLowRate ? 'bg-red-500/10 text-red-400' :
                      'bg-amber-500/10 text-amber-400'
                    }`}>
                      {city.region}
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-white mb-1">{city.total_agents.toLocaleString()}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">{city.active_agents} active</span>
                    <span className={`text-xs font-bold ${
                      isHighRate ? 'text-emerald-400' : isLowRate ? 'text-red-400' : 'text-amber-400'
                    }`}>
                      {city.activation_rate}%
                    </span>
                  </div>
                  {/* Rate bar */}
                  <div className="h-1 rounded-full bg-surface-card mt-2 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(city.activation_rate * 20, 100)}%`,
                        background: isHighRate ? '#10B981' : isLowRate ? '#EF4444' : '#F59E0B',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Regional bar chart */}
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={regionalSorted} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="totalAgentsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.3} />
                  </linearGradient>
                  <linearGradient id="activeAgentsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity={1} />
                    <stop offset="100%" stopColor="#10B981" stopOpacity={0.4} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                <XAxis
                  dataKey="city"
                  tick={{ fill: '#9CA3AF', fontSize: 11 }}
                  angle={-30}
                  textAnchor="end"
                  height={50}
                />
                <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ paddingTop: 10 }}
                  formatter={(value) => <span className="text-xs text-gray-400">{value}</span>}
                />
                <Bar
                  dataKey="total_agents"
                  name="Total Agents"
                  fill="url(#totalAgentsGrad)"
                  radius={[4, 4, 0, 0]}
                  barSize={20}
                />
                <Bar
                  dataKey="active_agents"
                  name="Active Agents"
                  fill="url(#activeAgentsGrad)"
                  radius={[4, 4, 0, 0]}
                  barSize={20}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          SECTION 7 - ADM PERFORMANCE LEADERBOARD
          ════════════════════════════════════════════════════════════ */}
      <section>
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <Award className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Top ADM Performers</h2>
            <p className="text-sm text-gray-500">Agency Development Managers leading the activation charge</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {topADMs.map((adm: any, index: number) => {
            const initials = adm.adm_name ? adm.adm_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2) : '??';
            const regionShort = adm.region ? adm.region.split(' - ') : ['', ''];
            return (
              <div
                key={adm.adm_id || index}
                className={`relative group p-5 rounded-xl backdrop-blur-xl border transition-all duration-500 hover:-translate-y-2 hover:shadow-xl animate-slide-up ${
                  index === 0
                    ? 'bg-gradient-to-b from-amber-950/20 to-surface-card/60 border-amber-500/20 hover:border-amber-500/40 hover:shadow-amber-500/10'
                    : index === 1
                    ? 'bg-gradient-to-b from-gray-800/20 to-surface-card/60 border-gray-500/20 hover:border-gray-400/30 hover:shadow-gray-500/5'
                    : index === 2
                    ? 'bg-gradient-to-b from-orange-950/20 to-surface-card/60 border-orange-700/20 hover:border-orange-600/30 hover:shadow-orange-700/5'
                    : 'bg-white/[0.02] border-surface-border hover:border-white/10 hover:shadow-white/5'
                }`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Rank badge */}
                <div className={`absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  index === 0 ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30' :
                  index === 1 ? 'bg-gray-400 text-black shadow-lg shadow-gray-400/20' :
                  index === 2 ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20' :
                  'bg-surface-card text-gray-400 border border-surface-border'
                }`}>
                  #{index + 1}
                </div>

                {/* Avatar */}
                <div className="flex justify-center mb-3">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold ${
                    index === 0 ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-black' :
                    'bg-gradient-to-br from-brand-red to-brand-navy text-white'
                  }`}>
                    {initials}
                  </div>
                </div>

                {/* Name + Info */}
                <div className="text-center">
                  <p className="text-sm font-semibold text-white truncate">{adm.adm_name}</p>
                  <p className="text-xs text-gray-500 mb-3">{adm.region}</p>
                </div>

                {/* Stats */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Score</span>
                    <span className="text-sm font-bold text-white">{adm.performance_score}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Active</span>
                    <span className="text-sm font-semibold text-emerald-400">{adm.active_agents}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Rate</span>
                    <span className="text-sm font-semibold text-blue-400">{adm.activation_rate}%</span>
                  </div>
                </div>

                {/* Interactions indicator */}
                <div className="flex justify-center mt-3">
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10">
                    <TrendingUp className="w-3 h-3 text-emerald-400" />
                    <span className="text-xs text-emerald-400">{adm.total_interactions} contacts</span>
                  </div>
                </div>
              </div>
            );
          })}
          {topADMs.length === 0 && (
            <div className="col-span-5 text-center py-8 text-gray-500">
              <p className="text-sm">Loading ADM performance data...</p>
            </div>
          )}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          SECTION 8 - TREND CHART + LIVE ACTIVITY
          ════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Trend Chart - 3 cols */}
        <section className="lg:col-span-3">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Activation Trend</h2>
              <p className="text-sm text-gray-500">Daily activations & contacts - notice the Jan 15 inflection point</p>
            </div>
          </div>

          <div className="glass-card p-6">
            <div className="h-[360px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="activationGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10B981" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="contactsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="feedbackGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                  <XAxis dataKey="date" tick={{ fill: '#9CA3AF', fontSize: 10 }} interval={2} />
                  <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    wrapperStyle={{ paddingTop: 10 }}
                    formatter={(value) => <span className="text-xs text-gray-400">{value}</span>}
                  />

                  {/* Platform launch reference line */}
                  <ReferenceLine
                    x="Jan 15"
                    stroke="#E31837"
                    strokeDasharray="4 4"
                    strokeWidth={2}
                  >
                    <Label
                      value="Platform Launch"
                      position="top"
                      fill="#E31837"
                      fontSize={11}
                      fontWeight={700}
                      offset={10}
                    />
                  </ReferenceLine>

                  <Area
                    type="monotone"
                    dataKey="contacts"
                    name="Contacts"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    fill="url(#contactsGrad)"
                    animationDuration={1500}
                  />
                  <Area
                    type="monotone"
                    dataKey="feedbacks"
                    name="Feedbacks"
                    stroke="#8B5CF6"
                    strokeWidth={2}
                    fill="url(#feedbackGrad)"
                    animationDuration={1800}
                  />
                  <Area
                    type="monotone"
                    dataKey="activations"
                    name="Activations"
                    stroke="#10B981"
                    strokeWidth={3}
                    fill="url(#activationGrad)"
                    animationDuration={2000}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Before / After callout */}
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-surface-border">
              <div className="flex-1 p-3 rounded-lg bg-red-500/5 border border-red-500/10 text-center">
                <p className="text-xs text-red-400/70 mb-1 font-medium">Before Jan 15</p>
                <p className="text-lg font-bold text-red-400">~1.5/day</p>
                <p className="text-xs text-gray-600">avg activations</p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-600 flex-shrink-0" />
              <div className="flex-1 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-center">
                <p className="text-xs text-emerald-400/70 mb-1 font-medium">After Jan 15</p>
                <p className="text-lg font-bold text-emerald-400">~16/day</p>
                <p className="text-xs text-gray-600">avg activations</p>
              </div>
              <div className="flex-1 p-3 rounded-lg bg-amber-500/5 border border-amber-500/10 text-center">
                <p className="text-xs text-amber-400/70 mb-1 font-medium">Improvement</p>
                <p className="text-lg font-bold bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent">10.7x</p>
                <p className="text-xs text-gray-600">increase</p>
              </div>
            </div>
          </div>
        </section>

        {/* Live Activity Feed - 2 cols */}
        <section className="lg:col-span-2">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 rounded-lg bg-brand-red/10 border border-brand-red/20">
              <Activity className="w-5 h-5 text-brand-red-light" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Live Activity Feed</h2>
              <p className="text-sm text-gray-500">Real-time agent interactions</p>
            </div>
          </div>

          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-surface-border">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-emerald-400 font-medium">Live updates</span>
              <span className="text-xs text-gray-600 ml-auto">{(liveActivity || recentActivity).length} events</span>
            </div>
            <div className="max-h-[440px] overflow-y-auto pr-1">
              <ActivityFeed items={liveActivity || recentActivity} maxItems={10} />
            </div>
          </div>
        </section>
      </div>

      {/* ════════════════════════════════════════════════════════════
          SECTION 9 - BOTTOM CTA: THE CALL TO ACTION
          ════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden rounded-2xl border border-brand-red/20">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-red/10 via-brand-navy/10 to-brand-red/5" />
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-brand-red/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-brand-navy/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 px-8 py-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-6">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-sm text-gray-300 font-medium">The Opportunity</span>
          </div>

          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-3">
            <span className="bg-gradient-to-r from-red-400 to-red-500 bg-clip-text text-transparent">98,420</span> dormant agents.{' '}
            <span className="bg-gradient-to-r from-emerald-300 to-emerald-500 bg-clip-text text-transparent">
              &#8377;243 Cr
            </span>{' '}
            in untapped revenue.
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-6">
            Each reactivated agent generates an average of &#8377;1.8L in annual premium revenue.
            Moving from 2% to 15% activation unlocks <span className="text-emerald-400 font-semibold">13,500 new active agents</span>.
          </p>

          <div className="flex items-center justify-center gap-6">
            <div className="text-center">
              <p className="text-4xl font-black text-red-400">2%</p>
              <p className="text-xs text-gray-500 mt-1">Today</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-24 h-1 rounded-full bg-gradient-to-r from-red-500 via-amber-500 to-emerald-500" />
              <ChevronRight className="w-5 h-5 text-gray-500" />
            </div>
            <div className="text-center">
              <p className="text-4xl font-black text-emerald-400">15%</p>
              <p className="text-xs text-gray-500 mt-1">With Platform</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
