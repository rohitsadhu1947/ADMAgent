'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  Users,
  Plus,
  Upload,
  Search,
  RefreshCw,
  Loader2,
  CheckCircle,
  AlertTriangle,
  X,
  FileSpreadsheet,
  Eye,
  Download,
  Trash2,
  Edit3,
  MapPin,
  Phone,
  Mail,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAPI } from '@/lib/useAPI';

type TabKey = 'roster' | 'add' | 'bulk';

const TABS: { key: TabKey; label: string; icon: any }[] = [
  { key: 'roster', label: 'ADM Roster', icon: Users },
  { key: 'add', label: 'Add ADM', icon: Plus },
  { key: 'bulk', label: 'Bulk Upload', icon: Upload },
];

export default function ADMOnboardingPage() {
  const { data: adms, loading: admsLoading, refetch: refetchADMs } = useAPI(() => api.listADMs());
  const [activeTab, setActiveTab] = useState<TabKey>('roster');
  const [running, setRunning] = useState(false);
  const [actionResult, setActionResult] = useState<any>(null);

  // Roster filters
  const [search, setSearch] = useState('');
  const [regionFilter, setRegionFilter] = useState('all');

  // Add ADM form
  const [newADM, setNewADM] = useState({
    name: '', phone: '', email: '', region: '', language: 'Hindi,English', max_capacity: '50',
    telegram_chat_id: '', whatsapp_number: '',
  });

  // Bulk upload state
  const [bulkCSV, setBulkCSV] = useState('');
  const [bulkParsed, setBulkParsed] = useState<any[]>([]);
  const [bulkError, setBulkError] = useState('');

  const admList = useMemo(() => Array.isArray(adms) ? adms : [], [adms]);

  const regions = useMemo(() => {
    const set = new Set<string>();
    admList.forEach((a: any) => { if (a.region) set.add(a.region); });
    return Array.from(set).sort();
  }, [admList]);

  const filteredADMs = useMemo(() => {
    return admList.filter((adm: any) => {
      if (search) {
        const s = search.toLowerCase();
        if (!adm.name?.toLowerCase().includes(s) && !adm.phone?.includes(s) && !adm.region?.toLowerCase().includes(s)) return false;
      }
      if (regionFilter !== 'all' && adm.region !== regionFilter) return false;
      return true;
    });
  }, [admList, search, regionFilter]);

  const handleAddADM = async () => {
    setRunning(true);
    setActionResult(null);
    try {
      const payload: any = { ...newADM, max_capacity: parseInt(newADM.max_capacity) || 50 };
      if (!payload.email) delete payload.email;
      if (!payload.telegram_chat_id) delete payload.telegram_chat_id;
      if (!payload.whatsapp_number) delete payload.whatsapp_number;
      await api.createADM(payload);
      setNewADM({ name: '', phone: '', email: '', region: '', language: 'Hindi,English', max_capacity: '50', telegram_chat_id: '', whatsapp_number: '' });
      setActionResult({ type: 'success', title: 'ADM Created', data: { message: `${payload.name} added successfully` } });
      refetchADMs();
    } catch (e: any) {
      setActionResult({ type: 'error', title: 'Failed to Add ADM', message: e.message });
    } finally {
      setRunning(false);
    }
  };

  const handleDeleteADM = async (admId: number, admName: string) => {
    if (!confirm(`Delete ${admName}? Their agents will be unassigned.`)) return;
    try {
      await api.deleteADM(admId);
      setActionResult({ type: 'success', title: 'ADM Deleted', data: { message: `${admName} removed` } });
      refetchADMs();
    } catch (e: any) {
      setActionResult({ type: 'error', title: 'Delete Failed', message: e.message });
    }
  };

  // Bulk CSV/TSV parse
  const handleCSVParse = () => {
    setBulkError('');
    setBulkParsed([]);
    if (!bulkCSV.trim()) { setBulkError('Please paste CSV or tab-separated data'); return; }
    const lines = bulkCSV.trim().split('\n');
    if (lines.length < 2) { setBulkError('Data must have a header row and at least one data row'); return; }
    const delimiter = lines[0].includes('\t') ? '\t' : ',';
    const headers = lines[0].split(delimiter).map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));
    const reqFields = ['name', 'phone', 'region'];
    const missing = reqFields.filter(f => !headers.includes(f));
    if (missing.length) { setBulkError(`Missing required columns: ${missing.join(', ')}`); return; }
    const parsed: any[] = [];
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const vals = lines[i].split(delimiter).map(v => v.trim());
      const row: any = {};
      headers.forEach((h, idx) => { row[h] = vals[idx] || ''; });
      if (!row.name || !row.phone || !row.region) {
        setBulkError(`Row ${i + 1}: name, phone, and region are required`);
        return;
      }
      row.language = row.language || 'Hindi,English';
      row.max_capacity = parseInt(row.max_capacity) || 50;
      parsed.push(row);
    }
    setBulkParsed(parsed);
  };

  const handleBulkUpload = async () => {
    if (!bulkParsed.length) return;
    setRunning(true);
    setActionResult(null);
    try {
      const res = await api.bulkImportADMs(bulkParsed);
      setActionResult({
        type: res.errors_count > 0 ? 'warning' : 'success',
        title: `Bulk Import: ${res.created} of ${res.total_submitted} Created`,
        data: res,
      });
      setBulkCSV('');
      setBulkParsed([]);
      refetchADMs();
    } catch (e: any) {
      setActionResult({ type: 'error', title: 'Bulk Import Failed', message: e.message });
    } finally {
      setRunning(false);
    }
  };

  if (admsLoading) {
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
          <h1 className="text-2xl font-bold text-white">ADM Onboarding</h1>
          <p className="text-sm text-gray-400 mt-1">
            Manage Agency Development Managers — add, import, and configure ADMs
          </p>
        </div>
        <button
          onClick={() => refetchADMs()}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-card border border-surface-border text-gray-400 hover:text-white text-sm transition-all"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="glass-card p-4">
          <p className="text-[11px] text-gray-500 uppercase tracking-wider">Total ADMs</p>
          <p className="text-2xl font-bold text-white mt-1">{admList.length}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-[11px] text-gray-500 uppercase tracking-wider">Regions</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">{regions.length}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-[11px] text-gray-500 uppercase tracking-wider">Total Capacity</p>
          <p className="text-2xl font-bold text-purple-400 mt-1">{admList.reduce((s: number, a: any) => s + (a.max_capacity || 0), 0)}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-[11px] text-gray-500 uppercase tracking-wider">Avg Score</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">
            {admList.length > 0 ? Math.round(admList.reduce((s: number, a: any) => s + (a.performance_score || 0), 0) / admList.length) : 0}
          </p>
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

      {/* ==================== TAB: ADM ROSTER ==================== */}
      {activeTab === 'roster' && (
        <div className="space-y-4">
          <div className="glass-card p-4 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, phone, region..."
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-[#0B1120] border border-surface-border/30 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-red/30"
              />
            </div>
            <select value={regionFilter} onChange={(e) => setRegionFilter(e.target.value)} className="px-3 py-2 rounded-lg bg-[#0B1120] border border-surface-border/30 text-sm text-gray-300 focus:outline-none">
              <option value="all">All Regions</option>
              {regions.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <span className="text-xs text-gray-500">{filteredADMs.length} ADMs</span>
          </div>

          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-surface-border/30">
                    <th className="text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider px-4 py-3">ADM</th>
                    <th className="text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Region</th>
                    <th className="text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Languages</th>
                    <th className="text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Capacity</th>
                    <th className="text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Score</th>
                    <th className="text-right text-[11px] font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredADMs.map((adm: any) => (
                    <tr key={adm.id} className="border-b border-surface-border/10 hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-white">{adm.name}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-[11px] text-gray-500 flex items-center gap-1"><Phone className="w-3 h-3" />{adm.phone}</span>
                          {adm.email && <span className="text-[11px] text-gray-500 flex items-center gap-1"><Mail className="w-3 h-3" />{adm.email}</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-300 flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-gray-500" />{adm.region}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-300">{adm.language}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-white font-medium">{adm.active_agent_count || 0}</span>
                          <span className="text-xs text-gray-500">/ {adm.max_capacity}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-sm font-medium ${(adm.performance_score || 0) > 60 ? 'text-emerald-400' : (adm.performance_score || 0) > 30 ? 'text-amber-400' : 'text-gray-400'}`}>
                          {adm.performance_score || 0}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleDeleteADM(adm.id, adm.name)}
                          className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 ml-auto"
                          title="Delete ADM"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredADMs.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                <p className="text-sm text-gray-500">No ADMs match your filters</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== TAB: ADD ADM ==================== */}
      {activeTab === 'add' && (
        <div className="glass-card p-6 max-w-2xl">
          <h3 className="text-base font-semibold text-white mb-5 flex items-center gap-2">
            <Plus className="w-5 h-5 text-brand-red-light" />
            Add New ADM
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Name *</label>
                <input value={newADM.name} onChange={(e) => setNewADM({ ...newADM, name: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-[#0B1120] border border-surface-border/30 text-sm text-white focus:outline-none focus:border-brand-red/30" placeholder="Full name" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Phone *</label>
                <input value={newADM.phone} onChange={(e) => setNewADM({ ...newADM, phone: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-[#0B1120] border border-surface-border/30 text-sm text-white focus:outline-none focus:border-brand-red/30" placeholder="10-digit mobile" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Region *</label>
                <input value={newADM.region} onChange={(e) => setNewADM({ ...newADM, region: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-[#0B1120] border border-surface-border/30 text-sm text-white focus:outline-none focus:border-brand-red/30" placeholder="e.g., West - Mumbai" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Email</label>
                <input value={newADM.email} onChange={(e) => setNewADM({ ...newADM, email: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-[#0B1120] border border-surface-border/30 text-sm text-white focus:outline-none focus:border-brand-red/30" placeholder="email@example.com" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Languages</label>
                <input value={newADM.language} onChange={(e) => setNewADM({ ...newADM, language: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-[#0B1120] border border-surface-border/30 text-sm text-white focus:outline-none focus:border-brand-red/30" placeholder="Hindi,English" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Max Capacity</label>
                <input type="number" value={newADM.max_capacity} onChange={(e) => setNewADM({ ...newADM, max_capacity: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-[#0B1120] border border-surface-border/30 text-sm text-white focus:outline-none focus:border-brand-red/30" placeholder="50" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">WhatsApp Number</label>
                <input value={newADM.whatsapp_number} onChange={(e) => setNewADM({ ...newADM, whatsapp_number: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-[#0B1120] border border-surface-border/30 text-sm text-white focus:outline-none focus:border-brand-red/30" placeholder="Optional" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Telegram Chat ID</label>
                <input value={newADM.telegram_chat_id} onChange={(e) => setNewADM({ ...newADM, telegram_chat_id: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-[#0B1120] border border-surface-border/30 text-sm text-white focus:outline-none focus:border-brand-red/30" placeholder="Optional" />
              </div>
            </div>
            <div className="pt-2">
              <button
                onClick={handleAddADM}
                disabled={running || !newADM.name || !newADM.phone || !newADM.region}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-red hover:bg-brand-red/90 text-white text-sm font-medium disabled:opacity-40 transition-all"
              >
                {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Add ADM
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB: BULK UPLOAD ==================== */}
      {activeTab === 'bulk' && (
        <div className="space-y-6">
          <div className="glass-card p-6">
            <h3 className="text-base font-semibold text-white mb-2 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
              Bulk Import ADMs
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              Paste CSV or tab-separated data below. Required columns: <span className="text-white font-medium">name, phone, region</span>.
              Optional: <span className="text-gray-300">email, language, max_capacity</span>
            </p>

            <div className="bg-[#0B1120] rounded-lg p-4 mb-4 border border-surface-border/20">
              <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-2">Sample Template</p>
              <code className="text-xs text-emerald-400 block whitespace-pre leading-relaxed">
{`name,phone,region,language,max_capacity
Rajesh Kumar,9876543210,West - Mumbai,Hindi,50
Anita Sharma,9876543211,North - Delhi,Hindi,40`}
              </code>
              <button onClick={() => setBulkCSV(`name,phone,region,language,max_capacity\n`)} className="mt-2 text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
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
                  Import {bulkParsed.length} ADMs
                </button>
              )}
            </div>
          </div>

          {bulkParsed.length > 0 && (
            <div className="glass-card overflow-hidden">
              <div className="px-5 py-3 border-b border-surface-border/20">
                <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  Preview: {bulkParsed.length} ADMs ready to import
                </h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-surface-border/20">
                      <th className="text-left text-[11px] font-medium text-gray-500 uppercase px-4 py-2">#</th>
                      <th className="text-left text-[11px] font-medium text-gray-500 uppercase px-4 py-2">Name</th>
                      <th className="text-left text-[11px] font-medium text-gray-500 uppercase px-4 py-2">Phone</th>
                      <th className="text-left text-[11px] font-medium text-gray-500 uppercase px-4 py-2">Region</th>
                      <th className="text-left text-[11px] font-medium text-gray-500 uppercase px-4 py-2">Languages</th>
                      <th className="text-left text-[11px] font-medium text-gray-500 uppercase px-4 py-2">Capacity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bulkParsed.slice(0, 20).map((row, idx) => (
                      <tr key={idx} className="border-b border-surface-border/10">
                        <td className="px-4 py-2 text-xs text-gray-500">{idx + 1}</td>
                        <td className="px-4 py-2 text-sm text-white">{row.name}</td>
                        <td className="px-4 py-2 text-sm text-gray-300">{row.phone}</td>
                        <td className="px-4 py-2 text-sm text-gray-300">{row.region}</td>
                        <td className="px-4 py-2 text-sm text-gray-300">{row.language}</td>
                        <td className="px-4 py-2 text-sm text-gray-300">{row.max_capacity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
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
                <div className="mt-2">
                  {actionResult.data.message && <p className="text-sm text-gray-300">{actionResult.data.message}</p>}
                  {actionResult.data.created !== undefined && (
                    <p className="text-sm text-gray-300"><span className="text-emerald-400 font-medium">{actionResult.data.created}</span> of {actionResult.data.total_submitted} ADMs imported</p>
                  )}
                  {actionResult.data.errors?.length > 0 && (
                    <div className="mt-2 p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                      <p className="text-xs text-red-400 font-medium mb-1">Errors ({actionResult.data.errors.length}):</p>
                      {actionResult.data.errors.slice(0, 5).map((err: any, i: number) => (
                        <p key={i} className="text-xs text-red-400/80">{typeof err === 'string' ? err : `${err.phone || `Row ${err.index + 1}`}: ${err.error}`}</p>
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
