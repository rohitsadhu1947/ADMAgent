'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Phone, MessageCircle, Mail, MapPin, Send, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';

interface LogInteractionModalProps {
  agent: any;
  admId: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const interactionTypes = [
  { value: 'call', label: 'Phone Call', icon: Phone },
  { value: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
  { value: 'visit', label: 'Field Visit', icon: MapPin },
  { value: 'telegram', label: 'Telegram', icon: Send },
];

const outcomeOptions = [
  { value: 'connected', label: 'Connected' },
  { value: 'not_answered', label: 'Not Answered' },
  { value: 'callback_requested', label: 'Callback Requested' },
  { value: 'follow_up_scheduled', label: 'Follow-up Scheduled' },
];

export default function LogInteractionModal({
  agent,
  admId,
  isOpen,
  onClose,
  onSuccess,
}: LogInteractionModalProps) {
  const [type, setType] = useState('call');
  const [outcome, setOutcome] = useState('connected');
  const [duration, setDuration] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showDuration = type === 'call' || type === 'visit';

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setType('call');
      setOutcome('connected');
      setDuration('');
      setNotes('');
      setFollowUpDate('');
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
    setSubmitting(true);
    setFeedback(null);

    try {
      await api.createInteraction({
        agent_id: agent.id,
        adm_id: admId,
        type,
        outcome,
        notes: notes.trim(),
        duration_minutes: showDuration && duration !== '' ? Number(duration) : null,
        follow_up_date: followUpDate || null,
      });

      setFeedback({ type: 'success', message: 'Interaction logged successfully' });
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1200);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to log interaction' });
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
            <div>
              <h3 className="text-lg font-semibold text-white">Log Interaction</h3>
              <p className="text-sm text-gray-400 mt-0.5">
                with <span className="text-white font-medium">{agent.name}</span>
              </p>
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
            {/* Type */}
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wider">
                Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-surface-card border border-surface-border rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand-red/50 focus:ring-1 focus:ring-brand-red/20 transition-all"
              >
                {interactionTypes.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Outcome */}
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wider">
                Outcome
              </label>
              <select
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
                className="w-full bg-surface-card border border-surface-border rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand-red/50 focus:ring-1 focus:ring-brand-red/20 transition-all"
              >
                {outcomeOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Duration - conditional */}
            {showDuration && (
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wider">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  min={0}
                  max={480}
                  value={duration}
                  onChange={(e) => setDuration(e.target.value ? Number(e.target.value) : '')}
                  placeholder="e.g. 15"
                  className="w-full bg-surface-card border border-surface-border rounded-lg px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-brand-red/50 focus:ring-1 focus:ring-brand-red/20 transition-all"
                />
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wider">
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Add notes about the interaction..."
                className="w-full bg-surface-card border border-surface-border rounded-lg px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-brand-red/50 focus:ring-1 focus:ring-brand-red/20 transition-all resize-none"
              />
            </div>

            {/* Follow-up Date */}
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wider">
                Follow-up Date <span className="text-gray-600">(optional)</span>
              </label>
              <input
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="w-full bg-surface-card border border-surface-border rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand-red/50 focus:ring-1 focus:ring-brand-red/20 transition-all [color-scheme:dark]"
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
                    Saving...
                  </>
                ) : (
                  'Log Interaction'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
