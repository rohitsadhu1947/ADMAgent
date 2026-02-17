'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, Phone, CalendarDays, Eye, Users, UserCheck, AlertTriangle, PhoneCall, UserPlus, X, Plus } from 'lucide-react';
import { api } from '@/lib/api';
import { useAPI } from '@/lib/useAPI';
import { useAuth } from '@/lib/AuthContext';
import StatusBadge from '@/components/StatusBadge';
import AgentDetailPanel from '@/components/AgentDetailPanel';
import LogInteractionModal from '@/components/LogInteractionModal';
import ScheduleFollowupModal from '@/components/ScheduleFollowupModal';

export default function MyAgentsPage() {
  const { user, isADM } = useAuth();
  const searchParams = useSearchParams();
  const admId = user?.adm_id;

  const { data: apiAgents, loading, refetch } = useAPI(
    () => (admId ? api.getADMAgents(admId) : Promise.resolve([])),
  );
  const agents = (apiAgents as any[]) || [];

  // Read filter from URL search params
  const urlFilter = searchParams.get('filter') || 'all';

  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState<string>(urlFilter);
  const [selectedAgent, setSelectedAgent] = useState<any | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [logModalAgent, setLogModalAgent] = useState<any | null>(null);
  const [scheduleModalAgent, setScheduleModalAgent] = useState<any | null>(null);
  const [showAddAgent, setShowAddAgent] = useState(false);
  const [addAgentForm, setAddAgentForm] = useState({
    name: '', phone: '', location: '', state: '', email: '', language: 'Hindi',
    lifecycle_state: 'dormant', license_number: '', specialization: '',
  });
  const [addAgentLoading, setAddAgentLoading] = useState(false);
  const [addAgentError, setAddAgentError] = useState('');
  const [addAgentSuccess, setAddAgentSuccess] = useState('');
  const pageSize = 10;

  // Sync stateFilter with URL param when it changes
  useEffect(() => {
    const newFilter = searchParams.get('filter') || 'all';
    setStateFilter(newFilter);
    setCurrentPage(1);
  }, [searchParams]);

  const filteredAgents = useMemo(() => {
    return agents.filter((agent: any) => {
      const matchesSearch =
        (agent.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (agent.phone || '').toLowerCase().includes(search.toLowerCase()) ||
        (agent.location || '').toLowerCase().includes(search.toLowerCase()) ||
        (agent.city || '').toLowerCase().includes(search.toLowerCase());
      const matchesState = stateFilter === 'all' || agent.lifecycle_state === stateFilter;
      return matchesSearch && matchesState;
    });
  }, [agents, search, stateFilter]);

  const totalPages = Math.ceil(filteredAgents.length / pageSize);
  const paginatedAgents = filteredAgents.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const statCounts = useMemo(() => ({
    total: agents.length,
    active: agents.filter((a: any) => a.lifecycle_state === 'active').length,
    dormant: agents.filter((a: any) => a.lifecycle_state === 'dormant').length,
    at_risk: agents.filter((a: any) => a.lifecycle_state === 'at_risk').length,
    contacted: agents.filter((a: any) => a.lifecycle_state === 'contacted').length,
  }), [agents]);

  const getDormancyDays = (agent: any) => {
    if (agent.dormancy_duration_days) return agent.dormancy_duration_days;
    const lastDate = agent.last_contact_date || agent.updated_at;
    if (!lastDate) return 0;
    return Math.floor((new Date().getTime() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24));
  };

  const getRiskScore = (agent: any) => {
    return agent.risk_score ?? Math.min(100, Math.round((agent.dormancy_duration_days || 0) / 3.65));
  };

  const handleStatClick = (filterValue: string) => {
    setStateFilter(filterValue);
    setCurrentPage(1);
  };

  const handleAddAgent = async () => {
    if (!addAgentForm.name || !addAgentForm.phone || !addAgentForm.location) {
      setAddAgentError('Name, phone, and location are required.');
      return;
    }
    setAddAgentLoading(true);
    setAddAgentError('');
    setAddAgentSuccess('');
    try {
      await api.createAgent({ ...addAgentForm, assigned_adm_id: admId });
      setAddAgentSuccess(`Agent "${addAgentForm.name}" added successfully!`);
      setAddAgentForm({
        name: '', phone: '', location: '', state: '', email: '', language: 'Hindi',
        lifecycle_state: 'dormant', license_number: '', specialization: '',
      });
      refetch();
      setTimeout(() => { setShowAddAgent(false); setAddAgentSuccess(''); }, 1500);
    } catch (err: any) {
      setAddAgentError(err.message || 'Failed to add agent');
    } finally {
      setAddAgentLoading(false);
    }
  };

  if (!isADM || !admId) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">This page is available for ADM users only.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-gray-500 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">My Agents</h1>
          <p className="text-sm text-gray-400 mt-1">
            Manage and take action on your assigned agents
          </p>
        </div>
        <button
          onClick={() => { setShowAddAgent(true); setAddAgentError(''); setAddAgentSuccess(''); }}
          className="flex items-center gap-2 px-4 py-2 bg-brand-red hover:bg-brand-red/90 text-white rounded-lg text-sm font-medium transition-all"
        >
          <UserPlus className="w-4 h-4" />
          Add Agent
        </button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Total Agents', value: statCounts.total, color: 'text-white', bg: 'bg-surface-card/60', filterKey: 'all', icon: Users },
          { label: 'Active', value: statCounts.active, color: 'text-emerald-400', bg: 'bg-emerald-500/5', filterKey: 'active', icon: UserCheck },
          { label: 'Dormant', value: statCounts.dormant, color: 'text-red-400', bg: 'bg-red-500/5', filterKey: 'dormant', icon: AlertTriangle },
          { label: 'At Risk', value: statCounts.at_risk, color: 'text-amber-400', bg: 'bg-amber-500/5', filterKey: 'at_risk', icon: AlertTriangle },
          { label: 'Contacted', value: statCounts.contacted, color: 'text-blue-400', bg: 'bg-blue-500/5', filterKey: 'contacted', icon: PhoneCall },
        ].map((stat) => (
          <button
            key={stat.label}
            onClick={() => handleStatClick(stat.filterKey)}
            className={`${stat.bg} border rounded-lg p-3 text-center transition-all hover:scale-[1.02] cursor-pointer ${
              stateFilter === stat.filterKey
                ? 'border-brand-red/40 ring-1 ring-brand-red/20'
                : 'border-surface-border/40 hover:border-surface-border'
            }`}
          >
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="glass-card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search by name, phone, or location..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-2 input-dark text-sm"
            />
          </div>

          <select
            value={stateFilter}
            onChange={(e) => { setStateFilter(e.target.value); setCurrentPage(1); }}
            className="input-dark text-sm py-2 min-w-[140px]"
          >
            <option value="all">All States</option>
            <option value="dormant">Dormant</option>
            <option value="at_risk">At Risk</option>
            <option value="contacted">Contacted</option>
            <option value="engaged">Engaged</option>
            <option value="trained">Trained</option>
            <option value="active">Active</option>
          </select>

          <div className="text-xs text-gray-500">
            {filteredAgents.length} results
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-border bg-surface-card/30">
                {['Agent', 'Phone', 'Location', 'State', 'Dormancy Days', 'Risk', 'Actions'].map(
                  (header) => (
                    <th
                      key={header}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
                    >
                      {header}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {paginatedAgents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <Users className="w-10 h-10 text-gray-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No agents found matching your criteria</p>
                  </td>
                </tr>
              ) : (
                paginatedAgents.map((agent: any) => {
                  const initials = agent.name
                    ? agent.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)
                    : '??';
                  const dormancyDays = getDormancyDays(agent);
                  const riskScore = getRiskScore(agent);
                  return (
                    <tr
                      key={agent.id}
                      className="border-b border-surface-border/30 hover:bg-surface-card-hover/50 transition-colors cursor-pointer"
                      onClick={() => setSelectedAgent(agent)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-red/80 to-brand-navy flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-medium text-[10px]">
                              {initials}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{agent.name}</p>
                            <p className="text-[11px] text-gray-500">{String(agent.id)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-400">{agent.phone}</td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm text-gray-300">{agent.location || agent.city}</p>
                          <p className="text-[11px] text-gray-500">{agent.state || agent.region}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={agent.lifecycle_state} />
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-sm font-medium ${
                            dormancyDays > 120
                              ? 'text-red-400'
                              : dormancyDays > 60
                              ? 'text-amber-400'
                              : 'text-gray-300'
                          }`}
                        >
                          {dormancyDays}d
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              riskScore > 70
                                ? 'bg-red-400'
                                : riskScore > 40
                                ? 'bg-amber-400'
                                : 'bg-emerald-400'
                            }`}
                          />
                          <span className="text-xs text-gray-500">{riskScore}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            className="p-1.5 rounded-lg hover:bg-blue-500/10 text-gray-500 hover:text-blue-400 transition-all"
                            title="Log Interaction"
                            onClick={(e) => {
                              e.stopPropagation();
                              setLogModalAgent(agent);
                            }}
                          >
                            <Phone className="w-4 h-4" />
                          </button>
                          <button
                            className="p-1.5 rounded-lg hover:bg-amber-500/10 text-gray-500 hover:text-amber-400 transition-all"
                            title="Schedule Follow-up"
                            onClick={(e) => {
                              e.stopPropagation();
                              setScheduleModalAgent(agent);
                            }}
                          >
                            <CalendarDays className="w-4 h-4" />
                          </button>
                          <button
                            className="p-1.5 rounded-lg hover:bg-white/5 text-gray-500 hover:text-white transition-all"
                            title="View Details"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedAgent(agent);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-surface-border/40">
            <p className="text-xs text-gray-500">
              Showing {(currentPage - 1) * pageSize + 1} to{' '}
              {Math.min(currentPage * pageSize, filteredAgents.length)} of{' '}
              {filteredAgents.length}
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-xs rounded-md bg-surface-card border border-surface-border text-gray-400 hover:text-white hover:bg-surface-card-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(
                  (p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1
                )
                .map((page, i, arr) => (
                  <span key={page} className="flex items-center">
                    {i > 0 && arr[i - 1] !== page - 1 && (
                      <span className="px-1 text-xs text-gray-600">...</span>
                    )}
                    <button
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 text-xs rounded-md border transition-all ${
                        currentPage === page
                          ? 'bg-brand-red/20 border-brand-red/40 text-brand-red'
                          : 'bg-surface-card border-surface-border text-gray-400 hover:text-white hover:bg-surface-card-hover'
                      }`}
                    >
                      {page}
                    </button>
                  </span>
                ))}
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-xs rounded-md bg-surface-card border border-surface-border text-gray-400 hover:text-white hover:bg-surface-card-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Agent Detail Panel */}
      {selectedAgent && (
        <AgentDetailPanel
          agent={selectedAgent}
          onClose={() => setSelectedAgent(null)}
        />
      )}

      {/* Log Interaction Modal */}
      {logModalAgent && (
        <LogInteractionModal
          agent={logModalAgent}
          admId={admId}
          isOpen={!!logModalAgent}
          onClose={() => setLogModalAgent(null)}
          onSuccess={() => {
            setLogModalAgent(null);
            refetch();
          }}
        />
      )}

      {/* Schedule Follow-up Modal */}
      {scheduleModalAgent && (
        <ScheduleFollowupModal
          agent={scheduleModalAgent}
          admId={admId}
          isOpen={!!scheduleModalAgent}
          onClose={() => setScheduleModalAgent(null)}
          onSuccess={() => {
            setScheduleModalAgent(null);
            refetch();
          }}
        />
      )}

      {/* Add Agent Modal */}
      {showAddAgent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-surface-card border border-surface-border rounded-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-surface-border">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-brand-red" />
                Add New Agent
              </h2>
              <button onClick={() => setShowAddAgent(false)} className="p-1 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {addAgentError && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{addAgentError}</div>
              )}
              {addAgentSuccess && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">{addAgentSuccess}</div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs text-gray-400 mb-1">Name *</label>
                  <input
                    type="text" placeholder="Full name"
                    value={addAgentForm.name}
                    onChange={(e) => setAddAgentForm({ ...addAgentForm, name: e.target.value })}
                    className="w-full input-dark text-sm py-2"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Phone *</label>
                  <input
                    type="text" placeholder="10-digit phone"
                    value={addAgentForm.phone}
                    onChange={(e) => setAddAgentForm({ ...addAgentForm, phone: e.target.value })}
                    className="w-full input-dark text-sm py-2"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Email</label>
                  <input
                    type="email" placeholder="Email address"
                    value={addAgentForm.email}
                    onChange={(e) => setAddAgentForm({ ...addAgentForm, email: e.target.value })}
                    className="w-full input-dark text-sm py-2"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Location (City) *</label>
                  <input
                    type="text" placeholder="City"
                    value={addAgentForm.location}
                    onChange={(e) => setAddAgentForm({ ...addAgentForm, location: e.target.value })}
                    className="w-full input-dark text-sm py-2"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">State</label>
                  <input
                    type="text" placeholder="State"
                    value={addAgentForm.state}
                    onChange={(e) => setAddAgentForm({ ...addAgentForm, state: e.target.value })}
                    className="w-full input-dark text-sm py-2"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Language</label>
                  <select
                    value={addAgentForm.language}
                    onChange={(e) => setAddAgentForm({ ...addAgentForm, language: e.target.value })}
                    className="w-full input-dark text-sm py-2"
                  >
                    <option value="Hindi">Hindi</option>
                    <option value="English">English</option>
                    <option value="Tamil">Tamil</option>
                    <option value="Telugu">Telugu</option>
                    <option value="Marathi">Marathi</option>
                    <option value="Bengali">Bengali</option>
                    <option value="Gujarati">Gujarati</option>
                    <option value="Kannada">Kannada</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">License Number</label>
                  <input
                    type="text" placeholder="License #"
                    value={addAgentForm.license_number}
                    onChange={(e) => setAddAgentForm({ ...addAgentForm, license_number: e.target.value })}
                    className="w-full input-dark text-sm py-2"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Specialization</label>
                  <input
                    type="text" placeholder="e.g. Life Insurance"
                    value={addAgentForm.specialization}
                    onChange={(e) => setAddAgentForm({ ...addAgentForm, specialization: e.target.value })}
                    className="w-full input-dark text-sm py-2"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Initial State</label>
                  <select
                    value={addAgentForm.lifecycle_state}
                    onChange={(e) => setAddAgentForm({ ...addAgentForm, lifecycle_state: e.target.value })}
                    className="w-full input-dark text-sm py-2"
                  >
                    <option value="dormant">Dormant</option>
                    <option value="at_risk">At Risk</option>
                    <option value="contacted">Contacted</option>
                    <option value="engaged">Engaged</option>
                    <option value="trained">Trained</option>
                    <option value="active">Active</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowAddAgent(false)}
                  className="px-4 py-2 text-sm text-gray-400 hover:text-white border border-surface-border rounded-lg hover:bg-white/5 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddAgent}
                  disabled={addAgentLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-brand-red hover:bg-brand-red/90 text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50"
                >
                  {addAgentLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  {addAgentLoading ? 'Adding...' : 'Add Agent'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
