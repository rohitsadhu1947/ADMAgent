'use client';

import { useState, useMemo } from 'react';
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
  Legend,
} from 'recharts';
import {
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Minus,
  Filter,
  CheckCircle,
  Clock,
  Eye,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAPI } from '@/lib/useAPI';
import ChartCard from '@/components/ChartCard';

const categoryLabels: Record<string, string> = {
  product: 'Product',
  commission: 'Commission',
  support: 'Support',
  training: 'Training',
  technology: 'Technology',
  market: 'Market',
  personal: 'Personal',
};

const categoryColors: Record<string, string> = {
  product: '#8B5CF6',
  commission: '#F59E0B',
  support: '#3B82F6',
  training: '#10B981',
  technology: '#EC4899',
  market: '#14B8A6',
  personal: '#6B7280',
};

const sentimentConfig = {
  positive: { label: 'Positive', color: '#10B981', icon: ThumbsUp, bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  neutral: { label: 'Neutral', color: '#6B7280', icon: Minus, bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/20' },
  negative: { label: 'Negative', color: '#EF4444', icon: ThumbsDown, bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
};

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  new: { label: 'New', color: 'text-blue-400', icon: AlertCircle },
  in_review: { label: 'In Review', color: 'text-amber-400', icon: Eye },
  actioned: { label: 'Actioned', color: 'text-purple-400', icon: Clock },
  resolved: { label: 'Resolved', color: 'text-emerald-400', icon: CheckCircle },
};

const tagCloud = [
  { text: 'Lead Quality', size: 'text-lg', weight: 'font-bold' },
  { text: 'Commission', size: 'text-base', weight: 'font-semibold' },
  { text: 'App Issues', size: 'text-sm', weight: 'font-medium' },
  { text: 'Training', size: 'text-lg', weight: 'font-bold' },
  { text: 'Response Time', size: 'text-sm', weight: 'font-medium' },
  { text: 'Product Clarity', size: 'text-base', weight: 'font-semibold' },
  { text: 'Customer Support', size: 'text-lg', weight: 'font-bold' },
  { text: 'CRM System', size: 'text-sm', weight: 'font-medium' },
  { text: 'Competition', size: 'text-base', weight: 'font-semibold' },
  { text: 'Claim Settlement', size: 'text-sm', weight: 'font-medium' },
  { text: 'Incentives', size: 'text-base', weight: 'font-semibold' },
  { text: 'Onboarding', size: 'text-sm', weight: 'font-medium' },
  { text: 'Branch Support', size: 'text-lg', weight: 'font-bold' },
  { text: 'Digital Tools', size: 'text-sm', weight: 'font-medium' },
  { text: 'Mentor Quality', size: 'text-base', weight: 'font-semibold' },
];

const tagColors = ['text-brand-red', 'text-blue-400', 'text-purple-400', 'text-emerald-400', 'text-amber-400', 'text-pink-400', 'text-cyan-400'];

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

export default function FeedbackPage() {
  const { data: feedbackRaw, loading } = useAPI(() => api.listFeedback({ limit: '100' }));
  const { data: analytics } = useAPI(() => api.getFeedbackAnalytics());
  const { data: dormancyData } = useAPI(() => api.getDormancyReasons());
  const feedbackData = feedbackRaw || [];

  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sentimentFilter, setSentimentFilter] = useState<string>('all');

  const filteredFeedback = useMemo(() => {
    return (feedbackData as any[]).filter((fb: any) => {
      const matchesCategory = categoryFilter === 'all' || fb.category === categoryFilter;
      const matchesSentiment = sentimentFilter === 'all' || fb.sentiment === sentimentFilter;
      return matchesCategory && matchesSentiment;
    });
  }, [feedbackData, categoryFilter, sentimentFilter]);

  // Sentiment distribution
  const sentimentDistribution = useMemo(() => {
    if (analytics && analytics.by_sentiment) {
      return [
        { name: 'Positive', value: analytics.by_sentiment.positive || 0, color: '#10B981' },
        { name: 'Neutral', value: analytics.by_sentiment.neutral || 0, color: '#6B7280' },
        { name: 'Negative', value: analytics.by_sentiment.negative || 0, color: '#EF4444' },
      ];
    }
    const counts = { positive: 0, neutral: 0, negative: 0 };
    (feedbackData as any[]).forEach((fb: any) => { if (fb.sentiment) counts[fb.sentiment as keyof typeof counts]++; });
    return [
      { name: 'Positive', value: counts.positive, color: '#10B981' },
      { name: 'Neutral', value: counts.neutral, color: '#6B7280' },
      { name: 'Negative', value: counts.negative, color: '#EF4444' },
    ];
  }, [analytics, feedbackData]);

  // Feedback by category
  const feedbackByCategory = useMemo(() => {
    if (analytics && analytics.by_category) {
      return Object.entries(analytics.by_category)
        .map(([category, count]) => ({
          category: categoryLabels[category] || category,
          count: count as number,
          fill: categoryColors[category] || '#6B7280',
        }))
        .sort((a, b) => b.count - a.count);
    }
    const counts: Record<string, number> = {};
    (feedbackData as any[]).forEach((fb: any) => { counts[fb.category] = (counts[fb.category] || 0) + 1; });
    return Object.entries(counts)
      .map(([category, count]) => ({
        category: categoryLabels[category] || category,
        count,
        fill: categoryColors[category] || '#6B7280',
      }))
      .sort((a, b) => b.count - a.count);
  }, [analytics, feedbackData]);

  // Top Dormancy Reasons from API
  const dormancyReasonsData = useMemo(() => {
    if (!dormancyData?.by_reason) return [];
    const colors = ['#E31837', '#F59E0B', '#3B82F6', '#10B981', '#8B5CF6', '#EC4899', '#14B8A6'];
    return Object.entries(dormancyData.by_reason).map(([reason, count], i) => ({
      reason,
      count: count as number,
      color: colors[i % colors.length],
    })).sort((a, b) => b.count - a.count);
  }, [dormancyData]);

  const getStatus = (fb: any) => {
    if (fb.status) return fb.status;
    if (fb.resolved) return 'resolved';
    return 'new';
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-gray-500 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Feedback Analytics</h1>
        <p className="text-sm text-gray-400 mt-1">
          Analyze agent feedback to identify key improvement areas
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {sentimentDistribution.map((item) => {
          const config = sentimentConfig[item.name.toLowerCase() as keyof typeof sentimentConfig];
          const Icon = config.icon;
          return (
            <div
              key={item.name}
              className={`glass-card p-4 ${config.border} border`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${config.bg}`}>
                    <Icon className={`w-5 h-5 ${config.text}`} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">{item.name} Feedback</p>
                    <p className="text-2xl font-bold text-white">{item.value}</p>
                  </div>
                </div>
                <p className={`text-sm font-medium ${config.text}`}>
                  {feedbackData.length > 0 ? Math.round((item.value / feedbackData.length) * 100) : 0}%
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Dormancy Reasons */}
        <ChartCard
          title="Top Dormancy Reasons"
          subtitle="Sorted by frequency"
        >
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dormancyReasonsData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <YAxis
                  type="category"
                  dataKey="reason"
                  tick={{ fill: '#9CA3AF', fontSize: 11 }}
                  width={120}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Count" radius={[0, 6, 6, 0]} barSize={20}>
                  {dormancyReasonsData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} fillOpacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Sentiment Distribution Pie + Category Bar */}
        <ChartCard
          title="Sentiment Distribution"
          subtitle="Overall feedback sentiment breakdown"
        >
          <div className="h-[300px] flex items-center">
            <div className="w-1/2">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={sentimentDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {sentimentDistribution.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-1/2 space-y-4">
              {sentimentDistribution.map((item) => (
                <div key={item.name} className="flex items-center gap-3">
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <div className="flex-1">
                    <p className="text-sm text-gray-300">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.value} feedbacks</p>
                  </div>
                  <span className="text-sm font-bold text-white">
                    {feedbackData.length > 0 ? Math.round((item.value / feedbackData.length) * 100) : 0}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>
      </div>

      {/* Row 2: Category Chart + Tag Cloud */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Feedback by Category */}
        <ChartCard
          title="Feedback by Category"
          subtitle="Distribution across categories"
        >
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={feedbackByCategory} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                <XAxis dataKey="category" tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Feedbacks" radius={[6, 6, 0, 0]} barSize={36}>
                  {feedbackByCategory.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} fillOpacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Tag Cloud */}
        <ChartCard title="Common Themes" subtitle="Frequently mentioned topics">
          <div className="flex flex-wrap gap-3 p-4 min-h-[280px] items-center content-center">
            {tagCloud.map((tag, index) => (
              <span
                key={tag.text}
                className={`${tag.size} ${tag.weight} ${
                  tagColors[index % tagColors.length]
                } px-3 py-1.5 rounded-lg bg-surface-card/60 border border-surface-border/40 hover:border-brand-red/30 hover:bg-surface-card-hover transition-all duration-200 cursor-default`}
              >
                {tag.text}
              </span>
            ))}
          </div>
        </ChartCard>
      </div>

      {/* Filters */}
      <div className="glass-card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="input-dark text-sm py-2"
          >
            <option value="all">All Categories</option>
            {Object.entries(categoryLabels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <select
            value={sentimentFilter}
            onChange={(e) => setSentimentFilter(e.target.value)}
            className="input-dark text-sm py-2"
          >
            <option value="all">All Sentiments</option>
            <option value="positive">Positive</option>
            <option value="neutral">Neutral</option>
            <option value="negative">Negative</option>
          </select>
          <span className="text-xs text-gray-500">{filteredFeedback.length} entries</span>
        </div>
      </div>

      {/* Recent Feedback Entries */}
      <ChartCard title="Recent Feedback" subtitle="Latest agent feedback entries">
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
          {filteredFeedback.map((fb: any) => {
            const status = getStatus(fb);
            const statusStyle = statusConfig[status] || statusConfig.new;
            const StatusIcon = statusStyle.icon;
            const sentimentStyle = sentimentConfig[fb.sentiment as keyof typeof sentimentConfig] || sentimentConfig.neutral;
            const SentimentIcon = sentimentStyle.icon;

            return (
              <div
                key={fb.id}
                className="p-4 rounded-lg bg-surface-card/40 hover:bg-surface-card-hover/50 border border-surface-border/30 transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">{fb.agent_name || `Agent #${fb.agent_id}`}</span>
                      <span className="text-gray-600">|</span>
                      <span className="text-xs text-gray-500">{fb.adm_name || `ADM #${fb.adm_id}`}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Category badge */}
                    <span
                      className="badge text-[10px]"
                      style={{
                        backgroundColor: `${categoryColors[fb.category] || '#6B7280'}15`,
                        color: categoryColors[fb.category] || '#6B7280',
                        border: `1px solid ${categoryColors[fb.category] || '#6B7280'}30`,
                      }}
                    >
                      {categoryLabels[fb.category] || fb.category}
                    </span>
                    {/* Sentiment badge */}
                    <span className={`badge text-[10px] ${sentimentStyle.bg} ${sentimentStyle.text} ${sentimentStyle.border} border`}>
                      <SentimentIcon className="w-3 h-3 mr-1" />
                      {sentimentStyle.label}
                    </span>
                  </div>
                </div>

                <p className="text-sm text-gray-300 mb-2 leading-relaxed">{fb.text}</p>

                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-gray-500">
                    {new Date(fb.created_at || fb.timestamp).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  <div className={`flex items-center gap-1 ${statusStyle.color}`}>
                    <StatusIcon className="w-3 h-3" />
                    <span className="text-[11px] font-medium">{statusStyle.label}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ChartCard>
    </div>
  );
}
