'use client';

import { useState, useCallback } from 'react';
import {
  Package,
  Shield,
  TrendingUp,
  Heart,
  GraduationCap,
  Umbrella,
  Users,
  Activity,
  Plus,
  Edit2,
  X,
  Loader2,
  IndianRupee,
  Percent,
  Target,
  ChevronDown,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAPI } from '@/lib/useAPI';
import { useAuth } from '@/lib/AuthContext';

const CATEGORY_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: any }> = {
  term: { label: 'Term Insurance', color: 'text-red-400', bgColor: 'bg-red-500/10', icon: Shield },
  savings: { label: 'Savings Plans', color: 'text-emerald-400', bgColor: 'bg-emerald-500/10', icon: TrendingUp },
  ulip: { label: 'ULIP', color: 'text-blue-400', bgColor: 'bg-blue-500/10', icon: Activity },
  child: { label: 'Child Plans', color: 'text-purple-400', bgColor: 'bg-purple-500/10', icon: GraduationCap },
  pension: { label: 'Pension', color: 'text-amber-400', bgColor: 'bg-amber-500/10', icon: Umbrella },
  group: { label: 'Group Insurance', color: 'text-cyan-400', bgColor: 'bg-cyan-500/10', icon: Users },
  health: { label: 'Health Insurance', color: 'text-pink-400', bgColor: 'bg-pink-500/10', icon: Heart },
};

export default function ProductsPage() {
  const { isAdmin } = useAuth();
  const { data: products, loading, refetch } = useAPI(() => api.listProducts());
  const { data: categories } = useAPI(() => api.getProductCategories());
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '', category: 'term', description: '', key_features: '', premium_range: '',
    commission_rate: '', target_audience: '', selling_tips: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const filteredProducts = selectedCategory
    ? (products || []).filter((p: any) => p.category === selectedCategory)
    : products || [];

  const handleSave = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingProduct) {
        await api.updateProduct(editingProduct.id, formData);
      } else {
        await api.createProduct(formData);
      }
      setShowAddModal(false);
      setEditingProduct(null);
      setFormData({ name: '', category: 'term', description: '', key_features: '', premium_range: '', commission_rate: '', target_audience: '', selling_tips: '' });
      refetch();
    } catch (e: any) {
      alert(e.message || 'Failed to save product');
    } finally {
      setSubmitting(false);
    }
  }, [formData, editingProduct, refetch]);

  const openEdit = (product: any) => {
    setEditingProduct(product);
    setFormData({
      name: product.name, category: product.category, description: product.description || '',
      key_features: product.key_features || '', premium_range: product.premium_range || '',
      commission_rate: product.commission_rate || '', target_audience: product.target_audience || '',
      selling_tips: product.selling_tips || '',
    });
    setShowAddModal(true);
  };

  const parseFeatures = (features: string): string[] => {
    try {
      return JSON.parse(features);
    } catch {
      return features ? [features] : [];
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500/20 to-blue-500/20 border border-emerald-500/20">
            <Package className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Products Catalog</h1>
            <p className="text-sm text-gray-500">Axis Max Life insurance products for agent training</p>
          </div>
        </div>
        {isAdmin && (
          <button
            onClick={() => { setEditingProduct(null); setFormData({ name: '', category: 'term', description: '', key_features: '', premium_range: '', commission_rate: '', target_audience: '', selling_tips: '' }); setShowAddModal(true); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-medium hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-lg shadow-emerald-500/20"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        )}
      </div>

      {/* Category filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            !selectedCategory ? 'bg-white/10 text-white border border-white/20' : 'bg-white/[0.03] text-gray-400 border border-transparent hover:border-white/10'
          }`}
        >
          All ({(products || []).length})
        </button>
        {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
          const count = (categories as any)?.[key] || 0;
          if (count === 0 && !isAdmin) return null;
          const Icon = config.icon;
          return (
            <button
              key={key}
              onClick={() => setSelectedCategory(selectedCategory === key ? null : key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedCategory === key
                  ? `${config.bgColor} ${config.color} border ${config.bgColor.replace('/10', '/20')}`
                  : 'bg-white/[0.03] text-gray-400 border border-transparent hover:border-white/10'
              }`}
            >
              <Icon className="w-3 h-3" />
              {config.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Products grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-gray-500 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProducts.map((product: any) => {
            const catConfig = CATEGORY_CONFIG[product.category] || CATEGORY_CONFIG.term;
            const CatIcon = catConfig.icon;
            const features = parseFeatures(product.key_features);

            return (
              <div
                key={product.id}
                className="group relative p-6 rounded-2xl bg-white/[0.02] backdrop-blur-xl border border-white/5 hover:border-white/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                {/* Category badge */}
                <div className="flex items-center justify-between mb-4">
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${catConfig.bgColor} border ${catConfig.bgColor.replace('/10', '/20')}`}>
                    <CatIcon className={`w-3.5 h-3.5 ${catConfig.color}`} />
                    <span className={`text-xs font-medium ${catConfig.color}`}>{catConfig.label}</span>
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => openEdit(product)}
                      className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Product name */}
                <h3 className="text-lg font-bold text-white mb-2">{product.name}</h3>
                <p className="text-sm text-gray-400 leading-relaxed mb-4 line-clamp-2">{product.description}</p>

                {/* Key stats */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {product.premium_range && (
                    <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5">
                      <div className="flex items-center gap-1 mb-0.5">
                        <IndianRupee className="w-3 h-3 text-gray-500" />
                        <span className="text-[10px] text-gray-500 uppercase">Premium</span>
                      </div>
                      <p className="text-xs font-semibold text-white">{product.premium_range}</p>
                    </div>
                  )}
                  {product.commission_rate && (
                    <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5">
                      <div className="flex items-center gap-1 mb-0.5">
                        <Percent className="w-3 h-3 text-gray-500" />
                        <span className="text-[10px] text-gray-500 uppercase">Commission</span>
                      </div>
                      <p className="text-xs font-semibold text-emerald-400">{product.commission_rate}</p>
                    </div>
                  )}
                </div>

                {/* Features */}
                {features.length > 0 && (
                  <div className="space-y-1.5 mb-4">
                    {features.slice(0, 3).map((feature, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <div className={`w-1 h-1 rounded-full mt-1.5 ${catConfig.color.replace('text-', 'bg-')}`} />
                        <span className="text-xs text-gray-400">{feature}</span>
                      </div>
                    ))}
                    {features.length > 3 && (
                      <p className="text-xs text-gray-600 pl-3">+{features.length - 3} more features</p>
                    )}
                  </div>
                )}

                {/* Target audience */}
                {product.target_audience && (
                  <div className="flex items-center gap-1.5 pt-3 border-t border-white/5">
                    <Target className="w-3 h-3 text-gray-500" />
                    <span className="text-xs text-gray-500">{product.target_audience}</span>
                  </div>
                )}
              </div>
            );
          })}

          {filteredProducts.length === 0 && (
            <div className="col-span-3 text-center py-12 text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">No products found</p>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-surface-card border border-surface-border rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button onClick={() => { setShowAddModal(false); setEditingProduct(null); }} className="p-1 rounded-lg hover:bg-white/5 text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider">Product Name *</label>
                  <input required type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500/40"
                    placeholder="Smart Term Plan" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider">Category *</label>
                  <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500/40">
                    {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
                      <option key={key} value={key}>{cfg.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider">Description</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3} className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500/40 resize-none"
                  placeholder="Brief description of the product..." />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider">Premium Range</label>
                  <input type="text" value={formData.premium_range} onChange={(e) => setFormData({ ...formData, premium_range: e.target.value })}
                    className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500/40"
                    placeholder="5,000 - 50,000/year" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider">Commission Rate</label>
                  <input type="text" value={formData.commission_rate} onChange={(e) => setFormData({ ...formData, commission_rate: e.target.value })}
                    className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500/40"
                    placeholder="30-35% first year, 5% renewal" />
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider">Target Audience</label>
                <input type="text" value={formData.target_audience} onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
                  className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500/40"
                  placeholder="Salaried individuals, 25-55 years" />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider">Key Features (JSON array)</label>
                <textarea value={formData.key_features} onChange={(e) => setFormData({ ...formData, key_features: e.target.value })}
                  rows={2} className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500/40 resize-none font-mono"
                  placeholder='["Feature 1", "Feature 2", "Feature 3"]' />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider">Selling Tips</label>
                <textarea value={formData.selling_tips} onChange={(e) => setFormData({ ...formData, selling_tips: e.target.value })}
                  rows={2} className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500/40 resize-none"
                  placeholder="Tips for selling this product to agents..." />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowAddModal(false); setEditingProduct(null); }}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-400 text-sm hover:bg-white/5 transition-all">
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Package className="w-4 h-4" />}
                  {editingProduct ? 'Update Product' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
