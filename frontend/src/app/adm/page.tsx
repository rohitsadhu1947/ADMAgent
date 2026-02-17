'use client';

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import { Trophy, TrendingUp, TrendingDown, Minus, Phone, Clock, Users, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useAPI } from '@/lib/useAPI';
import ChartCard from '@/components/ChartCard';

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-surface-card border border-surface-border rounded-lg p-3 shadow-xl">
        <p className="text-gray-200 font-medium text-sm mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-xs" style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function ADMPage() {
  const { data: admPerformance, loading } = useAPI(() => api.getADMPerformance());
  const adms = admPerformance || [];

  const sortedADMs = useMemo(() => [...adms].sort((a: any, b: any) => b.performance_score - a.performance_score), [adms]);

  const comparisonData = useMemo(() => {
    return adms.map((adm: any) => ({
      name: (adm.adm_name || '').split(' ')[0],
      'Activation Rate': adm.activation_rate,
      'Total Agents': adm.total_agents,
      'Interactions': adm.total_interactions,
      Score: adm.performance_score,
    }));
  }, [adms]);

  const radarData = useMemo(() => {
    return adms.map((adm: any) => ({
      name: (adm.adm_name || '').split(' ')[0],
      'Act. Rate': adm.activation_rate,
      Interactions: Math.min((adm.total_interactions || 0) * 5, 100),
      Score: adm.performance_score,
      Engagement: Math.round(adm.avg_engagement_score || 0),
      Resolution: Math.round(adm.feedback_resolution_rate || 0),
    }));
  }, [adms]);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-gray-500 border-t-white rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">ADM Performance</h1>
        <p className="text-sm text-gray-400 mt-1">
          Agent Distribution Manager performance tracking and comparison
        </p>
      </div>

      {/* ADM Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {adms.map((adm: any) => {
          const initials = adm.adm_name ? adm.adm_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2) : '??';
          return (
            <div key={adm.adm_id} className="glass-card p-5 hover:border-white/10 transition-all duration-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-red to-brand-navy flex items-center justify-center">
                  <span className="text-white font-bold text-xs">{initials}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{adm.adm_name}</p>
                  <p className="text-xs text-gray-500">{adm.region}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-xs text-gray-500">Agents</p><p className="text-lg font-bold text-white">{adm.total_agents}</p></div>
                <div><p className="text-xs text-gray-500">Active</p><p className="text-lg font-bold text-emerald-400">{adm.active_agents}</p></div>
                <div><p className="text-xs text-gray-500">Act. Rate</p><p className="text-lg font-bold text-blue-400">{adm.activation_rate}%</p></div>
                <div><p className="text-xs text-gray-500">Score</p><p className="text-lg font-bold text-amber-400">{adm.performance_score}</p></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Comparison Bar Chart */}
        <ChartCard
          title="Performance Comparison"
          subtitle="Key metrics across all ADMs"
        >
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                <XAxis dataKey="name" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ paddingTop: 10 }}
                  formatter={(value) => (
                    <span className="text-xs text-gray-400">{value}</span>
                  )}
                />
                <Bar
                  dataKey="Activation Rate"
                  fill="#E31837"
                  radius={[4, 4, 0, 0]}
                  barSize={14}
                  fillOpacity={0.85}
                />
                <Bar
                  dataKey="Score"
                  fill="#3B82F6"
                  radius={[4, 4, 0, 0]}
                  barSize={14}
                  fillOpacity={0.85}
                />
                <Bar
                  dataKey="Interactions"
                  fill="#10B981"
                  radius={[4, 4, 0, 0]}
                  barSize={14}
                  fillOpacity={0.85}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Radar Chart */}
        <ChartCard
          title="Multi-Dimensional Analysis"
          subtitle="ADM performance across dimensions"
        >
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={[
                { metric: 'Act. Rate', ...Object.fromEntries(radarData.map(d => [d.name, d['Act. Rate']])) },
                { metric: 'Interactions', ...Object.fromEntries(radarData.map(d => [d.name, d.Interactions])) },
                { metric: 'Score', ...Object.fromEntries(radarData.map(d => [d.name, d.Score])) },
                { metric: 'Engagement', ...Object.fromEntries(radarData.map(d => [d.name, d.Engagement])) },
                { metric: 'Resolution', ...Object.fromEntries(radarData.map(d => [d.name, d.Resolution])) },
              ]}>
                <PolarGrid stroke="#1F2937" />
                <PolarAngleAxis dataKey="metric" tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                <PolarRadiusAxis tick={{ fill: '#6B7280', fontSize: 10 }} domain={[0, 100]} />
                {radarData.map((adm, idx) => {
                  const colors = ['#E31837', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'];
                  return (
                    <Radar
                      key={adm.name}
                      name={adm.name}
                      dataKey={adm.name}
                      stroke={colors[idx]}
                      fill={colors[idx]}
                      fillOpacity={0.1}
                      strokeWidth={2}
                    />
                  );
                })}
                <Legend
                  formatter={(value) => (
                    <span className="text-xs text-gray-400">{value}</span>
                  )}
                />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Leaderboard Table */}
      <ChartCard title="ADM Leaderboard" subtitle="Ranked by overall performance score">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-border">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Rank</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">ADM</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Region</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Agents</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Activation Rate</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Interactions</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Overdue</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Score</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Trend</th>
              </tr>
            </thead>
            <tbody>
              {sortedADMs.map((adm: any, index: number) => {
                const initials = adm.adm_name ? adm.adm_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2) : '??';
                const trend = adm.activation_rate > 50 ? 'up' : adm.activation_rate > 20 ? 'stable' : 'down';
                return (
                <tr
                  key={adm.adm_id}
                  className="border-b border-surface-border/30 hover:bg-surface-card-hover/50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                        index === 0
                          ? 'bg-amber-500/20 text-amber-400'
                          : index === 1
                          ? 'bg-gray-400/20 text-gray-300'
                          : index === 2
                          ? 'bg-orange-700/20 text-orange-400'
                          : 'bg-surface-card text-gray-500'
                      }`}
                    >
                      {index + 1}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-red to-brand-navy flex items-center justify-center">
                        <span className="text-white font-bold text-[10px]">{initials}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{adm.adm_name}</p>
                        <p className="text-[11px] text-gray-500">{adm.region}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400">{adm.region}</td>
                  <td className="px-4 py-3 text-sm text-gray-300">
                    {adm.total_agents}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-surface-card rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${adm.activation_rate}%`,
                            background: adm.activation_rate >= 70 ? '#10B981' : adm.activation_rate >= 50 ? '#F59E0B' : '#EF4444',
                          }}
                        />
                      </div>
                      <span className="text-sm text-gray-300">{adm.activation_rate}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-300">{adm.total_interactions}</td>
                  <td className="px-4 py-3 text-sm text-gray-300">{adm.overdue_followups}</td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-bold text-white">{adm.performance_score}</span>
                  </td>
                  <td className="px-4 py-3">
                    {trend === 'up' ? (
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                    ) : trend === 'down' ? (
                      <TrendingDown className="w-4 h-4 text-red-400" />
                    ) : (
                      <Minus className="w-4 h-4 text-gray-400" />
                    )}
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  );
}
