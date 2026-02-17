'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  Shuffle,
  Users,
  BarChart3,
  Play,
  RefreshCw,
  Loader2,
  CheckCircle,
  AlertTriangle,
  MapPin,
  Globe,
  Upload,
  Plus,
  Search,
  UserPlus,
  ArrowRight,
  X,
  FileSpreadsheet,
  Unlink,
  Download,
  UserCheck,
  UserX,
  Eye,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAPI } from '@/lib/useAPI';

type TabKey = 'overview' | 'agents' | 'manual' | 'bulk' | 'auto';

const TABS: { key: TabKey; label: string; icon: any }[] = [
  { key: 'overview', label: 'Overview', icon: BarChart3 },
  { key: 'agents', label: 'Agent Roster', icon: Users },
  { key: 'manual', label: 'Manual Assign', icon: UserPlus },
  { key: 'bulk', label: 'Bulk Upload', icon: Upload },
  { key: 'auto', label: 'Auto-Assign', icon: Shuffle },
];

const LIFECYCLE_COLORS: Record<string, string> = {
  dormant: 'bg-red-500/15 text-red-400 border-red-500/20',
  at_risk: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  contacted: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  engaged: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
  trained: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20',
  active: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
};

const LIFECYCLE_LABELS: Record<string, string> = {
  dormant: 'Dormant',
  at_risk: 'At Risk',
  contacted: 'Contacted',
  engaged: 'Engaged',
  trained: 'Trained',
  active: 'Active',
};

export default function AssignmentPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const { data: stats, loading: statsLoading, refetch: refetchStats } = useAPI(() => api.getAssignmentStats());
  const { data: agents, loading: agentsLoading, refetch: refetchAgents } = useAPI(() => api.listAgents({ limit: '200' }));
  const { data: adms, loading: admsLoading, refetch: refetchADMs } = useAPI(() => api.listADMs());

  const [strategy, setStrategy] = useState<string>('balanced');
  const [running, setRunning] = useState(false);
  const [actionResult, setActionResult] = useState<any>(null);

  // Agent roster filters
  const [agentSearch, setAgentSearch] = useState('');
  const [agentFilter, setAgentFilter] = useState<string>('all');
  const [stateFilter, setStateFilter] = useState<string>('all');

  // Manual assign state
  const [selectedAgents, setSelectedAgents] = useState<Set<number>>(new Set());
  const [targetADM, setTargetADM] = useState<number | null>(null);

  // Bulk upload state
  const [bulkCSV, setBulkCSV] = useState('');
  const [bulkParsed, setBulkParsed] = useState<any[]>([]);
  const [bulkError, setBulkError] = useState('');

  // Add agent form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAgent, setNewAgent] = useState({
    name: '', phone: '', email: '', location: '', state: '', language: 'Hindi',
    lifecycle_state: 'dormant', dormancy_reason: '', assigned_adm_id: '',
  });

  const refetchAll = useCallback(() => {
    refetchStats();
    refetchAgents();
    refetchADMs();
  }, [refetchStats, refetchAgents, refetchADMs]);

  // Derived data
  const agentList = useMemo(() => {
    const list = Array.isArray(agents) ? agents : [];
    return list.filter((a: any) => {
      if (agentSearch) {
        const s = agentSearch.toLowerCase();
        if (!a.name?.toLowerCase().includes(s) && !a.phone?.includes(s) && !a.location?.toLowerCase().includes(s)) return false;
      }
      if (agentFilter === 'unassigned' && a.assigned_adm_id) return false;
      if (agentFilter === 'assigned' && !a.assigned_adm_id) return false;
      if (stateFilter !== 'all' && a.lifecycle_state !== stateFilter) return false;
      return true;
    });
  }, [agents, agentSearch, agentFilter, stateFilter]);

  const admList = useMemo(() => Array.isArray(adms) ? adms : [], [adms]);

  const admMap = useMemo(() => {
    const m: Record<number, any> = {};
    admList.forEach((a: any) => { m[a.id] = a; });
    return m;
  }, [admList]);

  const admBreakdown = stats?.adm_breakdown || [];
  const totalAgents = stats?.total_agents || 0;
  const unassignedCount = stats?.unassigned_agents || 0;
  const assignedCount = stats?.assigned_agents || 0;
  const avgUtilization = stats?.avg_capacity_utilization_pct || 0;

  // Action handlers
  const handleAutoAssign = async () => {
    setRunning(true);
    setActionResult(null);
    try {
      const res = await api.autoAssign({ strategy });
      setActionResult({ type: 'success', title: 'Auto-Assignment Complete', data: res });
      refetchAll();
    } catch (e: any) {
      setActionResult({ type: 'error', title: 'Auto-Assignment Failed', message: e.message });
    } finally {
      setRunning(false);
    }
  };

  const handleRebalance = async () => {
    setRunning(true);
    setActionResult(null);
    try {
      const res = await api.rebalance();
      setActionResult({ type: 'success', title: 'Rebalancing Complete', data: res });
      refetchAll();
    } catch (e: any) {
      setActionResult({ type: 'error', title: 'Rebalancing Failed', message: e.message });
    } finally {
      setRunning(false);
    }
  };

  const handleManualAssign = async () => {
    if (!targetADM || selectedAgents.size === 0) return;
    setRunning(true);
    setActionResult(null);
    const results: any[] = [];
    const errors: string[] = [];
    for (const agentId of selectedAgents) {
      try {
        const res = await api.assignAgentToADM(agentId, targetADM);
        results.push({ agent_id: agentId, agent_name: res.name, adm_id: targetADM });
      } catch (e: any) {
        errors.push(`Agent #${agentId}: ${e.message}`);
      }
    }
    setActionResult({
      type: errors.length > 0 ? 'warning' : 'success',
      title: `Assigned ${results.length} of ${selectedAgents.size} Agents`,
      data: { assigned_count: results.length, assignments: results, errors },
    });
    setSelectedAgents(new Set());
    setTargetADM(null);
    refetchAll();
    setRunning(false);
  };

  const handleUnassign = async (agentId: number) => {
    try {
      await api.unassignAgent(agentId);
      refetchAll();
    } catch (e: any) {
      setActionResult({ type: 'error', title: 'Unassign Failed', message: e.message });
    }
  };

  const handleQuickAssign = async (agentId: number, admId: number) => {
    try {
      await api.assignAgentToADM(agentId, admId);
      refetchAll();
    } catch (e: any) {
      setActionResult({ type: 'error', title: 'Assignment Failed', message: e.message });
    }
  };

  const handleAddAgent = async () => {
    setRunning(true);
    try {
      const payload: any = { ...newAgent };
      if (payload.assigned_adm_id) payload.assigned_adm_id = parseInt(payload.assigned_adm_id);
      else delete payload.assigned_adm_id;
      if (!payload.email) delete payload.email;
      if (!payload.dormancy_reason) delete payload.dormancy_reason;
      await api.createAgent(payload);
      setNewAgent({ name: '', phone: '', email: '', location: '', state: '', language: 'Hindi', lifecycle_state: 'dormant', dormancy_reason: '', assigned_adm_id: '' });
      setShowAddForm(false);
      setActionResult({ type: 'success', title: 'Agent Created', data: { message: `${payload.name} added successfully` } });
      refetchAll();
    } catch (e: any) {
      setActionResult({ type: 'error', title: 'Failed to Add Agent', message: e.message });
    } finally {
      setRunning(false);
    }
  };

  // Bulk CSV/TSV parse — auto-detects comma vs tab delimiter
  const handleCSVParse = () => {
    setBulkError('');
    setBulkParsed([]);
    if (!bulkCSV.trim()) { setBulkError('Please paste CSV or tab-separated data'); return; }
    const lines = bulkCSV.trim().split('\n');
    if (lines.length < 2) { setBulkError('Data must have a header row and at least one data row'); return; }
    // Auto-detect delimiter: if header contains tabs, use tab; otherwise comma
    const delimiter = lines[0].includes('\t') ? '\t' : ',';
    const headers = lines[0].split(delimiter).map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));
    const reqFields = ['name', 'phone', 'location'];
    const missing = reqFields.filter(f => !headers.includes(f));
    if (missing.length) { setBulkError(`Missing required columns: ${missing.join(', ')}`); return; }
    const parsed: any[] = [];
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const vals = lines[i].split(delimiter).map(v => v.trim());
      const row: any = {};
      headers.forEach((h, idx) => { row[h] = vals[idx] || ''; });
      if (!row.name || !row.phone || !row.location) {
        setBulkError(`Row ${i + 1}: name, phone, and location are required`);
        return;
      }
      row.language = row.language || 'Hindi';
      row.lifecycle_state = row.lifecycle_state || 'dormant';
      parsed.push(row);
    }
    setBulkParsed(parsed);
  };

  const handleBulkUpload = async () => {
    if (!bulkParsed.length) return;
    setRunning(true);
    try {
      const res = await api.bulkImportAgents(bulkParsed);
      setActionResult({
        type: res.errors_count > 0 ? 'warning' : 'success',
        title: `Bulk Import: ${res.created} of ${res.total_submitted} Created`,
        data: res,
      });
      setBulkCSV('');
      setBulkParsed([]);
      refetchAll();
    } catch (e: any) {
      setActionResult({ type: 'error', title: 'Bulk Import Failed', message: e.message });
    } finally {
      setRunning(false);
    }
  };

  const toggleSelectAgent = (id: number) => {
    setSelectedAgents(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAllVisible = () => {
    const unassigned = (Array.isArray(agents) ? agents : []).filter((a: any) => !a.assigned_adm_id);
    setSelectedAgents(new Set(unassigned.map((a: any) => a.id)));
  };

  if (statsLoading && agentsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-gray-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Agent Assignment Manager</h1>
          <p className="text-sm text-gray-400 mt-1">
            Manage agent-ADM assignments, bulk import, and intelligent auto-assignment
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-red hover:bg-brand-red/90 text-white text-sm font-medium transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Agent
          </button>
          <button
            onClick={refetchAll}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-card border border-surface-border text-gray-400 hover:text-white text-sm transition-all"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="glass-card p-4">
          <p className="text-[11px] text-gray-500 uppercase tracking-wider">Total Agents</p>
          <p className="text-2xl font-bold text-white mt-1">{totalAgents}</p>
        </div>
        <div className={`glass-card p-4 ${unassignedCount > 0 ? 'border-red-500/20' : 'border-emerald-500/20'}`}>
          <p className="text-[11px] text-gray-500 uppercase tracking-wider">Unassigned</p>
          <p className={`text-2xl font-bold mt-1 ${unassignedCount > 0 ? 'text-red-400' : 'text-emerald-400'}`}>{unassignedCount}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-[11px] text-gray-500 uppercase tracking-wider">Assigned</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">{assignedCount}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-[11px] text-gray-500 uppercase tracking-wider">Active ADMs</p>
          <p className="text-2xl font-bold text-purple-400 mt-1">{admBreakdown.length}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-[11px] text-gray-500 uppercase tracking-wider">Avg Utilization</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">{avgUtilization}%</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-card/50 p-1 rounded-xl border border-surface-border/30 overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setActionResult(null); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.key
                  ? 'bg-brand-red/10 text-brand-red-light border border-brand-red/20'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ==================== TAB: OVERVIEW ==================== */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="glass-card p-6">
            <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-400" />
              ADM Load Distribution
            </h3>
            {admBreakdown.length > 0 ? (
              <div className="space-y-3">
                {admBreakdown.map((adm: any) => {
                  const pct = adm.utilization_pct || 0;
                  const barColor = pct > 90 ? '#EF4444' : pct > 70 ? '#F59E0B' : '#3B82F6';
                  return (
                    <div key={adm.adm_id} className="flex items-center gap-4">
                      <div className="w-36 truncate">
                        <p className="text-sm text-white font-medium truncate">{adm.adm_name}</p>
                        <p className="text-[10px] text-gray-500">{adm.region}</p>
                      </div>
                      <div className="flex-1 h-3 bg-[#0B1120] rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%`, background: barColor }} />
                      </div>
                      <div className="w-28 text-right">
                        <span className="text-sm font-medium text-white">{adm.assigned_agents}</span>
                        <span className="text-xs text-gray-500">/{adm.max_capacity}</span>
                        <span className="text-xs text-gray-400 ml-2">({pct}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-8">No ADM data available</p>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-card p-6">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-amber-400" />
                Unassigned by Location
              </h3>
              {stats?.unassigned_by_location && Object.keys(stats.unassigned_by_location).length > 0 ? (
                <div className="space-y-2">
                  {Object.entries(stats.unassigned_by_location).slice(0, 8).map(([loc, count]: any) => (
                    <div key={loc} className="flex items-center justify-between">
                      <span className="text-sm text-gray-300">{loc || 'Unknown'}</span>
                      <span className="text-sm font-medium text-amber-400">{count}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">All agents assigned</p>
              )}
            </div>
            <div className="glass-card p-6">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Globe className="w-4 h-4 text-purple-400" />
                Unassigned by Language
              </h3>
              {stats?.unassigned_by_language && Object.keys(stats.unassigned_by_language).length > 0 ? (
                <div className="space-y-2">
                  {Object.entries(stats.unassigned_by_language).slice(0, 8).map(([lang, count]: any) => (
                    <div key={lang} className="flex items-center justify-between">
                      <span className="text-sm text-gray-300">{lang || 'Unknown'}</span>
                      <span className="text-sm font-medium text-purple-400">{count}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">All agents assigned</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB: AGENT ROSTER ==================== */}
      {activeTab === 'agents' && (
        <div className="space-y-4">
          <div className="glass-card p-4 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={agentSearch}
                onChange={(e) => setAgentSearch(e.target.value)}
                placeholder="Search by name, phone, location..."
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-[#0B1120] border border-surface-border/30 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-red/30"
              />
            </div>
            <select value={agentFilter} onChange={(e) => setAgentFilter(e.target.value)} className="px-3 py-2 rounded-lg bg-[#0B1120] border border-surface-border/30 text-sm text-gray-300 focus:outline-none">
              <option value="all">All Agents</option>
              <option value="unassigned">Unassigned Only</option>
              <option value="assigned">Assigned Only</option>
            </select>
            <select value={stateFilter} onChange={(e) => setStateFilter(e.target.value)} className="px-3 py-2 rounded-lg bg-[#0B1120] border border-surface-border/30 text-sm text-gray-300 focus:outline-none">
              <option value="all">All States</option>
              <option value="dormant">Dormant</option>
              <option value="at_risk">At Risk</option>
              <option value="contacted">Contacted</option>
              <option value="engaged">Engaged</option>
              <option value="trained">Trained</option>
              <option value="active">Active</option>
            </select>
            <span className="text-xs text-gray-500">{agentList.length} results</span>
          </div>

          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-surface-border/30">
                    <th className="text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Agent</th>
                    <th className="text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Location</th>
                    <th className="text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Language</th>
                    <th className="text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Status</th>
                    <th className="text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Assigned ADM</th>
                    <th className="text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Score</th>
                    <th className="text-right text-[11px] font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {agentList.slice(0, 50).map((agent: any) => {
                    const assignedADM = agent.assigned_adm_id ? admMap[agent.assigned_adm_id] : null;
                    return (
                      <tr key={agent.id} className="border-b border-surface-border/10 hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-white">{agent.name}</p>
                          <p className="text-[11px] text-gray-500">{agent.phone}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-gray-300">{agent.location}</p>
                          {agent.state && <p className="text-[11px] text-gray-500">{agent.state}</p>}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-300">{agent.language}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-medium border ${LIFECYCLE_COLORS[agent.lifecycle_state] || 'bg-gray-500/15 text-gray-400'}`}>
                            {LIFECYCLE_LABELS[agent.lifecycle_state] || agent.lifecycle_state}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {assignedADM ? (
                            <div className="flex items-center gap-2">
                              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-sm text-emerald-400">{assignedADM.name}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <UserX className="w-3.5 h-3.5 text-red-400" />
                              <select
                                onChange={(e) => { if (e.target.value) handleQuickAssign(agent.id, parseInt(e.target.value)); }}
                                className="bg-transparent border-none text-xs text-red-400 focus:outline-none cursor-pointer"
                                defaultValue=""
                              >
                                <option value="" className="bg-[#0F172A]">Unassigned — assign to...</option>
                                {admList.map((adm: any) => (
                                  <option key={adm.id} value={adm.id} className="bg-[#0F172A] text-gray-300">{adm.name} ({adm.region})</option>
                                ))}
                              </select>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-12 h-1.5 bg-[#0B1120] rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${agent.engagement_score || 0}%`, background: (agent.engagement_score || 0) > 60 ? '#10B981' : (agent.engagement_score || 0) > 30 ? '#F59E0B' : '#EF4444' }} />
                            </div>
                            <span className="text-xs text-gray-400">{agent.engagement_score || 0}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {agent.assigned_adm_id ? (
                            <button onClick={() => handleUnassign(agent.id)} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 ml-auto" title="Unassign from ADM">
                              <Unlink className="w-3.5 h-3.5" />
                              Unassign
                            </button>
                          ) : (
                            <span className="text-xs text-gray-600">{'\u2014'}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {agentList.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                <p className="text-sm text-gray-500">No agents match your filters</p>
              </div>
            )}
            {agentList.length > 50 && (
              <div className="px-4 py-3 border-t border-surface-border/20 text-center">
                <p className="text-xs text-gray-500">Showing 50 of {agentList.length} agents. Use filters to narrow down.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== TAB: MANUAL ASSIGN ==================== */}
      {activeTab === 'manual' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-red-400" />
                Unassigned Agents
                <span className="text-xs text-gray-500 font-normal">({selectedAgents.size} selected)</span>
              </h3>
              <div className="flex items-center gap-2">
                <button onClick={selectAllVisible} className="text-xs text-blue-400 hover:text-blue-300">Select All</button>
                <button onClick={() => setSelectedAgents(new Set())} className="text-xs text-gray-400 hover:text-gray-300">Clear</button>
              </div>
            </div>
            <div className="space-y-1.5 max-h-[450px] overflow-y-auto pr-1">
              {(Array.isArray(agents) ? agents : []).filter((a: any) => !a.assigned_adm_id).map((agent: any) => (
                <label
                  key={agent.id}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                    selectedAgents.has(agent.id) ? 'bg-brand-red/10 border border-brand-red/20' : 'bg-[#0B1120] border border-transparent hover:border-surface-border/30'
                  }`}
                >
                  <input type="checkbox" checked={selectedAgents.has(agent.id)} onChange={() => toggleSelectAgent(agent.id)} className="w-4 h-4 rounded border-gray-600 bg-[#0B1120] text-brand-red focus:ring-brand-red/20" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">{agent.name}</p>
                    <p className="text-[11px] text-gray-500">{agent.location} &bull; {agent.language} &bull; {agent.phone}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${LIFECYCLE_COLORS[agent.lifecycle_state]}`}>
                    {LIFECYCLE_LABELS[agent.lifecycle_state]}
                  </span>
                </label>
              ))}
              {(Array.isArray(agents) ? agents : []).filter((a: any) => !a.assigned_adm_id).length === 0 && (
                <div className="text-center py-10">
                  <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">All agents are assigned</p>
                </div>
              )}
            </div>
          </div>

          <div className="glass-card p-5">
            <h3 className="text-base font-semibold text-white flex items-center gap-2 mb-4">
              <UserPlus className="w-5 h-5 text-blue-400" />
              Assign To ADM
            </h3>
            <div className="space-y-2 mb-6 max-h-[320px] overflow-y-auto pr-1">
              {admBreakdown.map((adm: any) => {
                const pct = adm.utilization_pct || 0;
                const full = pct >= 100;
                return (
                  <button
                    key={adm.adm_id}
                    onClick={() => !full && setTargetADM(adm.adm_id)}
                    disabled={full}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      targetADM === adm.adm_id ? 'bg-blue-500/10 border-blue-500/30' : full ? 'bg-surface-card/30 border-transparent opacity-40 cursor-not-allowed' : 'bg-[#0B1120] border-transparent hover:border-surface-border/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-white font-medium">{adm.adm_name}</p>
                      <span className="text-[11px] text-gray-400">{adm.assigned_agents}/{adm.max_capacity}</span>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5">{adm.region}</p>
                    <div className="w-full h-1.5 bg-[#1E293B] rounded-full mt-2 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${Math.min(pct, 100)}%`, background: pct > 90 ? '#EF4444' : pct > 70 ? '#F59E0B' : '#3B82F6' }} />
                    </div>
                  </button>
                );
              })}
            </div>
            <button
              onClick={handleManualAssign}
              disabled={running || selectedAgents.size === 0 || !targetADM}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-brand-red hover:bg-brand-red/90 text-white text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              Assign {selectedAgents.size} Agent{selectedAgents.size !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      )}

      {/* ==================== TAB: BULK UPLOAD ==================== */}
      {activeTab === 'bulk' && (
        <div className="space-y-6">
          <div className="glass-card p-6">
            <h3 className="text-base font-semibold text-white mb-2 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
              Bulk Import Agents
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              Paste CSV or tab-separated data below. Required columns: <span className="text-white font-medium">name, phone, location</span>.
              Optional: <span className="text-gray-300">email, state, language, lifecycle_state, dormancy_reason</span>
            </p>

            <div className="bg-[#0B1120] rounded-lg p-4 mb-4 border border-surface-border/20">
              <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-2">Sample CSV Template</p>
              <code className="text-xs text-emerald-400 block whitespace-pre leading-relaxed">
{`name,phone,location,state,language,lifecycle_state
Raj Kumar,9876543210,Mumbai,Maharashtra,Hindi,dormant
Anita Sharma,9876543211,Delhi,Delhi,Hindi,at_risk
John D'Souza,9876543212,Bangalore,Karnataka,English,dormant`}
              </code>
              <button onClick={() => setBulkCSV(`name,phone,location,state,language,lifecycle_state\n`)} className="mt-2 text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                <Download className="w-3 h-3" />
                Use Template
              </button>
            </div>

            <textarea
              value={bulkCSV}
              onChange={(e) => { setBulkCSV(e.target.value); setBulkParsed([]); setBulkError(''); }}
              rows={8}
              placeholder="Paste your CSV or tab-separated data here..."
              className="w-full p-4 rounded-lg bg-[#0B1120] border border-surface-border/30 text-sm text-white placeholder-gray-600 font-mono focus:outline-none focus:border-brand-red/30 resize-y"
            />

            {bulkError && (
              <div className="flex items-center gap-2 mt-2 text-sm text-red-400">
                <AlertTriangle className="w-4 h-4" />
                {bulkError}
              </div>
            )}

            <div className="flex items-center gap-3 mt-4">
              <button onClick={handleCSVParse} disabled={!bulkCSV.trim()} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-surface-card border border-surface-border text-gray-300 hover:text-white text-sm font-medium disabled:opacity-40 transition-all">
                <Eye className="w-4 h-4" />
                Preview & Validate
              </button>
              {bulkParsed.length > 0 && (
                <button onClick={handleBulkUpload} disabled={running} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand-red hover:bg-brand-red/90 text-white text-sm font-medium disabled:opacity-40 transition-all">
                  {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  Import {bulkParsed.length} Agents
                </button>
              )}
            </div>
          </div>

          {bulkParsed.length > 0 && (
            <div className="glass-card overflow-hidden">
              <div className="px-5 py-3 border-b border-surface-border/20">
                <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  Preview: {bulkParsed.length} agents ready to import
                </h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-surface-border/20">
                      <th className="text-left text-[11px] font-medium text-gray-500 uppercase px-4 py-2">#</th>
                      <th className="text-left text-[11px] font-medium text-gray-500 uppercase px-4 py-2">Name</th>
                      <th className="text-left text-[11px] font-medium text-gray-500 uppercase px-4 py-2">Phone</th>
                      <th className="text-left text-[11px] font-medium text-gray-500 uppercase px-4 py-2">Location</th>
                      <th className="text-left text-[11px] font-medium text-gray-500 uppercase px-4 py-2">State</th>
                      <th className="text-left text-[11px] font-medium text-gray-500 uppercase px-4 py-2">Language</th>
                      <th className="text-left text-[11px] font-medium text-gray-500 uppercase px-4 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bulkParsed.slice(0, 20).map((row, idx) => (
                      <tr key={idx} className="border-b border-surface-border/10">
                        <td className="px-4 py-2 text-xs text-gray-500">{idx + 1}</td>
                        <td className="px-4 py-2 text-sm text-white">{row.name}</td>
                        <td className="px-4 py-2 text-sm text-gray-300">{row.phone}</td>
                        <td className="px-4 py-2 text-sm text-gray-300">{row.location}</td>
                        <td className="px-4 py-2 text-sm text-gray-300">{row.state || '\u2014'}</td>
                        <td className="px-4 py-2 text-sm text-gray-300">{row.language}</td>
                        <td className="px-4 py-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${LIFECYCLE_COLORS[row.lifecycle_state] || 'bg-gray-500/15 text-gray-400'}`}>
                            {LIFECYCLE_LABELS[row.lifecycle_state] || row.lifecycle_state}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {bulkParsed.length > 20 && (
                <div className="px-4 py-2 text-center text-xs text-gray-500">Showing 20 of {bulkParsed.length} rows</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ==================== TAB: AUTO-ASSIGN ==================== */}
      {activeTab === 'auto' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card p-6">
            <h3 className="text-base font-semibold text-white mb-1 flex items-center gap-2">
              <Shuffle className="w-5 h-5 text-brand-red-light" />
              Auto-Assign Engine
            </h3>
            <p className="text-sm text-gray-400 mb-5">
              Intelligently assign all {unassignedCount} unassigned agents to ADMs using AI-powered matching
            </p>
            <div className="mb-5">
              <p className="text-xs text-gray-400 mb-2 uppercase tracking-wider">Assignment Strategy</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'balanced', label: 'Balanced', icon: BarChart3, desc: 'Even workload distribution across all ADMs' },
                  { value: 'geographic', label: 'Geographic', icon: MapPin, desc: 'Match agents to nearest ADMs by region' },
                  { value: 'language', label: 'Language', icon: Globe, desc: 'Prioritize language compatibility' },
                ].map((opt) => {
                  const OptIcon = opt.icon;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setStrategy(opt.value)}
                      className={`p-4 rounded-lg border text-left transition-all ${
                        strategy === opt.value ? 'bg-brand-red/10 border-brand-red/30 text-white' : 'bg-[#0B1120] border-surface-border/20 text-gray-400 hover:text-white hover:border-white/10'
                      }`}
                    >
                      <OptIcon className="w-5 h-5 mb-2" />
                      <p className="text-sm font-medium">{opt.label}</p>
                      <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">{opt.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>
            <button
              onClick={handleAutoAssign}
              disabled={running || unassignedCount === 0}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-lg bg-brand-red hover:bg-brand-red/90 text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              {unassignedCount > 0 ? `Auto-Assign ${unassignedCount} Agents` : 'All Agents Assigned'}
            </button>
          </div>

          <div className="glass-card p-6">
            <h3 className="text-base font-semibold text-white mb-1 flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-blue-400" />
              Rebalance Workloads
            </h3>
            <p className="text-sm text-gray-400 mb-5">
              Redistribute agents from overloaded ADMs to underloaded ones while maintaining geographic and language compatibility
            </p>
            {admBreakdown.length > 0 && (
              <div className="space-y-2.5 mb-5">
                {admBreakdown.map((adm: any) => {
                  const pct = adm.utilization_pct || 0;
                  return (
                    <div key={adm.adm_id} className="flex items-center gap-3">
                      <span className="text-xs text-gray-400 w-28 truncate">{adm.adm_name}</span>
                      <div className="flex-1 h-2 bg-[#0B1120] rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%`, background: pct > 90 ? '#EF4444' : pct > 70 ? '#F59E0B' : '#3B82F6' }} />
                      </div>
                      <span className="text-xs text-gray-300 w-12 text-right">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            )}
            <button
              onClick={handleRebalance}
              disabled={running}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-lg bg-surface-card border border-surface-border text-gray-300 hover:text-white hover:bg-surface-card-hover text-sm font-semibold disabled:opacity-40 transition-all"
            >
              {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Rebalance All ADMs
            </button>
          </div>
        </div>
      )}

      {/* ==================== ADD AGENT MODAL ==================== */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowAddForm(false)}>
          <div className="bg-[#0F172A] rounded-2xl border border-surface-border/30 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-surface-border/20">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-brand-red-light" />
                Add New Agent
              </h3>
              <button onClick={() => setShowAddForm(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Name *</label>
                  <input value={newAgent.name} onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-[#0B1120] border border-surface-border/30 text-sm text-white focus:outline-none focus:border-brand-red/30" placeholder="Full name" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Phone *</label>
                  <input value={newAgent.phone} onChange={(e) => setNewAgent({ ...newAgent, phone: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-[#0B1120] border border-surface-border/30 text-sm text-white focus:outline-none focus:border-brand-red/30" placeholder="10-digit mobile" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Location (City) *</label>
                  <input value={newAgent.location} onChange={(e) => setNewAgent({ ...newAgent, location: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-[#0B1120] border border-surface-border/30 text-sm text-white focus:outline-none focus:border-brand-red/30" placeholder="e.g., Mumbai" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">State</label>
                  <input value={newAgent.state} onChange={(e) => setNewAgent({ ...newAgent, state: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-[#0B1120] border border-surface-border/30 text-sm text-white focus:outline-none focus:border-brand-red/30" placeholder="e.g., Maharashtra" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Email</label>
                  <input value={newAgent.email} onChange={(e) => setNewAgent({ ...newAgent, email: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-[#0B1120] border border-surface-border/30 text-sm text-white focus:outline-none focus:border-brand-red/30" placeholder="email@example.com" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Language</label>
                  <select value={newAgent.language} onChange={(e) => setNewAgent({ ...newAgent, language: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-[#0B1120] border border-surface-border/30 text-sm text-gray-300 focus:outline-none">
                    {['Hindi', 'English', 'Marathi', 'Tamil', 'Telugu', 'Kannada', 'Bengali', 'Gujarati', 'Malayalam', 'Punjabi'].map(l => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Lifecycle Status</label>
                  <select value={newAgent.lifecycle_state} onChange={(e) => setNewAgent({ ...newAgent, lifecycle_state: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-[#0B1120] border border-surface-border/30 text-sm text-gray-300 focus:outline-none">
                    {Object.entries(LIFECYCLE_LABELS).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Assign to ADM</label>
                  <select value={newAgent.assigned_adm_id} onChange={(e) => setNewAgent({ ...newAgent, assigned_adm_id: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-[#0B1120] border border-surface-border/30 text-sm text-gray-300 focus:outline-none">
                    <option value="">{'\u2014'} None (Unassigned) {'\u2014'}</option>
                    {admList.map((adm: any) => (
                      <option key={adm.id} value={adm.id}>{adm.name} ({adm.region})</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Dormancy Reason</label>
                <input value={newAgent.dormancy_reason} onChange={(e) => setNewAgent({ ...newAgent, dormancy_reason: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-[#0B1120] border border-surface-border/30 text-sm text-white focus:outline-none focus:border-brand-red/30" placeholder="e.g., Portal login issues, No commission clarity..." />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-5 border-t border-surface-border/20">
              <button onClick={() => setShowAddForm(false)} className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white transition-all">Cancel</button>
              <button onClick={handleAddAgent} disabled={running || !newAgent.name || !newAgent.phone || !newAgent.location} className="flex items-center gap-2 px-5 py-2 rounded-lg bg-brand-red hover:bg-brand-red/90 text-white text-sm font-medium disabled:opacity-40 transition-all">
                {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Add Agent
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== ACTION RESULT TOAST ==================== */}
      {actionResult && (
        <div className={`glass-card p-5 border ${
          actionResult.type === 'error' ? 'border-red-500/20' : actionResult.type === 'warning' ? 'border-amber-500/20' : 'border-emerald-500/20'
        }`}>
          <div className="flex items-start gap-3">
            {actionResult.type === 'error' ? (
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            ) : actionResult.type === 'warning' ? (
              <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            ) : (
              <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">{actionResult.title}</h3>
                <button onClick={() => setActionResult(null)} className="text-gray-500 hover:text-gray-300"><X className="w-4 h-4" /></button>
              </div>
              {actionResult.message && <p className="text-sm text-red-400 mt-1">{actionResult.message}</p>}
              {actionResult.data && (
                <div className="mt-3">
                  {actionResult.data.assigned_count !== undefined && (
                    <p className="text-sm text-gray-300"><span className="text-emerald-400 font-medium">{actionResult.data.assigned_count}</span> agents assigned successfully</p>
                  )}
                  {actionResult.data.rebalanced_count !== undefined && (
                    <p className="text-sm text-gray-300"><span className="text-blue-400 font-medium">{actionResult.data.rebalanced_count}</span> agents rebalanced</p>
                  )}
                  {actionResult.data.created !== undefined && (
                    <p className="text-sm text-gray-300"><span className="text-emerald-400 font-medium">{actionResult.data.created}</span> of {actionResult.data.total_submitted} agents imported</p>
                  )}
                  {actionResult.data.message && <p className="text-sm text-gray-300">{actionResult.data.message}</p>}
                  {actionResult.data.errors?.length > 0 && (
                    <div className="mt-2 p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                      <p className="text-xs text-red-400 font-medium mb-1">Errors ({actionResult.data.errors.length}):</p>
                      {actionResult.data.errors.slice(0, 5).map((err: any, i: number) => (
                        <p key={i} className="text-xs text-red-400/80">{typeof err === 'string' ? err : JSON.stringify(err)}</p>
                      ))}
                    </div>
                  )}
                  {actionResult.data.assignments?.length > 0 && (
                    <div className="mt-2 max-h-[150px] overflow-y-auto">
                      <p className="text-xs text-gray-500 mb-1">Assignments:</p>
                      {actionResult.data.assignments.slice(0, 10).map((a: any, i: number) => (
                        <p key={i} className="text-xs text-gray-400">
                          Agent #{a.agent_id} {a.agent_name ? `(${a.agent_name})` : ''} {'\u2192'} ADM #{a.adm_id}
                          {a.reason && <span className="text-gray-600"> {'\u2014'} {a.reason}</span>}
                        </p>
                      ))}
                    </div>
                  )}
                  {actionResult.data.moves?.length > 0 && (
                    <div className="mt-2 max-h-[150px] overflow-y-auto">
                      <p className="text-xs text-gray-500 mb-1">Moves:</p>
                      {actionResult.data.moves.slice(0, 10).map((m: any, i: number) => (
                        <p key={i} className="text-xs text-gray-400">
                          {m.agent_name || `Agent #${m.agent_id}`}: ADM #{m.from_adm_id} {'\u2192'} ADM #{m.to_adm_id}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
