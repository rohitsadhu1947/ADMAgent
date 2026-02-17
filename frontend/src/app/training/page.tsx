'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  GraduationCap,
  BookOpen,
  Award,
  Trophy,
  Loader2,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Target,
  Star,
  Package,
  Layers,
  Medal,
  Play,
  RotateCcw,
  Send,
  Lightbulb,
  FileText,
  ArrowRight,
  Share2,
  Copy,
  Clock,
  Brain,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAPI } from '@/lib/useAPI';
import { useAuth } from '@/lib/AuthContext';

type TabKey = 'modules' | 'study' | 'quiz' | 'leaderboard' | 'products';

const TABS: { key: TabKey; label: string; icon: any }[] = [
  { key: 'modules', label: 'Modules', icon: BookOpen },
  { key: 'study', label: 'Study Material', icon: FileText },
  { key: 'quiz', label: 'Take Quiz', icon: Target },
  { key: 'leaderboard', label: 'Leaderboard', icon: Trophy },
  { key: 'products', label: 'Product Knowledge', icon: Package },
];

const CATEGORY_COLORS: Record<string, { color: string; bg: string; border: string }> = {
  term: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
  ulip: { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  savings: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  child: { color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
  pension: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  health: { color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/20' },
  group: { color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
  general: { color: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-500/20' },
  sales: { color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
  compliance: { color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
  product: { color: 'text-teal-400', bg: 'bg-teal-500/10', border: 'border-teal-500/20' },
};

function getCategoryStyle(category: string) {
  const key = category?.toLowerCase().replace(/\s+/g, '_');
  return CATEGORY_COLORS[key] || CATEGORY_COLORS.general;
}

export default function TrainingPage() {
  const { user } = useAuth();
  const admId = user?.adm_id;

  const [activeTab, setActiveTab] = useState<TabKey>('modules');
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Quiz state
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizResult, setQuizResult] = useState<any>(null);
  const [submittingQuiz, setSubmittingQuiz] = useState(false);

  // Product tab state
  const [expandedProduct, setExpandedProduct] = useState<number | null>(null);

  // Fetch training modules
  const { data: modules, loading: loadingModules } = useAPI(() => api.getTrainingModules());

  // Fetch training progress for current ADM
  const { data: progressData, loading: loadingProgress } = useAPI(
    () => admId ? api.getTrainingProgress(admId) : Promise.resolve([]),
  );

  // Fetch specific module details when selected (re-fetch when selectedModule changes)
  const { data: moduleDetail, loading: loadingDetail } = useAPI(
    () => selectedModule ? api.getTrainingModule(selectedModule) : Promise.resolve(null),
    undefined,
    [selectedModule],
  );

  // Fetch leaderboard
  const { data: leaderboard, loading: loadingLeaderboard } = useAPI(() => api.getTrainingLeaderboard());

  // Fetch products
  const { data: products, loading: loadingProducts } = useAPI(() => api.listProducts());
  const { data: productCategories, loading: loadingCategories } = useAPI(() => api.getProductCategories());

  // Get progress for a module
  // Backend returns { modules: [...] } or possibly a flat array
  const getModuleProgress = useCallback((moduleName: string) => {
    if (!progressData) return null;
    const items = Array.isArray(progressData)
      ? progressData
      : (progressData as any)?.modules || [];
    return items.find((p: any) =>
      p.module_name === moduleName || p.module === moduleName
    );
  }, [progressData]);

  // Normalize module fields (backend uses module_name/module_category/questions_count)
  const normalizedModules = useMemo(() => {
    if (!modules || !Array.isArray(modules)) return [];
    return modules.map((mod: any) => ({
      ...mod,
      name: mod.module_name || mod.name,
      category: mod.module_category || mod.category || 'General',
      question_count: mod.questions_count || mod.question_count || mod.questions?.length || 0,
    }));
  }, [modules]);

  // Group modules by category
  const groupedModules = useMemo(() => {
    if (!normalizedModules.length) return {};
    const groups: Record<string, any[]> = {};
    normalizedModules.forEach((mod: any) => {
      const cat = mod.category || 'General';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(mod);
    });
    return groups;
  }, [normalizedModules]);

  // Group products by category
  const groupedProducts = useMemo(() => {
    if (!products || !Array.isArray(products)) return {};
    const groups: Record<string, any[]> = {};
    products.forEach((product: any) => {
      const cat = product.category || 'General';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(product);
    });
    return groups;
  }, [products]);

  // Parse features safely
  const parseFeatures = (features: any): string[] => {
    if (Array.isArray(features)) return features;
    if (typeof features === 'string') {
      try { return JSON.parse(features); } catch { return features ? [features] : []; }
    }
    return [];
  };

  // Normalize module detail fields (must be before handleSubmitQuiz)
  const normalizedDetail = useMemo(() => {
    if (!moduleDetail) return null;
    // Normalize questions: backend returns { q1: {...}, q2: {...} } dict, frontend needs array
    let rawQuestions = moduleDetail.questions || [];
    if (rawQuestions && !Array.isArray(rawQuestions) && typeof rawQuestions === 'object') {
      // Convert dict keys (q1, q2, ...) to sorted array
      rawQuestions = Object.keys(rawQuestions)
        .sort((a, b) => {
          const numA = parseInt(a.replace(/\D/g, '')) || 0;
          const numB = parseInt(b.replace(/\D/g, '')) || 0;
          return numA - numB;
        })
        .map((key) => rawQuestions[key]);
    }
    return {
      ...moduleDetail,
      name: moduleDetail.module_name || moduleDetail.name,
      category: moduleDetail.module_category || moduleDetail.category,
      questions: rawQuestions,
    };
  }, [moduleDetail]);

  const questions = normalizedDetail?.questions || [];
  const totalQuestions = questions.length;

  // Clipboard copy state
  const [copied, setCopied] = useState(false);

  // Handle module selection — go to study view first, not quiz
  const handleSelectModule = (moduleName: string) => {
    setSelectedModule(moduleName);
    setCurrentQuestion(0);
    setAnswers({});
    setQuizSubmitted(false);
    setQuizResult(null);
    setActiveTab('study');
  };

  // Start quiz from study view
  const handleStartQuiz = () => {
    setActiveTab('quiz');
  };

  // Extract learning topics from questions for study material
  const learningTopics = useMemo(() => {
    if (!normalizedDetail?.questions?.length) return [];
    return normalizedDetail.questions.map((q: any, idx: number) => ({
      number: idx + 1,
      topic: q.question,
    }));
  }, [normalizedDetail]);

  // Generate share text for Telegram — includes learning material
  const getShareText = useCallback(() => {
    if (!normalizedDetail) return '';
    const lm = normalizedDetail.learning_material;
    const lines = [
      `📚 *Training Module: ${normalizedDetail.name}*`,
      `📂 Category: ${(normalizedDetail.category || 'General').replace(/_/g, ' ')}`,
      '',
      normalizedDetail.description || '',
    ];

    if (lm?.sections) {
      lm.sections.forEach((section: any) => {
        lines.push('');
        lines.push(`▸ *${section.title}*`);
        if (section.content) lines.push(section.content);
        if (section.key_points) {
          section.key_points.forEach((kp: any) => {
            lines.push(`  • ${kp.label}: ${kp.value}`);
          });
        }
        if (section.bullets) {
          section.bullets.forEach((b: string) => {
            lines.push(`  • ${b}`);
          });
        }
      });
    }

    if (lm?.do_and_dont) {
      lines.push('');
      lines.push('✅ *Best Practices:*');
      (lm.do_and_dont.do || []).forEach((d: string) => lines.push(`  ✓ ${d}`));
      lines.push('');
      lines.push('❌ *Avoid:*');
      (lm.do_and_dont.dont || []).forEach((d: string) => lines.push(`  ✗ ${d}`));
    }

    lines.push('');
    lines.push(`🎯 Quiz: ${normalizedDetail.questions?.length || 0} questions | Pass mark: 70%`);
    if (lm?.target_audience) {
      lines.push(`👥 Target: ${lm.target_audience}`);
    }
    lines.push('');
    lines.push('💡 Complete this module in the ADM Training Center!');
    return lines.join('\n');
  }, [normalizedDetail]);

  // Copy to clipboard
  const handleCopyForTelegram = useCallback(async () => {
    const text = getShareText();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setFeedback({ type: 'success', message: 'Training material copied! Paste in Telegram to share with agents.' });
      setTimeout(() => { setCopied(false); setFeedback(null); }, 3000);
    } catch {
      setFeedback({ type: 'error', message: 'Failed to copy. Please try again.' });
      setTimeout(() => setFeedback(null), 3000);
    }
  }, [getShareText]);

  // Open Telegram share (deep link)
  const handleShareTelegram = useCallback(() => {
    const text = getShareText();
    const encoded = encodeURIComponent(text);
    window.open(`https://t.me/share/url?url=&text=${encoded}`, '_blank');
  }, [getShareText]);

  // Handle quiz answer selection
  const handleAnswerSelect = (questionIndex: number, optionIndex: number) => {
    if (quizSubmitted) return;
    setAnswers((prev) => ({ ...prev, [questionIndex]: optionIndex }));
  };

  // Handle quiz submission
  const handleSubmitQuiz = useCallback(async () => {
    if (!admId || !selectedModule || !normalizedDetail) return;
    const qs = normalizedDetail.questions || [];
    if (Object.keys(answers).length < qs.length) {
      setFeedback({ type: 'error', message: 'Please answer all questions before submitting' });
      setTimeout(() => setFeedback(null), 3000);
      return;
    }

    setSubmittingQuiz(true);
    try {
      // Backend expects answers as { "q1": "selected option text", "q2": "option text", ... }
      const formattedAnswers: Record<string, string> = {};
      Object.entries(answers).forEach(([qIdx, optIdx]) => {
        const qKey = `q${parseInt(qIdx) + 1}`; // Convert 0-indexed to q1, q2, ...
        const question = qs[parseInt(qIdx)];
        if (question && question.options && question.options[optIdx as number]) {
          formattedAnswers[qKey] = question.options[optIdx as number];
        }
      });

      const result = await api.submitQuiz({
        module_name: selectedModule,
        module_category: normalizedDetail.category || '',
        adm_id: admId,
        answers: formattedAnswers,
      });

      setQuizResult(result);
      setQuizSubmitted(true);
      setFeedback({
        type: result.score >= 70 ? 'success' : 'error',
        message: result.score >= 70
          ? `Passed with ${result.score}%!`
          : `Score: ${result.score}%. You need 70% to pass.`,
      });
    } catch (e: any) {
      setFeedback({ type: 'error', message: e.message || 'Failed to submit quiz' });
    } finally {
      setSubmittingQuiz(false);
      setTimeout(() => setFeedback(null), 5000);
    }
  }, [admId, selectedModule, normalizedDetail, answers]);

  // Reset quiz
  const handleResetQuiz = () => {
    setCurrentQuestion(0);
    setAnswers({});
    setQuizSubmitted(false);
    setQuizResult(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Feedback Toast */}
      {feedback && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium shadow-lg transition-all ${
          feedback.type === 'success'
            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            : 'bg-red-500/10 text-red-400 border border-red-500/20'
        }`}>
          {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {feedback.message}
        </div>
      )}

      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/20">
          <GraduationCap className="w-6 h-6 text-purple-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Training Center</h1>
          <p className="text-sm text-gray-500">Upskill with modules, quizzes, and product knowledge</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 flex-wrap">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all border ${
                isActive
                  ? 'bg-brand-red/10 border-brand-red/20 text-brand-red-light'
                  : 'bg-surface-card border-surface-border text-gray-400 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'modules' && (
        <div className="space-y-8">
          {loadingModules ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-gray-500 animate-spin" />
            </div>
          ) : Object.keys(groupedModules).length === 0 ? (
            <div className="text-center py-16 bg-surface-card/40 border border-surface-border/30 rounded-xl">
              <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-600" />
              <p className="text-gray-400">No training modules available</p>
            </div>
          ) : (
            Object.entries(groupedModules).map(([category, mods]) => {
              const catStyle = getCategoryStyle(category);
              return (
                <div key={category}>
                  <div className="flex items-center gap-2 mb-4">
                    <Layers className={`w-4 h-4 ${catStyle.color}`} />
                    <h3 className="text-lg font-semibold text-white">{category}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${catStyle.bg} ${catStyle.color} border ${catStyle.border}`}>
                      {mods.length} {mods.length === 1 ? 'module' : 'modules'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {mods.map((mod: any) => {
                      const progress = getModuleProgress(mod.name);
                      const hasAttempted = !!progress;
                      const isCompleted = progress?.completed || progress?.status === 'completed';
                      const score = progress?.score || progress?.quiz_score;

                      let statusLabel = 'Not Started';
                      let statusClass = 'bg-gray-500/10 text-gray-400 border-gray-500/20';
                      if (isCompleted && score !== undefined) {
                        statusLabel = `Completed (${score}%)`;
                        statusClass = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
                      } else if (hasAttempted) {
                        statusLabel = 'In Progress';
                        statusClass = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
                      }

                      return (
                        <div
                          key={mod.name || mod.id}
                          className="group p-5 rounded-xl bg-surface-card/40 border border-surface-border/30 hover:border-surface-border/50 transition-all cursor-pointer"
                          onClick={() => handleSelectModule(mod.name)}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className={`p-2 rounded-lg ${catStyle.bg} border ${catStyle.border}`}>
                              <GraduationCap className={`w-5 h-5 ${catStyle.color}`} />
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${statusClass}`}>
                              {statusLabel}
                            </span>
                          </div>

                          <h4 className="text-sm font-semibold text-white mb-1 group-hover:text-brand-red-light transition-colors">
                            {mod.name || mod.title}
                          </h4>
                          <p className="text-xs text-gray-500 mb-3 line-clamp-2">
                            {mod.description || `${mod.category} training module`}
                          </p>

                          <div className="flex items-center justify-between pt-3 border-t border-surface-border/30">
                            <div className="flex items-center gap-1">
                              <BookOpen className="w-3 h-3 text-gray-500" />
                              <span className="text-xs text-gray-400">
                                {mod.question_count || mod.questions?.length || '?'} questions
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-brand-red-light text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                              <BookOpen className="w-3 h-3" />
                              Study Module
                            </div>
                          </div>

                          {/* Progress bar */}
                          {hasAttempted && (
                            <div className="mt-3">
                              <div className="w-full h-1.5 bg-surface-card rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all"
                                  style={{
                                    width: `${isCompleted ? 100 : 50}%`,
                                    background: isCompleted ? '#10B981' : '#F59E0B',
                                  }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Study Material Tab */}
      {activeTab === 'study' && (
        <div className="space-y-6">
          {!selectedModule ? (
            <div className="text-center py-20 bg-surface-card/40 border border-surface-border/30 rounded-xl">
              <FileText className="w-16 h-16 mx-auto mb-4 text-gray-600" />
              <p className="text-gray-400 text-lg font-medium">Select a module to study</p>
              <p className="text-gray-600 text-sm mt-1">Go to the Modules tab to pick a training module</p>
              <button
                onClick={() => setActiveTab('modules')}
                className="mt-4 px-4 py-2.5 rounded-lg bg-brand-red hover:bg-brand-red/90 text-white text-sm font-medium transition-colors"
              >
                Browse Modules
              </button>
            </div>
          ) : loadingDetail ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-gray-500 animate-spin" />
            </div>
          ) : !normalizedDetail ? (
            <div className="text-center py-20 bg-surface-card/40 border border-surface-border/30 rounded-xl">
              <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-600" />
              <p className="text-gray-400">Module not found</p>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Module Header */}
              <div className="p-6 rounded-xl bg-surface-card/40 border border-surface-border/30">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${getCategoryStyle(normalizedDetail.category).bg} border ${getCategoryStyle(normalizedDetail.category).border}`}>
                      <GraduationCap className={`w-7 h-7 ${getCategoryStyle(normalizedDetail.category).color}`} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">{normalizedDetail.name}</h2>
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${getCategoryStyle(normalizedDetail.category).bg} ${getCategoryStyle(normalizedDetail.category).color} ${getCategoryStyle(normalizedDetail.category).border}`}>
                          {(normalizedDetail.category || '').replace(/_/g, ' ')}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <BookOpen className="w-3 h-3" />
                          {normalizedDetail.questions?.length || 0} quiz questions
                        </span>
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          {normalizedDetail.learning_material?.estimated_reading_time || `~${Math.max(5, (normalizedDetail.questions?.length || 3) * 2)} min`}
                        </span>
                        {normalizedDetail.learning_material?.target_audience && (
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <Target className="w-3 h-3" />
                            {normalizedDetail.learning_material.target_audience}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {(() => {
                    const progress = getModuleProgress(normalizedDetail.name);
                    if (!progress) return null;
                    const isCompleted = progress.completed || progress.status === 'completed';
                    const score = progress.score || progress.quiz_score;
                    return (
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border flex-shrink-0 ${
                        isCompleted
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}>
                        {isCompleted ? `Passed (${score}%)` : `Attempted (${score}%)`}
                      </span>
                    );
                  })()}
                </div>
                <p className="text-sm text-gray-300 leading-relaxed">{normalizedDetail.description}</p>
              </div>

              {/* Learning Material Sections */}
              {normalizedDetail.learning_material?.sections?.map((section: any, sIdx: number) => (
                <div key={sIdx} className="p-6 rounded-xl bg-surface-card/40 border border-surface-border/30">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-7 h-7 rounded-lg bg-brand-red/10 border border-brand-red/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-brand-red-light">{sIdx + 1}</span>
                    </div>
                    <h3 className="text-base font-semibold text-white">{section.title}</h3>
                  </div>

                  {/* Text content */}
                  {section.content && (
                    <p className="text-sm text-gray-300 leading-relaxed mb-4">{section.content}</p>
                  )}

                  {/* Key points table */}
                  {section.key_points && Array.isArray(section.key_points) && (
                    <div className="rounded-lg border border-surface-border/20 overflow-hidden mb-4">
                      {section.key_points.map((kp: any, kIdx: number) => (
                        <div key={kIdx} className={`flex items-start gap-4 px-4 py-3 ${kIdx % 2 === 0 ? 'bg-[#0B1120]' : 'bg-[#0F172A]'}`}>
                          <span className="text-xs font-semibold text-brand-red-light whitespace-nowrap min-w-[140px] pt-0.5">
                            {kp.label}
                          </span>
                          <span className="text-sm text-gray-300">{kp.value}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Bullet points */}
                  {section.bullets && Array.isArray(section.bullets) && (
                    <div className="space-y-2.5">
                      {section.bullets.map((bullet: string, bIdx: number) => (
                        <div key={bIdx} className="flex items-start gap-3">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 flex-shrink-0" />
                          <p className="text-sm text-gray-300 leading-relaxed">{bullet}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Do's and Don'ts */}
              {normalizedDetail.learning_material?.do_and_dont && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Do's */}
                  <div className="p-5 rounded-xl bg-emerald-500/[0.03] border border-emerald-500/15">
                    <div className="flex items-center gap-2 mb-4">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <h4 className="text-sm font-semibold text-emerald-400">Best Practices</h4>
                    </div>
                    <div className="space-y-2.5">
                      {(normalizedDetail.learning_material.do_and_dont.do || []).map((item: string, i: number) => (
                        <div key={i} className="flex items-start gap-2.5">
                          <div className="w-4 h-4 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                          </div>
                          <p className="text-xs text-gray-300 leading-relaxed">{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Don'ts */}
                  <div className="p-5 rounded-xl bg-red-500/[0.03] border border-red-500/15">
                    <div className="flex items-center gap-2 mb-4">
                      <XCircle className="w-5 h-5 text-red-400" />
                      <h4 className="text-sm font-semibold text-red-400">Common Mistakes</h4>
                    </div>
                    <div className="space-y-2.5">
                      {(normalizedDetail.learning_material.do_and_dont.dont || []).map((item: string, i: number) => (
                        <div key={i} className="flex items-start gap-2.5">
                          <div className="w-4 h-4 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <XCircle className="w-2.5 h-2.5 text-red-400" />
                          </div>
                          <p className="text-xs text-gray-300 leading-relaxed">{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Quiz Info Bar + Actions */}
              <div className="p-5 rounded-xl bg-surface-card/40 border border-surface-border/30">
                <div className="flex items-center gap-2 mb-4">
                  <Brain className="w-5 h-5 text-purple-400" />
                  <h4 className="text-sm font-semibold text-white">Ready for the Quiz?</h4>
                </div>
                <div className="flex items-center gap-6 mb-5 flex-wrap text-xs text-gray-400">
                  <span className="flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5 text-purple-400" />{normalizedDetail.questions?.length || 0} Multiple Choice Questions</span>
                  <span className="flex items-center gap-1.5"><Target className="w-3.5 h-3.5 text-emerald-400" />70% Pass Mark</span>
                  <span className="flex items-center gap-1.5"><RotateCcw className="w-3.5 h-3.5 text-blue-400" />Unlimited Retakes</span>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <button
                    onClick={handleStartQuiz}
                    className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-brand-red hover:bg-brand-red/90 text-white font-medium transition-all shadow-lg shadow-brand-red/20"
                  >
                    <Play className="w-5 h-5" />
                    Start Quiz
                  </button>
                  <button
                    onClick={handleCopyForTelegram}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-surface-card border border-surface-border text-gray-300 hover:text-white hover:border-surface-border/60 text-sm font-medium transition-all"
                  >
                    {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copied!' : 'Copy for Telegram'}
                  </button>
                  <button
                    onClick={handleShareTelegram}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#0088cc]/10 border border-[#0088cc]/20 text-[#0088cc] hover:bg-[#0088cc]/20 text-sm font-medium transition-all"
                  >
                    <Send className="w-4 h-4" />
                    Share via Telegram
                  </button>
                  <button
                    onClick={() => setActiveTab('modules')}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-surface-card border border-surface-border text-gray-400 hover:text-white text-sm font-medium transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Back
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'quiz' && (
        <div className="space-y-6">
          {!selectedModule ? (
            <div className="text-center py-20 bg-surface-card/40 border border-surface-border/30 rounded-xl">
              <Target className="w-16 h-16 mx-auto mb-4 text-gray-600" />
              <p className="text-gray-400 text-lg font-medium">Select a module to begin</p>
              <p className="text-gray-600 text-sm mt-1">Go to the Modules tab to pick a training module</p>
              <button
                onClick={() => setActiveTab('modules')}
                className="mt-4 px-4 py-2.5 rounded-lg bg-brand-red hover:bg-brand-red/90 text-white text-sm font-medium transition-colors"
              >
                Browse Modules
              </button>
            </div>
          ) : loadingDetail ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-gray-500 animate-spin" />
            </div>
          ) : !normalizedDetail || totalQuestions === 0 ? (
            <div className="text-center py-20 bg-surface-card/40 border border-surface-border/30 rounded-xl">
              <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-600" />
              <p className="text-gray-400">No questions found for this module</p>
            </div>
          ) : quizSubmitted && quizResult ? (
            /* Quiz Results */
            <div className="max-w-2xl mx-auto space-y-6">
              <div className={`p-8 rounded-xl border text-center ${
                quizResult.score >= 70
                  ? 'bg-emerald-500/5 border-emerald-500/20'
                  : 'bg-red-500/5 border-red-500/20'
              }`}>
                <div className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center ${
                  quizResult.score >= 70 ? 'bg-emerald-500/10' : 'bg-red-500/10'
                }`}>
                  {quizResult.score >= 70 ? (
                    <Trophy className="w-10 h-10 text-emerald-400" />
                  ) : (
                    <XCircle className="w-10 h-10 text-red-400" />
                  )}
                </div>
                <h3 className={`text-3xl font-bold mb-2 ${
                  quizResult.score >= 70 ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {quizResult.score}%
                </h3>
                <p className={`text-lg font-medium mb-1 ${
                  quizResult.score >= 70 ? 'text-emerald-300' : 'text-red-300'
                }`}>
                  {quizResult.score >= 70 ? 'Congratulations! You Passed!' : 'Keep Trying!'}
                </p>
                <p className="text-sm text-gray-400">
                  {quizResult.score >= 70
                    ? `You scored ${quizResult.score}% on ${normalizedDetail?.name}`
                    : `You need at least 70% to pass. You scored ${quizResult.score}%`}
                </p>

                <div className="flex items-center justify-center gap-3 mt-6">
                  <button
                    onClick={handleResetQuiz}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-surface-card border border-surface-border text-gray-400 hover:text-white text-sm font-medium transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Retry Quiz
                  </button>
                  <button
                    onClick={() => { setSelectedModule(null); setActiveTab('modules'); }}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand-red hover:bg-brand-red/90 text-white text-sm font-medium transition-colors"
                  >
                    <BookOpen className="w-4 h-4" />
                    Back to Modules
                  </button>
                </div>
              </div>

              {/* Per-question breakdown */}
              {quizResult.results && typeof quizResult.results === 'object' && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-white">
                    Question Breakdown ({quizResult.correct_answers || 0}/{quizResult.total_questions || totalQuestions} correct)
                  </h4>
                  {Object.entries(quizResult.results)
                    .sort(([a], [b]) => {
                      const numA = parseInt(a.replace(/\D/g, '')) || 0;
                      const numB = parseInt(b.replace(/\D/g, '')) || 0;
                      return numA - numB;
                    })
                    .map(([qKey, result]: [string, any], idx: number) => (
                    <div key={qKey} className={`p-4 rounded-xl border ${
                      result.is_correct
                        ? 'bg-emerald-500/5 border-emerald-500/20'
                        : 'bg-red-500/5 border-red-500/20'
                    }`}>
                      <div className="flex items-start gap-3">
                        {result.is_correct ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                        )}
                        <div>
                          <p className="text-sm text-white font-medium">
                            Q{idx + 1}: {questions[idx]?.question || `Question ${qKey}`}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            Your answer: {result.selected || 'N/A'}
                          </p>
                          {!result.is_correct && result.correct && (
                            <p className="text-xs text-emerald-400 mt-0.5">
                              Correct: {result.correct}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Quiz Questions */
            <div className="max-w-2xl mx-auto space-y-6">
              {/* Module header */}
              <div className="p-4 rounded-xl bg-surface-card/40 border border-surface-border/30">
                <h3 className="text-lg font-semibold text-white">{normalizedDetail?.name}</h3>
                {normalizedDetail?.description && (
                  <p className="text-sm text-gray-400 mt-1">{normalizedDetail?.description}</p>
                )}
                <div className="flex items-center gap-3 mt-3">
                  {normalizedDetail?.category && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${getCategoryStyle(normalizedDetail?.category).bg} ${getCategoryStyle(normalizedDetail?.category).color} ${getCategoryStyle(normalizedDetail?.category).border}`}>
                      {normalizedDetail?.category}
                    </span>
                  )}
                  <span className="text-xs text-gray-500">{totalQuestions} questions</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">
                    Question {currentQuestion + 1} of {totalQuestions}
                  </span>
                  <span className="text-xs text-gray-400">
                    {Object.keys(answers).length} answered
                  </span>
                </div>
                <div className="w-full h-1.5 bg-surface-card rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-red rounded-full transition-all duration-300"
                    style={{ width: `${((currentQuestion + 1) / totalQuestions) * 100}%` }}
                  />
                </div>
              </div>

              {/* Question */}
              <div className="p-6 rounded-xl bg-surface-card/40 border border-surface-border/30">
                <p className="text-white font-medium mb-4">
                  {questions[currentQuestion]?.question}
                </p>

                <div className="space-y-2">
                  {questions[currentQuestion]?.options?.map((option: string, optIdx: number) => {
                    const isSelected = answers[currentQuestion] === optIdx;
                    return (
                      <button
                        key={optIdx}
                        onClick={() => handleAnswerSelect(currentQuestion, optIdx)}
                        className={`w-full text-left p-3.5 rounded-lg border transition-all text-sm ${
                          isSelected
                            ? 'bg-brand-red/10 border-brand-red/30 text-white'
                            : 'bg-surface-card/60 border-surface-border/30 text-gray-300 hover:border-surface-border/50 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                            isSelected ? 'border-brand-red bg-brand-red' : 'border-gray-600'
                          }`}>
                            {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                          </div>
                          <span>{option}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                  disabled={currentQuestion === 0}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-surface-card border border-surface-border text-gray-400 hover:text-white text-sm font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>

                <div className="flex items-center gap-1">
                  {questions.map((_: any, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentQuestion(idx)}
                      className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${
                        idx === currentQuestion
                          ? 'bg-brand-red text-white'
                          : answers[idx] !== undefined
                          ? 'bg-brand-red/20 text-brand-red-light border border-brand-red/20'
                          : 'bg-surface-card border border-surface-border text-gray-500'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>

                {currentQuestion < totalQuestions - 1 ? (
                  <button
                    onClick={() => setCurrentQuestion(Math.min(totalQuestions - 1, currentQuestion + 1))}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-surface-card border border-surface-border text-gray-400 hover:text-white text-sm font-medium transition-colors"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmitQuiz}
                    disabled={submittingQuiz || Object.keys(answers).length < totalQuestions}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand-red hover:bg-brand-red/90 text-white text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {submittingQuiz ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    Submit Quiz
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'leaderboard' && (
        <div>
          {loadingLeaderboard ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-gray-500 animate-spin" />
            </div>
          ) : !leaderboard || (Array.isArray(leaderboard) && leaderboard.length === 0) ? (
            <div className="text-center py-16 bg-surface-card/40 border border-surface-border/30 rounded-xl">
              <Trophy className="w-12 h-12 mx-auto mb-3 text-gray-600" />
              <p className="text-gray-400">No leaderboard data yet</p>
            </div>
          ) : (
            <div className="bg-surface-card/40 border border-surface-border/30 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-surface-border/40">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Rank</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">ADM Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Modules Completed</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Avg Score</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Best Module</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(Array.isArray(leaderboard) ? leaderboard : [])
                      .map((entry: any) => {
                        // Compute average score: total_score is sum of all module scores, divide by modules attempted
                        const modulesAttempted = (entry.modules_completed || 0) +
                          ((entry.total_modules || 0) - (entry.modules_completed || 0) > 0 ? 0 : 0);
                        // total_score is sum; modules_completed is how many passed; but we need modules attempted
                        // Backend doesn't give us attempted count separately, so use total_score / modules_completed as approximation
                        // If they completed 2 modules with 94% each, total_score = 188, avg = 94%
                        const totalAttempted = entry.modules_completed || 1;
                        const avgScore = entry.total_score ? Math.round((entry.total_score / totalAttempted) * 10) / 10 : 0;
                        return { ...entry, avgScore };
                      })
                      .sort((a: any, b: any) => b.avgScore - a.avgScore)
                      .map((entry: any, index: number) => {
                      const isCurrentADM = entry.adm_id === admId || entry.adm_name === user?.name;
                      const rank = index + 1;

                      const medalColor = rank === 1
                        ? 'text-amber-400 bg-amber-500/20'
                        : rank === 2
                        ? 'text-gray-300 bg-gray-400/20'
                        : rank === 3
                        ? 'text-orange-400 bg-orange-700/20'
                        : 'text-gray-500 bg-surface-card';

                      return (
                        <tr
                          key={entry.adm_id || index}
                          className={`border-b border-surface-border/20 transition-colors ${
                            isCurrentADM
                              ? 'bg-brand-red/5 border-l-2 border-l-brand-red'
                              : 'hover:bg-surface-card/50'
                          }`}
                        >
                          <td className="px-4 py-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${medalColor}`}>
                              {rank <= 3 ? <Medal className="w-4 h-4" /> : rank}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className={`text-sm font-medium ${isCurrentADM ? 'text-brand-red-light' : 'text-white'}`}>
                                {entry.adm_name || entry.name}
                              </span>
                              {isCurrentADM && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-brand-red/10 text-brand-red-light border border-brand-red/20">
                                  YOU
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-300">
                            {entry.modules_completed ?? entry.completed ?? 0}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-sm font-medium ${
                              entry.avgScore >= 85
                                ? 'text-emerald-400'
                                : entry.avgScore >= 70
                                ? 'text-amber-400'
                                : 'text-red-400'
                            }`}>
                              {entry.avgScore}%
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-400">
                            {entry.best_module || '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'products' && (
        <div className="space-y-8">
          {loadingProducts ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-gray-500 animate-spin" />
            </div>
          ) : Object.keys(groupedProducts).length === 0 ? (
            <div className="text-center py-16 bg-surface-card/40 border border-surface-border/30 rounded-xl">
              <Package className="w-12 h-12 mx-auto mb-3 text-gray-600" />
              <p className="text-gray-400">No products found</p>
            </div>
          ) : (
            Object.entries(groupedProducts).map(([category, prods]) => {
              const catStyle = getCategoryStyle(category);
              return (
                <div key={category}>
                  <div className="flex items-center gap-2 mb-4">
                    <Package className={`w-4 h-4 ${catStyle.color}`} />
                    <h3 className="text-lg font-semibold text-white capitalize">{category}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${catStyle.bg} ${catStyle.color} border ${catStyle.border}`}>
                      {prods.length} products
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {prods.map((product: any) => {
                      const features = parseFeatures(product.key_features);
                      return (
                        <div
                          key={product.id}
                          className="p-5 rounded-xl bg-surface-card/40 border border-surface-border/30 hover:border-surface-border/50 transition-all"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-semibold text-white">{product.name}</h4>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${catStyle.bg} ${catStyle.color} border ${catStyle.border}`}>
                              {category}
                            </span>
                          </div>

                          {product.description && (
                            <p className="text-xs text-gray-400 mb-3 line-clamp-2">{product.description}</p>
                          )}

                          {/* Key features list */}
                          {features.length > 0 && (
                            <div className="space-y-1.5 mb-3">
                              {features.slice(0, expandedProduct === product.id ? features.length : 3).map((feature: string, i: number) => (
                                <div key={i} className="flex items-start gap-2">
                                  <div className={`w-1 h-1 rounded-full mt-1.5 ${catStyle.color.replace('text-', 'bg-')}`} />
                                  <span className="text-xs text-gray-400">{feature}</span>
                                </div>
                              ))}
                              {features.length > 3 && (
                                <button
                                  onClick={() => setExpandedProduct(expandedProduct === product.id ? null : product.id)}
                                  className="text-xs text-brand-red-light hover:underline"
                                >
                                  {expandedProduct === product.id ? 'Show less' : `+${features.length - 3} more features`}
                                </button>
                              )}
                            </div>
                          )}

                          {/* Premium + Commission */}
                          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-surface-border/30">
                            {product.premium_range && (
                              <div>
                                <p className="text-[10px] text-gray-500 uppercase">Premium</p>
                                <p className="text-xs font-medium text-white">{product.premium_range}</p>
                              </div>
                            )}
                            {product.commission_rate && (
                              <div>
                                <p className="text-[10px] text-gray-500 uppercase">Commission</p>
                                <p className="text-xs font-medium text-emerald-400">{product.commission_rate}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
