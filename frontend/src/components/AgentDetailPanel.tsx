'use client';

import { useState } from 'react';
import { X, Phone, Mail, MapPin, Calendar, AlertTriangle, TrendingUp, CalendarDays, ArrowUpRight } from 'lucide-react';
import StatusBadge from './StatusBadge';
import ProgressRing from './ProgressRing';
import LogInteractionModal from './LogInteractionModal';
import ScheduleFollowupModal from './ScheduleFollowupModal';
import { useAuth } from '@/lib/AuthContext';
import { api } from '@/lib/api';

interface AgentDetailPanelProps {
  agent: any | null;
  onClose: () => void;
}

const dormancyReasonLabels: Record<string, string> = {
  no_leads: 'No Quality Leads',
  low_commission: 'Low Commission',
  personal_issues: 'Personal Issues',
  product_confusion: 'Product Confusion',
  poor_support: 'Poor Support',
  market_competition: 'Market Competition',
  tech_issues: 'Technical Issues',
  lack_of_training: 'Lack of Training',
};

export default function AgentDetailPanel({ agent, onClose }: AgentDetailPanelProps) {
  const { isADM, user } = useAuth();
  const [showLogModal, setShowLogModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showTransitionMenu, setShowTransitionMenu] = useState(false);
  const [transitioning, setTransitioning] = useState(false);

  if (!agent) return null;

  const lastActive = agent.last_active || agent.last_contact_date || agent.updated_at;
  const daysInactive = lastActive
    ? Math.floor((new Date().getTime() - new Date(lastActive).getTime()) / (1000 * 60 * 60 * 24))
    : agent.dormancy_duration_days || 0;

  const riskScore = agent.risk_score ?? Math.min(100, Math.round((agent.dormancy_duration_days || 0) / 3.65));
  const initials = agent.avatar_initials || (agent.name ? agent.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2) : '??');
  const city = agent.city || agent.location || '';
  const region = agent.region || agent.state || '';
  const assignedAdm = agent.assigned_adm || agent.assigned_adm_id || '-';

  const handleTransition = async (newState: string) => {
    setTransitioning(true);
    try {
      await api.transitionAgent(agent.id, newState);
      setShowTransitionMenu(false);
      onClose();
    } catch (err) {
      console.error('Failed to transition agent:', err);
    } finally {
      setTransitioning(false);
    }
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-fade-in"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-screen w-full max-w-md bg-surface-dark border-l border-surface-border z-50 overflow-y-auto animate-slide-in-right">
        {/* Header */}
        <div className="sticky top-0 bg-surface-dark/95 backdrop-blur-xl border-b border-surface-border p-5 z-10">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-red to-brand-navy flex items-center justify-center">
                <span className="text-white font-bold text-sm">{initials}</span>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">{agent.name}</h2>
                <p className="text-sm text-gray-400">{String(agent.id)}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-6">
          {/* Status & Risk */}
          <div className="flex items-center gap-3">
            <StatusBadge status={agent.lifecycle_state} size="md" />
            {agent.dormancy_reason && (
              <span className="badge bg-red-500/10 text-red-400 border border-red-500/20">
                {dormancyReasonLabels[agent.dormancy_reason] || agent.dormancy_reason}
              </span>
            )}
          </div>

          {/* Risk Score Ring */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-medium text-gray-400 mb-4">Risk Assessment</h3>
            <div className="flex items-center gap-6">
              <ProgressRing
                progress={riskScore}
                size={90}
                strokeWidth={7}
                color={riskScore > 70 ? '#EF4444' : riskScore > 40 ? '#F59E0B' : '#10B981'}
                label="Risk"
              />
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle
                    className={`w-4 h-4 ${
                      riskScore > 70
                        ? 'text-red-400'
                        : riskScore > 40
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }`}
                  />
                  <span className="text-sm text-gray-300">
                    {riskScore > 70 ? 'High Risk' : riskScore > 40 ? 'Medium Risk' : 'Low Risk'}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  {daysInactive} days since last activity
                </p>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-medium text-gray-400 mb-3">Contact Information</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-300">{agent.phone}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-300">{agent.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-300">
                  {city}{city && region ? ', ' : ''}{region}
                </span>
              </div>
            </div>
          </div>

          {/* Performance */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-medium text-gray-400 mb-3">Performance</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface-card/60 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Engagement Score</p>
                <p className="text-xl font-bold text-white">
                  {agent.engagement_score ?? agent.policies_sold_last_quarter ?? '-'}
                </p>
              </div>
              <div className="bg-surface-card/60 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Dormancy Days</p>
                <p className="text-xl font-bold text-white">
                  {agent.dormancy_duration_days ?? agent.policies_sold_current ?? '-'}
                </p>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-medium text-gray-400 mb-3">Timeline</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-300">Last Contact</p>
                  <p className="text-xs text-gray-500">{agent.last_contact_date || agent.last_active || '-'}</p>
                </div>
              </div>
              {(agent.date_of_joining || agent.activation_date) && (
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-emerald-400" />
                  <div>
                    <p className="text-sm text-gray-300">Date of Joining</p>
                    <p className="text-xs text-gray-500">{agent.date_of_joining || agent.activation_date}</p>
                  </div>
                </div>
              )}
              {agent.last_policy_sold_date && (
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-blue-400" />
                  <div>
                    <p className="text-sm text-gray-300">Last Policy Sold</p>
                    <p className="text-xs text-gray-500">{agent.last_policy_sold_date}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ADM Assignment */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-medium text-gray-400 mb-3">Assigned ADM</h3>
            <p className="text-sm text-white font-medium">{String(assignedAdm)}</p>
          </div>

          {/* Action Buttons - Only for ADM users */}
          {isADM && (
            <div className="border-t border-surface-border/40 pt-4 mt-4 space-y-2">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Actions</p>
              <button
                onClick={() => setShowLogModal(true)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-all text-sm"
              >
                <Phone className="w-4 h-4" /> Log Interaction
              </button>
              <button
                onClick={() => setShowScheduleModal(true)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 transition-all text-sm"
              >
                <CalendarDays className="w-4 h-4" /> Schedule Follow-up
              </button>
              <button
                onClick={() => setShowTransitionMenu(!showTransitionMenu)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-all text-sm"
              >
                <ArrowUpRight className="w-4 h-4" /> Transition State
              </button>
              {showTransitionMenu && (
                <div className="ml-4 space-y-1">
                  {['contacted', 'engaged', 'trained', 'active']
                    .filter((s) => s !== agent.lifecycle_state)
                    .map((state) => (
                      <button
                        key={state}
                        onClick={() => handleTransition(state)}
                        disabled={transitioning}
                        className="w-full text-left px-3 py-2 rounded-lg bg-surface-card/40 hover:bg-surface-card text-xs text-gray-300 hover:text-white transition-all capitalize disabled:opacity-50"
                      >
                        {transitioning ? '...' : '\u2192'} {state.replace('_', ' ')}
                      </button>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {isADM && user?.adm_id && (
        <>
          <LogInteractionModal
            agent={agent}
            admId={user.adm_id}
            isOpen={showLogModal}
            onClose={() => setShowLogModal(false)}
            onSuccess={() => {
              setShowLogModal(false);
            }}
          />
          <ScheduleFollowupModal
            agent={agent}
            admId={user.adm_id}
            isOpen={showScheduleModal}
            onClose={() => setShowScheduleModal(false)}
            onSuccess={() => {
              setShowScheduleModal(false);
            }}
          />
        </>
      )}
    </>
  );
}
