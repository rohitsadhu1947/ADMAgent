'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, CalendarDays, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';

interface ScheduleFollowupModalProps {
  agent: any;
  admId: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const entryTypes = [
  { value: 'follow_up', label: 'Follow-up' },
  { value: 'first_contact', label: 'First Contact' },
  { value: 'training', label: 'Training' },
  { value: 'escalation', label: 'Escalation' },
  { value: 'review', label: 'Review' },
];

const priorityOptions = [
  { value: 'high', label: 'High', color: 'text-red-400' },
  { value: 'medium', label: 'Medium', color: 'text-amber-400' },
  { value: 'low', label: 'Low', color: 'text-emerald-400' },
];

export default function ScheduleFollowupModal({
  agent,
  admId,
  isOpen,
  onClose,
  onSuccess,
}: ScheduleFollowupModalProps) {
  const [entryType, setEntryType] = useState('follow_up');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [priority, setPriority] = useState('medium');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setEntryType('follow_up');
      setScheduledDate('');
      setScheduledTime('');
      setPriority('medium');
      setNotes('');
      setFeedback(null);
    }
  }, [isOpen]);

  // Close on Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    },
    [isOpen, onClose]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!scheduledDate) {
      setFeedback({ type: 'error', message: 'Please select a date' });
      return;
    }

    setSubmitting(true);
    setFeedback(null);

    try {
      await api.createDiaryEntry({
        adm_id: admId,
        agent_id: agent.id,
        entry_type: entryType,
        scheduled_date: scheduledDate,
        scheduled_time: scheduledTime || null,
        notes: notes.trim(),
        priority,
      });

      setFeedback({ type: 'success', message: 'Follow-up scheduled successfully' });
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1200);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to schedule follow-up' });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div
          className="bg-[#0F172A] border border-surface-border rounded-2xl p-6 max-w-md w-full mx-auto shadow-2xl animate-fade-in"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <CalendarDays className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Schedule Follow-up</h3>
                <p className="text-sm text-gray-400 mt-0.5">
                  for <span className="text-white font-medium">{agent.name}</span>
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Feedback */}
          {feedback && (
            <div
              className={`flex items-center gap-2 px-4 py-3 rounded-lg mb-4 text-sm ${
                feedback.type === 'success'
                  ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                  : 'bg-red-500/10 border border-red-500/20 text-red-400'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
              )}
              {feedback.message}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Entry Type */}
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wider">
                Entry Type
              </label>
              <select
                value={entryType}
                onChange={(e) => setEntryType(e.target.value)}
                className="w-full bg-surface-card border border-surface-border rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand-red/50 focus:ring-1 focus:ring-brand-red/20 transition-all"
              >
                {entryTypes.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Date & Time Row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wider">
                  Date <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  required
                  className="w-full bg-surface-card border border-surface-border rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand-red/50 focus:ring-1 focus:ring-brand-red/20 transition-all [color-scheme:dark]"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wider">
                  Time <span className="text-gray-600">(optional)</span>
                </label>
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full bg-surface-card border border-surface-border rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand-red/50 focus:ring-1 focus:ring-brand-red/20 transition-all [color-scheme:dark]"
                />
              </div>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wider">
                Priority
              </label>
              <div className="flex gap-2">
                {priorityOptions.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setPriority(p.value)}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                      priority === p.value
                        ? p.value === 'high'
                          ? 'bg-red-500/15 border-red-500/30 text-red-400'
                          : p.value === 'medium'
                          ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                          : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                        : 'bg-surface-card border-surface-border text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wider">
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Add notes about the follow-up..."
                className="w-full bg-surface-card border border-surface-border rounded-lg px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-brand-red/50 focus:ring-1 focus:ring-brand-red/20 transition-all resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-surface-card border border-surface-border text-gray-400 hover:text-white rounded-lg px-4 py-2.5 text-sm font-medium transition-all hover:bg-surface-card-hover"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-brand-red hover:bg-brand-red/90 text-white rounded-lg px-4 py-2.5 text-sm font-medium transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Scheduling...
                  </>
                ) : (
                  'Schedule'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
