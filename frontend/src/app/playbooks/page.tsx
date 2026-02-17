'use client';

import { useState, useMemo, useCallback, useRef } from 'react';
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  MessageCircle,
  Phone,
  Clock,
  AlertTriangle,
  Users,
  Target,
  Zap,
  GraduationCap,
  Shield,
  Wrench,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAPI } from '@/lib/useAPI';
import { useAuth } from '@/lib/AuthContext';
import ChartCard from '@/components/ChartCard';

/* ──── Action type icons + colors ──── */
const actionTypeConfig: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  WHATSAPP_MESSAGE: { icon: MessageCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'WhatsApp Message' },
  ADM_NUDGE: { icon: Phone, color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'ADM Call/Nudge' },
  WHATSAPP_TRAINING: { icon: GraduationCap, color: 'text-purple-400', bg: 'bg-purple-500/10', label: 'Training via WhatsApp' },
  WAIT: { icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10', label: 'Wait Period' },
  ESCALATE: { icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10', label: 'Escalation' },
  ADM_CALL: { icon: Phone, color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'ADM Phone Call' },
  ADM_VISIT: { icon: Users, color: 'text-cyan-400', bg: 'bg-cyan-500/10', label: 'Branch Visit' },
};

/* ──── Playbook category icons ──── */
const playbookIconMap: Record<string, React.ElementType> = {
  'New Agent Onboarding': Users,
  'Dormant Re-engagement': Target,
  'Dormant Agent Re-engagement': Target,
  'At-Risk Intervention': AlertTriangle,
  'At-Risk Agent Intervention': AlertTriangle,
  'Commission Concern Resolution': Zap,
  'System Issue Resolution': Wrench,
  'Training Engagement': GraduationCap,
};

const playbookColorMap: Record<string, { border: string; bg: string; text: string }> = {
  'New Agent Onboarding': { border: 'border-blue-500/20', bg: 'bg-blue-500/5', text: 'text-blue-400' },
  'Dormant Re-engagement': { border: 'border-red-500/20', bg: 'bg-red-500/5', text: 'text-red-400' },
  'Dormant Agent Re-engagement': { border: 'border-red-500/20', bg: 'bg-red-500/5', text: 'text-red-400' },
  'At-Risk Intervention': { border: 'border-amber-500/20', bg: 'bg-amber-500/5', text: 'text-amber-400' },
  'At-Risk Agent Intervention': { border: 'border-amber-500/20', bg: 'bg-amber-500/5', text: 'text-amber-400' },
  'Commission Concern Resolution': { border: 'border-emerald-500/20', bg: 'bg-emerald-500/5', text: 'text-emerald-400' },
  'System Issue Resolution': { border: 'border-purple-500/20', bg: 'bg-purple-500/5', text: 'text-purple-400' },
  'Training Engagement': { border: 'border-cyan-500/20', bg: 'bg-cyan-500/5', text: 'text-cyan-400' },
};

export default function PlaybooksPage() {
  const { user } = useAuth();
  const admId = user?.adm_id;

  const { data: playbooks, loading: loadingPlaybooks } = useAPI(() => api.getPlaybooks());
  const { data: myAgents } = useAPI(
    () => admId ? api.getADMAgents(admId) : Promise.resolve([]),
  );

  const [expandedPlaybook, setExpandedPlaybook] = useState<string | null>(null);
  const playbookRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // When a situation card is clicked, expand the playbook and scroll to it
  const handleSituationClick = useCallback((playbookName: string) => {
    setExpandedPlaybook(playbookName);
    // Use requestAnimationFrame to wait for the DOM to update after state change
    requestAnimationFrame(() => {
      const el = playbookRefs.current[playbookName];
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }, []);

  // Categorize agents for the "situation cards"
  const agentCategories = useMemo(() => {
    const agents = Array.isArray(myAgents) ? myAgents : (myAgents as any)?.agents || [];
    return {
      dormant: agents.filter((a: any) => a.lifecycle_state === 'dormant'),
      at_risk: agents.filter((a: any) => a.lifecycle_state === 'at_risk'),
      contacted: agents.filter((a: any) => a.lifecycle_state === 'contacted'),
      active: agents.filter((a: any) => a.lifecycle_state === 'active'),
    };
  }, [myAgents]);

  if (loadingPlaybooks) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-gray-500 animate-spin" />
      </div>
    );
  }

  const playbookList = Array.isArray(playbooks) ? playbooks : [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Action Plans & Playbooks</h1>
        <p className="text-sm text-gray-400 mt-1">
          Step-by-step strategies for every agent situation. Know exactly what to do, when to do it, and what to say.
        </p>
      </div>

      {/* ═══════ Agent Situation Cards ═══════ */}
      <section>
        <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">Your Current Situation</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: 'Dormant Agents',
              count: agentCategories.dormant.length,
              desc: 'Need re-engagement playbook',
              color: 'red',
              playbook: 'Dormant Re-engagement',
              icon: Target,
            },
            {
              label: 'At-Risk Agents',
              count: agentCategories.at_risk.length,
              desc: 'Need intervention now',
              color: 'amber',
              playbook: 'At-Risk Intervention',
              icon: AlertTriangle,
            },
            {
              label: 'Recently Contacted',
              count: agentCategories.contacted.length,
              desc: 'Follow training engagement',
              color: 'blue',
              playbook: 'Training Engagement',
              icon: GraduationCap,
            },
            {
              label: 'Active Agents',
              count: agentCategories.active.length,
              desc: 'Maintain & grow performance',
              color: 'emerald',
              playbook: 'New Agent Onboarding',
              icon: Users,
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                onClick={() => handleSituationClick(item.playbook)}
                className={`text-left p-5 rounded-xl bg-${item.color}-500/5 border border-${item.color}-500/15 hover:border-${item.color}-500/30 transition-all duration-300 hover:-translate-y-1 group`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 rounded-lg bg-${item.color}-500/10`}>
                    <Icon className={`w-5 h-5 text-${item.color}-400`} />
                  </div>
                  <span className={`text-3xl font-bold text-${item.color}-400`}>{item.count}</span>
                </div>
                <p className="text-sm font-medium text-white">{item.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                <div className="flex items-center gap-1 mt-2 text-xs text-gray-500 group-hover:text-white transition-colors">
                  View playbook <ChevronRight className="w-3 h-3" />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ═══════ Playbook Cards ═══════ */}
      <section>
        <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">
          All Playbooks ({playbookList.length})
        </h2>
        <div className="space-y-4">
          {playbookList.map((playbook: any) => {
            const isExpanded = expandedPlaybook === playbook.name;
            const Icon = playbookIconMap[playbook.name] || BookOpen;
            const colors = playbookColorMap[playbook.name] || { border: 'border-surface-border', bg: 'bg-surface-card/40', text: 'text-gray-400' };
            const steps = playbook.steps || [];

            return (
              <div
                key={playbook.name}
                ref={(el) => { playbookRefs.current[playbook.name] = el; }}
                className={`rounded-xl border ${colors.border} ${colors.bg} overflow-hidden transition-all duration-300 scroll-mt-4`}
              >
                {/* Playbook Header */}
                <button
                  onClick={() => setExpandedPlaybook(isExpanded ? null : playbook.name)}
                  className="w-full flex items-center gap-4 p-5 hover:bg-white/[0.02] transition-all text-left"
                >
                  <div className={`p-3 rounded-xl ${colors.bg} border ${colors.border}`}>
                    <Icon className={`w-6 h-6 ${colors.text}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-white">{playbook.name}</h3>
                    <p className="text-sm text-gray-400 mt-0.5">{playbook.description}</p>
                    <div className="flex items-center gap-4 mt-2">
                      {playbook.target_lifecycle_state && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-surface-card border border-surface-border text-gray-400">
                          Target: {playbook.target_lifecycle_state}
                        </span>
                      )}
                      {playbook.target_dormancy_category && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-surface-card border border-surface-border text-gray-400">
                          Reason: {playbook.target_dormancy_category}
                        </span>
                      )}
                      <span className="text-xs text-gray-500">
                        {steps.length} steps
                      </span>
                      {playbook.max_duration_days && (
                        <span className="text-xs text-gray-500">
                          ~{playbook.max_duration_days} days
                        </span>
                      )}
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  )}
                </button>

                {/* Expanded Steps */}
                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-surface-border/30">
                    <div className="mt-4 space-y-3">
                      {steps.map((step: any, i: number) => {
                        const actionConfig = actionTypeConfig[step.action_type] || actionTypeConfig.WHATSAPP_MESSAGE;
                        const StepIcon = actionConfig.icon;

                        // Extract message from action_config
                        const messageTemplate = step.action_config?.message_template ||
                          step.action_config?.template_name ||
                          step.action_config?.description ||
                          step.action_config?.message ||
                          '';
                        const talkingPoints = step.action_config?.talking_points || [];
                        const waitDays = step.action_config?.wait_days || step.delay_days;

                        return (
                          <div key={i} className="flex gap-4">
                            {/* Step number + connector line */}
                            <div className="flex flex-col items-center flex-shrink-0">
                              <div className={`w-8 h-8 rounded-full ${actionConfig.bg} flex items-center justify-center border ${colors.border}`}>
                                <span className="text-xs font-bold text-white">{step.step_number || i + 1}</span>
                              </div>
                              {i < steps.length - 1 && (
                                <div className="w-px flex-1 bg-surface-border/40 mt-1" />
                              )}
                            </div>

                            {/* Step Content */}
                            <div className="flex-1 pb-4">
                              <div className="flex items-center gap-2 mb-1">
                                <StepIcon className={`w-4 h-4 ${actionConfig.color}`} />
                                <span className="text-sm font-medium text-white">{step.name}</span>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full ${actionConfig.bg} ${actionConfig.color}`}>
                                  {actionConfig.label}
                                </span>
                              </div>

                              {/* Delay info */}
                              {step.delay_days > 0 && (
                                <div className="flex items-center gap-1 mb-2">
                                  <Clock className="w-3 h-3 text-gray-500" />
                                  <span className="text-xs text-gray-500">Wait {step.delay_days} day{step.delay_days > 1 ? 's' : ''} after previous step</span>
                                </div>
                              )}

                              {/* Message template */}
                              {messageTemplate && (
                                <div className="p-3 rounded-lg bg-surface-card/40 border border-surface-border/30 mt-2">
                                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Message / Action</p>
                                  <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{messageTemplate}</p>
                                </div>
                              )}

                              {/* Talking points */}
                              {talkingPoints.length > 0 && (
                                <div className="mt-2 space-y-1">
                                  <p className="text-xs text-gray-400 uppercase tracking-wider">Talking Points</p>
                                  {talkingPoints.map((point: string, j: number) => (
                                    <div key={j} className="flex items-start gap-2">
                                      <ArrowRight className="w-3 h-3 text-gray-500 mt-0.5 flex-shrink-0" />
                                      <span className="text-xs text-gray-300">{point}</span>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Next step rules */}
                              {step.next_step_rules && step.next_step_rules.length > 0 && (
                                <div className="mt-2 p-2 rounded-lg bg-white/[0.02] border border-surface-border/20">
                                  <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Branching Logic</p>
                                  {step.next_step_rules.map((rule: any, k: number) => {
                                    // condition can be { field, op, value } object or a string
                                    const cond = rule.condition;
                                    const condText = typeof cond === 'string'
                                      ? cond
                                      : cond && typeof cond === 'object'
                                        ? `${cond.field} ${cond.op} ${String(cond.value)}`
                                        : '';
                                    return (
                                      <div key={k} className="text-xs text-gray-400 mb-1">
                                        {condText && (
                                          <span className="text-amber-400">If {condText}</span>
                                        )}
                                        {rule.go_to_step && (
                                          <span> → Go to step {rule.go_to_step}</span>
                                        )}
                                        {rule.next_step && (
                                          <span> → Go to step {rule.next_step}</span>
                                        )}
                                        {rule.action && (
                                          <span className="text-emerald-400"> ({String(rule.action).replace(/_/g, ' ')}{rule.playbook ? `: ${rule.playbook}` : ''})</span>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Success Criteria */}
                    {playbook.success_criteria && (
                      <div className="mt-4 p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/15">
                        <p className="text-xs text-emerald-400 uppercase tracking-wider mb-1 font-medium">Success Criteria</p>
                        {typeof playbook.success_criteria === 'string' ? (
                          <p className="text-sm text-gray-300">{playbook.success_criteria}</p>
                        ) : typeof playbook.success_criteria === 'object' ? (
                          <ul className="space-y-1">
                            {Object.entries(playbook.success_criteria).map(([key, val]: [string, any]) => {
                              // Format values safely — handle nested objects, booleans, etc.
                              let displayVal: string;
                              if (typeof val === 'boolean') {
                                displayVal = val ? 'Yes' : 'No';
                              } else if (typeof val === 'object' && val !== null) {
                                // Nested object like { signal_type: "policy_sold" } — format as readable text
                                displayVal = Object.entries(val).map(([k, v]) => `${k.replace(/_/g, ' ')}: ${String(v)}`).join(', ');
                              } else {
                                displayVal = String(val);
                              }
                              return (
                                <li key={key} className="text-sm text-gray-300 flex items-start gap-2">
                                  <span className="text-emerald-400 mt-0.5">•</span>
                                  <span>
                                    <span className="capitalize">{key === 'or' ? 'Or' : key.replace(/_/g, ' ')}: </span>
                                    <span className="text-white font-medium">{displayVal}</span>
                                  </span>
                                </li>
                              );
                            })}
                          </ul>
                        ) : (
                          <p className="text-sm text-gray-300">{String(playbook.success_criteria)}</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {playbookList.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No playbooks available</p>
              <p className="text-xs text-gray-500 mt-1">Check that the backend playbook routes are running</p>
            </div>
          )}
        </div>
      </section>

      {/* ═══════ Strategy Guide ═══════ */}
      <ChartCard title="Agent Nurturing Strategy" subtitle="How to approach different agent situations">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/15">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-5 h-5 text-red-400" />
              <h3 className="text-sm font-semibold text-white">Dormant Agents</h3>
            </div>
            <ul className="space-y-2 text-xs text-gray-400">
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-0.5">1.</span>
                <span>Start with empathetic WhatsApp — understand WHY they went dormant</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-0.5">2.</span>
                <span>Follow up with a personal call within 3 days</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-0.5">3.</span>
                <span>Address their specific concern (commission, leads, tech, training)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-0.5">4.</span>
                <span>Offer targeted training or joint visits</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-0.5">5.</span>
                <span>Escalate if no response after 2 weeks</span>
              </li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/15">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-semibold text-white">At-Risk Agents</h3>
            </div>
            <ul className="space-y-2 text-xs text-gray-400">
              <li className="flex items-start gap-2">
                <span className="text-amber-400 mt-0.5">1.</span>
                <span>Immediate personal call — show you care before they disengage</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 mt-0.5">2.</span>
                <span>Celebrate their past wins — remind them of what they achieved</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 mt-0.5">3.</span>
                <span>Remove specific blockers (tech issues, missing leads)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 mt-0.5">4.</span>
                <span>Schedule regular check-ins (weekly for 1 month)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 mt-0.5">5.</span>
                <span>Pair with high-performing agent for mentoring</span>
              </li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-semibold text-white">Top Performers</h3>
            </div>
            <ul className="space-y-2 text-xs text-gray-400">
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 mt-0.5">1.</span>
                <span>Public recognition — feature in team communications</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 mt-0.5">2.</span>
                <span>Share success stories with other agents via WhatsApp</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 mt-0.5">3.</span>
                <span>Advanced product training for higher-commission products</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 mt-0.5">4.</span>
                <span>Ask them to mentor struggling agents</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 mt-0.5">5.</span>
                <span>Set stretch goals with incentive milestones</span>
              </li>
            </ul>
          </div>
        </div>
      </ChartCard>
    </div>
  );
}
