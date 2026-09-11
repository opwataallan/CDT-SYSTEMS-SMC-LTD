import React, { useState, useEffect } from 'react';
import { ShieldCheck, RefreshCw, Filter, Search, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { AuditLogEntry } from '../../types';
import { api } from '../../services/api';
import { useShop } from '../../context/ShopContext';

export const AdminAuditLogsTab: React.FC = () => {
  const { showToast } = useShop();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await api.getAuditLogs();
      setLogs(res.logs || []);
    } catch (err: any) {
      showToast('Could not load audit logs: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const categories = Array.from(new Set(logs.map((l) => l.category)));

  const filtered = logs.filter((log) => {
    const matchesCategory = filterCategory === 'all' || log.category === filterCategory;
    const q = search.toLowerCase();
    const matchesSearch =
      log.action.toLowerCase().includes(q) ||
      log.actor_email.toLowerCase().includes(q) ||
      log.ip_address.toLowerCase().includes(q) ||
      JSON.stringify(log.details).toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Administrative Security Audit Logs</span>
          </h2>
          <p className="text-xs text-slate-500">
            Immutable trace of administrative actions, authentication attempts, and setting updates.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search action or email..."
              className="h-8 pl-8 pr-2.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-cyan-500"
            />
          </div>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="h-8 px-2.5 text-xs border border-slate-200 rounded-lg bg-white"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={String(c)} value={String(c)}>
                {String(c).toUpperCase()}
              </option>
            ))}
          </select>

          <button
            onClick={loadLogs}
            disabled={loading}
            className="h-8 px-3 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">Loading audit log entries...</div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center text-xs text-slate-400">No matching audit events found.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold text-[11px] uppercase tracking-wider">
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Actor / Role</th>
                <th className="py-2.5 px-3">IP Address</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {filtered.map((entry) => (
                <tr key={entry.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                    {new Date(entry.timestamp).toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 font-bold text-slate-900">{entry.action}</td>
                  <td className="py-2.5 px-3">
                    <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] text-slate-700 font-sans font-bold uppercase">
                      {entry.category}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="text-slate-800 font-sans font-bold">{entry.actor_email}</span>
                    <span className="text-[10px] text-slate-400 block font-sans">({entry.actor_role})</span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">{entry.ip_address}</td>
                  <td className="py-2.5 px-3">
                    {entry.status === 'success' ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-sans font-bold text-[10px]">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>SUCCESS</span>
                      </span>
                    ) : entry.status === 'failure' ? (
                      <span className="inline-flex items-center gap-1 text-rose-700 font-sans font-bold text-[10px]">
                        <XCircle className="w-3 h-3 text-rose-600" />
                        <span>FAILED</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-amber-700 font-sans font-bold text-[10px]">
                        <AlertTriangle className="w-3 h-3 text-amber-600" />
                        <span>WARN</span>
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-slate-500 max-w-xs truncate" title={JSON.stringify(entry.details)}>
                    {JSON.stringify(entry.details)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
