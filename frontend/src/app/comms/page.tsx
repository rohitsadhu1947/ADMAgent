'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  MessageCircle,
  Copy,
  Check,
  Loader2,
  FileText,
  Phone,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Package,
  Globe,
  Layers,
  AlertCircle,
  IndianRupee,
  Percent,
  Target,
  Star,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAPI } from '@/lib/useAPI';
import { useAuth } from '@/lib/AuthContext';

type TabKey = 'templates' | 'scripts' | 'brochures';

const TABS: { key: TabKey; label: string; icon: any }[] = [
  { key: 'templates', label: 'Message Templates', icon: FileText },
  { key: 'scripts', label: 'Call Scripts', icon: Phone },
  { key: 'brochures', label: 'Brochure Kit', icon: BookOpen },
];

const CATEGORY_COLORS: Record<string, { color: string; bg: string; border: string }> = {
  follow_up: { color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
  first_contact: { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  onboarding: { color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
  training: { color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
  motivation: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  escalation: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
  reactivation: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  general: { color: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-500/20' },
  term: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
  ulip: { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  savings: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  child: { color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
  pension: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  health: { color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/20' },
  group: { color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
};

function getCatStyle(category: string) {
  const key = category?.toLowerCase().replace(/[\s-]+/g, '_');
  return CATEGORY_COLORS[key] || CATEGORY_COLORS.general;
}

// Highlight template variables like {agent_name}
function highlightVariables(text: string): JSX.Element[] {
  if (!text) return [];
  const parts = text.split(/(\{[^}]+\})/g);
  return parts.map((part, i) => {
    if (part.startsWith('{') && part.endsWith('}')) {
      return (
        <span key={i} className="px-1 py-0.5 rounded bg-amber-500/15 text-amber-400 font-medium text-xs">
          {part}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export default function CommsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>('templates');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedScript, setExpandedScript] = useState<string | null>(null);
  const [expandedBrochure, setExpandedBrochure] = useState<number | null>(null);

  // Language toggle for templates
  const [templateLanguages, setTemplateLanguages] = useState<Record<string, 'english' | 'hindi'>>({});

  // Fetch communication templates
  const { data: templates, loading: loadingTemplates } = useAPI(() => api.getCommTemplates());

  // Fetch call scripts
  const { data: scripts, loading: loadingScripts } = useAPI(() => api.getCallScripts());

  // Fetch products for brochure kit
  const { data: products, loading: loadingProducts } = useAPI(() => api.listProducts());
  const { data: productCategories } = useAPI(() => api.getProductCategories());

  // Group templates by category
  const groupedTemplates = useMemo(() => {
    if (!templates || !Array.isArray(templates)) return {};
    const groups: Record<string, any[]> = {};
    templates.forEach((tpl: any) => {
      const cat = tpl.category || 'General';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(tpl);
    });
    return groups;
  }, [templates]);

  // Group products by category for brochure kit
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

  // Copy to clipboard
  const handleCopy = useCallback(async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  }, []);

  // Toggle language for a template
  const toggleLanguage = (templateId: string) => {
    setTemplateLanguages((prev) => ({
      ...prev,
      [templateId]: prev[templateId] === 'hindi' ? 'english' : 'hindi',
    }));
  };

  // Get the right text based on language
  // Backend returns { variants: { hi: "...", en: "..." } }
  const getTemplateText = (template: any): string => {
    const id = template.name || template.id;
    const lang = templateLanguages[id] || 'english';
    const variants = template.variants || {};
    if (lang === 'hindi') {
      return variants.hi || template.text_hindi || template.hindi || variants.en || template.text || '';
    }
    return variants.en || template.text || template.text_english || template.content || '';
  };

  // Check if template has Hindi variant
  const hasHindiVariant = (template: any): boolean => {
    return !!(template.variants?.hi || template.text_hindi || template.hindi);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/20">
          <MessageCircle className="w-6 h-6 text-cyan-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Communication Hub</h1>
          <p className="text-sm text-gray-500">Templates, scripts, and brochures for agent engagement</p>
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

      {/* === Message Templates Tab === */}
      {activeTab === 'templates' && (
        <div className="space-y-8">
          {loadingTemplates ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-gray-500 animate-spin" />
            </div>
          ) : Object.keys(groupedTemplates).length === 0 ? (
            <div className="text-center py-16 bg-surface-card/40 border border-surface-border/30 rounded-xl">
              <FileText className="w-12 h-12 mx-auto mb-3 text-gray-600" />
              <p className="text-gray-400">No message templates available</p>
            </div>
          ) : (
            Object.entries(groupedTemplates).map(([category, tpls]) => {
              const catStyle = getCatStyle(category);
              return (
                <div key={category}>
                  <div className="flex items-center gap-2 mb-4">
                    <Layers className={`w-4 h-4 ${catStyle.color}`} />
                    <h3 className="text-lg font-semibold text-white capitalize">{category.replace(/_/g, ' ')}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${catStyle.bg} ${catStyle.color} border ${catStyle.border}`}>
                      {tpls.length} templates
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {tpls.map((template: any) => {
                      const templateId = template.name || template.id || Math.random().toString();
                      const currentLang = templateLanguages[templateId] || 'english';
                      const templateText = getTemplateText(template);
                      const hasHindi = hasHindiVariant(template);

                      return (
                        <div
                          key={templateId}
                          className="p-5 rounded-xl bg-surface-card/40 border border-surface-border/30 hover:border-surface-border/50 transition-all"
                        >
                          {/* Header */}
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="text-sm font-semibold text-white mb-1">
                                {template.name || template.title}
                              </h4>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${catStyle.bg} ${catStyle.color} border ${catStyle.border}`}>
                                {category.replace(/_/g, ' ')}
                              </span>
                            </div>

                            {/* Language Toggle */}
                            {hasHindi && (
                              <button
                                onClick={() => toggleLanguage(templateId)}
                                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface-card border border-surface-border text-xs font-medium text-gray-400 hover:text-white transition-colors"
                              >
                                <Globe className="w-3 h-3" />
                                {currentLang === 'english' ? 'Hindi' : 'English'}
                              </button>
                            )}
                          </div>

                          {/* Description */}
                          {template.description && (
                            <p className="text-xs text-gray-500 mb-3">{template.description}</p>
                          )}

                          {/* Template Text */}
                          <div className="p-3 rounded-lg bg-[#0B1120] border border-surface-border/20 mb-3">
                            <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                              {highlightVariables(templateText)}
                            </p>
                          </div>

                          {/* Copy Button */}
                          <button
                            onClick={() => handleCopy(templateText, templateId)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all w-full justify-center ${
                              copiedId === templateId
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-surface-card border border-surface-border text-gray-400 hover:text-white'
                            }`}
                          >
                            {copiedId === templateId ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                Copied to Clipboard
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                Copy to Clipboard
                              </>
                            )}
                          </button>
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

      {/* === Call Scripts Tab === */}
      {activeTab === 'scripts' && (
        <div className="space-y-4">
          {loadingScripts ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-gray-500 animate-spin" />
            </div>
          ) : !scripts || (Array.isArray(scripts) && scripts.length === 0) ? (
            <div className="text-center py-16 bg-surface-card/40 border border-surface-border/30 rounded-xl">
              <Phone className="w-12 h-12 mx-auto mb-3 text-gray-600" />
              <p className="text-gray-400">No call scripts available</p>
            </div>
          ) : (
            (Array.isArray(scripts) ? scripts : []).map((script: any) => {
              const scriptId = script.name || script.id || script.title;
              const isExpanded = expandedScript === scriptId;
              const catStyle = getCatStyle(script.category || 'general');

              return (
                <div
                  key={scriptId}
                  className="rounded-xl bg-surface-card/40 border border-surface-border/30 overflow-hidden transition-all"
                >
                  {/* Accordion Header */}
                  <button
                    onClick={() => setExpandedScript(isExpanded ? null : scriptId)}
                    className="w-full flex items-center justify-between p-5 text-left hover:bg-surface-card/60 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${catStyle.bg} border ${catStyle.border}`}>
                        <Phone className={`w-4 h-4 ${catStyle.color}`} />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-white">
                          {script.name || script.title}
                        </h4>
                        {script.category && (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${catStyle.bg} ${catStyle.color} border ${catStyle.border} mt-1 inline-block`}>
                            {script.category}
                          </span>
                        )}
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </button>

                  {/* Accordion Content */}
                  {isExpanded && (
                    <div className="px-5 pb-5 space-y-5 border-t border-surface-border/20">
                      {/* Scenario description */}
                      {script.scenario && (
                        <p className="text-sm text-gray-400 mt-4 italic">{script.scenario}</p>
                      )}

                      {/* Render sections array from backend */}
                      {script.sections && Array.isArray(script.sections) && script.sections.map((section: any, i: number) => {
                        const titleLower = (section.title || '').toLowerCase();
                        // Color-code sections by type
                        const sectionColor = titleLower.includes('opening') ? 'text-brand-red-light'
                          : titleLower.includes('talking') || titleLower.includes('key') ? 'text-blue-400'
                          : titleLower.includes('objection') ? 'text-amber-400'
                          : titleLower.includes('closing') ? 'text-emerald-400'
                          : 'text-gray-300';

                        return (
                          <div key={i} className={i === 0 ? 'mt-4' : ''}>
                            <h5 className={`text-xs font-semibold ${sectionColor} uppercase tracking-wider mb-2`}>
                              {section.title || section.name}
                            </h5>

                            {/* Text content (Opening, Closing, etc.) */}
                            {section.content && (
                              <p className="text-sm text-gray-300 leading-relaxed bg-[#0B1120] rounded-lg p-3 border border-surface-border/20 whitespace-pre-wrap">
                                {section.content}
                              </p>
                            )}

                            {/* Bullet points (Key Talking Points, etc.) */}
                            {section.bullets && Array.isArray(section.bullets) && section.bullets.length > 0 && (
                              <ul className="space-y-2">
                                {section.bullets.map((point: string, j: number) => (
                                  <li key={j} className="flex items-start gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                                    <span className="text-sm text-gray-300">{point}</span>
                                  </li>
                                ))}
                              </ul>
                            )}

                            {/* Objection/Response items (Common Objections, etc.) */}
                            {section.items && Array.isArray(section.items) && section.items.length > 0 && (
                              <div className="space-y-3">
                                {section.items.map((item: any, j: number) => (
                                  <div key={j} className="bg-[#0B1120] rounded-lg p-3 border border-surface-border/20">
                                    <p className="text-sm font-medium text-amber-300 mb-1.5">
                                      Q: {typeof item === 'string' ? item : item.objection || item.question}
                                    </p>
                                    {typeof item !== 'string' && (item.response || item.answer) && (
                                      <p className="text-sm text-gray-400">
                                        A: {item.response || item.answer}
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* Legacy flat structure fallback */}
                      {(!script.sections || !Array.isArray(script.sections) || script.sections.length === 0) && (
                        <div className="mt-4">
                          {script.opening && (
                            <div className="mb-4">
                              <h5 className="text-xs font-semibold text-brand-red-light uppercase tracking-wider mb-2">Opening</h5>
                              <p className="text-sm text-gray-300 leading-relaxed bg-[#0B1120] rounded-lg p-3 border border-surface-border/20">{script.opening}</p>
                            </div>
                          )}
                          {script.talking_points && Array.isArray(script.talking_points) && (
                            <div className="mb-4">
                              <h5 className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-2">Key Talking Points</h5>
                              <ul className="space-y-2">
                                {script.talking_points.map((point: string, j: number) => (
                                  <li key={j} className="flex items-start gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                                    <span className="text-sm text-gray-300">{point}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {script.closing && (
                            <div>
                              <h5 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">Closing</h5>
                              <p className="text-sm text-gray-300 leading-relaxed bg-[#0B1120] rounded-lg p-3 border border-surface-border/20">{script.closing}</p>
                            </div>
                          )}
                          {script.content && (
                            <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap bg-[#0B1120] rounded-lg p-3 border border-surface-border/20">
                              {script.content}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* === Brochure Kit Tab === */}
      {activeTab === 'brochures' && (
        <div className="space-y-8">
          {loadingProducts ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-gray-500 animate-spin" />
            </div>
          ) : Object.keys(groupedProducts).length === 0 ? (
            <div className="text-center py-16 bg-surface-card/40 border border-surface-border/30 rounded-xl">
              <Package className="w-12 h-12 mx-auto mb-3 text-gray-600" />
              <p className="text-gray-400">No products available</p>
            </div>
          ) : (
            Object.entries(groupedProducts).map(([category, prods]) => {
              const catStyle = getCatStyle(category);
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
                      const isExpanded = expandedBrochure === product.id;

                      return (
                        <div
                          key={product.id}
                          className="p-5 rounded-xl bg-surface-card/40 border border-surface-border/30 hover:border-surface-border/50 transition-all"
                        >
                          {/* Header */}
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-semibold text-white">{product.name}</h4>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${catStyle.bg} ${catStyle.color} border ${catStyle.border}`}>
                              {category}
                            </span>
                          </div>

                          {/* Description */}
                          {product.description && (
                            <p className="text-xs text-gray-400 mb-3 leading-relaxed">
                              {product.description}
                            </p>
                          )}

                          {/* Key selling points */}
                          {product.selling_tips && (
                            <div className="mb-3">
                              <p className="text-[10px] text-gray-500 uppercase font-medium mb-1.5">Key Selling Points</p>
                              <div className="space-y-1.5">
                                {(typeof product.selling_tips === 'string'
                                  ? product.selling_tips.split(/[.\n]/).filter((s: string) => s.trim())
                                  : Array.isArray(product.selling_tips) ? product.selling_tips : []
                                ).slice(0, 3).map((tip: string, i: number) => (
                                  <div key={i} className="flex items-start gap-2">
                                    <Star className={`w-3 h-3 ${catStyle.color} flex-shrink-0 mt-0.5`} />
                                    <span className="text-xs text-gray-300">{tip.trim()}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Premium + Commission Highlight */}
                          <div className="grid grid-cols-2 gap-2 mb-3">
                            {product.premium_range && (
                              <div className="p-2.5 rounded-lg bg-[#0B1120] border border-surface-border/20">
                                <div className="flex items-center gap-1 mb-0.5">
                                  <IndianRupee className="w-3 h-3 text-gray-500" />
                                  <span className="text-[10px] text-gray-500 uppercase">Premium Range</span>
                                </div>
                                <p className="text-xs font-semibold text-white">{product.premium_range}</p>
                              </div>
                            )}
                            {product.commission_rate && (
                              <div className="p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                                <div className="flex items-center gap-1 mb-0.5">
                                  <Percent className="w-3 h-3 text-emerald-500" />
                                  <span className="text-[10px] text-emerald-600 uppercase">Commission</span>
                                </div>
                                <p className="text-xs font-semibold text-emerald-400">{product.commission_rate}</p>
                              </div>
                            )}
                          </div>

                          {/* Key Features - Expandable */}
                          {features.length > 0 && (
                            <div className="pt-3 border-t border-surface-border/20">
                              <button
                                onClick={() => setExpandedBrochure(isExpanded ? null : product.id)}
                                className="flex items-center justify-between w-full text-left mb-2"
                              >
                                <span className="text-[10px] text-gray-500 uppercase font-medium">
                                  Key Features ({features.length})
                                </span>
                                {isExpanded ? (
                                  <ChevronUp className="w-3.5 h-3.5 text-gray-500" />
                                ) : (
                                  <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                                )}
                              </button>
                              {isExpanded && (
                                <div className="space-y-1.5">
                                  {features.map((feature: string, i: number) => (
                                    <div key={i} className="flex items-start gap-2">
                                      <div className={`w-1 h-1 rounded-full mt-1.5 ${catStyle.color.replace('text-', 'bg-')}`} />
                                      <span className="text-xs text-gray-400">{feature}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Target audience */}
                          {product.target_audience && (
                            <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-surface-border/20">
                              <Target className="w-3 h-3 text-gray-500" />
                              <span className="text-[10px] text-gray-500">{product.target_audience}</span>
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
    </div>
  );
}
