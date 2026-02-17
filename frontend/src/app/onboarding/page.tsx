'use client';

import { useState, useCallback } from 'react';
import {
  UserPlus,
  FileText,
  CheckCircle2,
  UserCheck,
  XCircle,
  Phone,
  MapPin,
  ChevronRight,
  Plus,
  X,
  Loader2,
  Users,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAPI } from '@/lib/useAPI';
import { useAuth } from '@/lib/AuthContext';

const STAGE_CONFIG: Record<string, { label: string; color: string; bgColor: string; borderColor: string; icon: any }> = {
  pending: { label: 'Pending', color: 'text-amber-400', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/20', icon: UserPlus },
  documents_submitted: { label: 'Documents Submitted', color: 'text-blue-400', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/20', icon: FileText },
  verified: { label: 'Verified', color: 'text-purple-400', bgColor: 'bg-purple-500/10', borderColor: 'border-purple-500/20', icon: CheckCircle2 },
  active: { label: 'Onboarded', color: 'text-emerald-400', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/20', icon: UserCheck },
};

const NEXT_STAGE: Record<string, string> = {
  pending: 'documents_submitted',
  documents_submitted: 'verified',
  verified: 'active',
};

export default function OnboardingPage() {
  const { isAdmin } = useAuth();
  const { data: pipeline, loading, refetch } = useAPI(() => api.getOnboardingPipeline(), 10000);
  const { data: adms } = useAPI(() => api.listADMs());
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', phone: '', email: '', location: '', state: '', language: 'Hindi', assigned_adm_id: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleAdvance = useCallback(async (agentId: number, currentStage: string) => {
    const next = NEXT_STAGE[currentStage];
    if (!next) return;
    try {
      await api.advanceOnboarding(agentId, next);
      refetch();
    } catch (e) {
      console.error('Failed to advance:', e);
    }
  }, [refetch]);

  const handleAddAgent = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.startOnboarding({
        ...addForm,
        assigned_adm_id: addForm.assigned_adm_id ? parseInt(addForm.assigned_adm_id) : null,
      });
      setShowAddModal(false);
      setAddForm({ name: '', phone: '', email: '', location: '', state: '', language: 'Hindi', assigned_adm_id: '' });
      refetch();
    } catch (e: any) {
      alert(e.message || 'Failed to add agent');
    } finally {
      setSubmitting(false);
    }
  }, [addForm, refetch]);

  const stages = ['pending', 'documents_submitted', 'verified', 'active'];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/20">
            <UserPlus className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Agent Onboarding</h1>
            <p className="text-sm text-gray-500">Manage new agent onboarding pipeline</p>
          </div>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-medium hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/20"
          >
            <Plus className="w-4 h-4" />
            Add New Agent
          </button>
        )}
      </div>

      {/* Pipeline stats bar */}
      <div className="grid grid-cols-4 gap-4">
        {stages.map((stage) => {
          const config = STAGE_CONFIG[stage];
          const Icon = config.icon;
          const count = pipeline?.[stage]?.count || 0;
          return (
            <div key={stage} className={`p-4 rounded-xl ${config.bgColor} border ${config.borderColor}`}>
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`w-4 h-4 ${config.color}`} />
                <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
              </div>
              <p className="text-2xl font-bold text-white">{count}</p>
            </div>
          );
        })}
      </div>

      {/* Kanban board */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-gray-500 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-4">
          {stages.map((stage) => {
            const config = STAGE_CONFIG[stage];
            const Icon = config.icon;
            const agents = pipeline?.[stage]?.agents || [];
            return (
              <div key={stage} className="space-y-3">
                {/* Column header */}
                <div className={`flex items-center gap-2 p-3 rounded-xl ${config.bgColor} border ${config.borderColor}`}>
                  <Icon className={`w-4 h-4 ${config.color}`} />
                  <span className={`text-sm font-semibold ${config.color}`}>{config.label}</span>
                  <span className={`ml-auto text-xs font-bold ${config.color} px-2 py-0.5 rounded-full bg-white/5`}>
                    {agents.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="space-y-2 min-h-[200px]">
                  {agents.map((agent: any) => (
                    <div
                      key={agent.id}
                      className="p-4 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-all duration-200 group"
                    >
                      <p className="text-sm font-semibold text-white mb-1">{agent.name}</p>
                      <div className="space-y-1 mb-3">
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <Phone className="w-3 h-3" />
                          {agent.phone}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <MapPin className="w-3 h-3" />
                          {agent.location}{agent.state ? `, ${agent.state}` : ''}
                        </div>
                        {agent.assigned_adm_name && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <Users className="w-3 h-3" />
                            ADM: {agent.assigned_adm_name}
                          </div>
                        )}
                      </div>

                      {/* Advance button */}
                      {NEXT_STAGE[stage] && isAdmin && (
                        <button
                          onClick={() => handleAdvance(agent.id, stage)}
                          className={`w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium ${config.bgColor} ${config.color} border ${config.borderColor} hover:bg-white/5 transition-all opacity-0 group-hover:opacity-100`}
                        >
                          Advance
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}

                  {agents.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-8 text-gray-600">
                      <Icon className="w-8 h-8 mb-2 opacity-30" />
                      <p className="text-xs">No agents</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Agent Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-surface-card border border-surface-border rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">Add New Agent</h2>
              <button onClick={() => setShowAddModal(false)} className="p-1 rounded-lg hover:bg-white/5 text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddAgent} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={addForm.name}
                    onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                    className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500/40"
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider">Phone *</label>
                  <input
                    type="text"
                    required
                    value={addForm.phone}
                    onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                    className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500/40"
                    placeholder="98XXX-XXXXX"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider">Email</label>
                <input
                  type="email"
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                  className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500/40"
                  placeholder="agent@email.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider">City *</label>
                  <input
                    type="text"
                    required
                    value={addForm.location}
                    onChange={(e) => setAddForm({ ...addForm, location: e.target.value })}
                    className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500/40"
                    placeholder="Mumbai"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider">State</label>
                  <input
                    type="text"
                    value={addForm.state}
                    onChange={(e) => setAddForm({ ...addForm, state: e.target.value })}
                    className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500/40"
                    placeholder="Maharashtra"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider">Language</label>
                  <select
                    value={addForm.language}
                    onChange={(e) => setAddForm({ ...addForm, language: e.target.value })}
                    className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500/40"
                  >
                    <option value="Hindi">Hindi</option>
                    <option value="English">English</option>
                    <option value="Marathi">Marathi</option>
                    <option value="Tamil">Tamil</option>
                    <option value="Telugu">Telugu</option>
                    <option value="Bengali">Bengali</option>
                    <option value="Kannada">Kannada</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider">Assign ADM</label>
                  <select
                    value={addForm.assigned_adm_id}
                    onChange={(e) => setAddForm({ ...addForm, assigned_adm_id: e.target.value })}
                    className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500/40"
                  >
                    <option value="">Select ADM...</option>
                    {(adms || []).map((adm: any) => (
                      <option key={adm.id} value={adm.id}>{adm.name} - {adm.region}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-400 text-sm hover:bg-white/5 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Add Agent
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
