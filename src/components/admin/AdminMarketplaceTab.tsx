import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useShop } from '../../context/ShopContext';
import { Store, PayoutRequest } from '../../types';
import {
  Store as StoreIcon,
  ShieldCheck,
  TrendingUp,
  Wallet,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowUpRight,
  ExternalLink,
  Edit2,
  DollarSign,
  Percent,
  RefreshCw,
  Search,
  Filter,
  Check,
  X,
} from 'lucide-react';

export const AdminMarketplaceTab: React.FC = () => {
  const { formatPrice, showToast, setCurrentView } = useShop();

  const [activeSubTab, setActiveSubTab] = useState<'stores' | 'pending' | 'payouts' | 'commissions'>('stores');
  const [loading, setLoading] = useState<boolean>(true);
  const [stores, setStores] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);

  // Edit commission modal
  const [editingStore, setEditingStore] = useState<any | null>(null);
  const [newCommissionRate, setNewCommissionRate] = useState<number>(8);

  // Payout action modal
  const [selectedPayout, setSelectedPayout] = useState<PayoutRequest | null>(null);
  const [payoutTxRef, setPayoutTxRef] = useState<string>('');
  const [payoutNotes, setPayoutNotes] = useState<string>('');

  // Search filter
  const [storeSearch, setStoreSearch] = useState<string>('');

  useEffect(() => {
    loadMarketplaceData();
  }, []);

  const loadMarketplaceData = async () => {
    setLoading(true);
    try {
      const [storesRes, payoutsRes, analyticsRes] = await Promise.all([
        api.getAdminStores().catch(() => ({ stores: [] })),
        api.getAdminPayouts().catch(() => ({ payouts: [] })),
        api.getAdminMarketplaceAnalytics().catch(() => ({ analytics: null })),
      ]);

      if (storesRes && storesRes.stores) setStores(storesRes.stores);
      if (payoutsRes && payoutsRes.payouts) setPayouts(payoutsRes.payouts);
      if (analyticsRes && analyticsRes.analytics) setAnalytics(analyticsRes.analytics);
    } catch (err: any) {
      console.warn('Failed to load admin marketplace data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStoreStatus = async (storeId: string, status: string, reason?: string) => {
    try {
      const res = await api.updateAdminStoreStatus(storeId, status, reason);
      if (res.success) {
        showToast(res.message || `Store status updated to ${status}`);
        loadMarketplaceData();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to update store status');
    }
  };

  const handleSaveCommission = async () => {
    if (!editingStore) return;
    try {
      const res = await api.updateAdminStoreCommission(editingStore.id, newCommissionRate);
      if (res.success) {
        showToast(`Commission updated to ${newCommissionRate}% for "${editingStore.name}"`);
        setEditingStore(null);
        loadMarketplaceData();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to update commission');
    }
  };

  const handleProcessPayout = async (status: 'paid' | 'rejected') => {
    if (!selectedPayout) return;
    try {
      const res = await api.updateAdminPayoutStatus(
        selectedPayout.id,
        status,
        payoutNotes,
        payoutTxRef
      );
      if (res.success) {
        showToast(res.message || `Payout request marked as ${status}`);
        setSelectedPayout(null);
        setPayoutTxRef('');
        setPayoutNotes('');
        loadMarketplaceData();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to process payout');
    }
  };

  const pendingStores = stores.filter((s) => s.status === 'pending');
  const pendingPayoutsList = payouts.filter((p) => p.status === 'pending' || p.status === 'processing');

  const filteredStores = stores.filter((s) => {
    if (activeSubTab === 'pending' && s.status !== 'pending') return false;
    if (!storeSearch.trim()) return true;
    const q = storeSearch.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.owner_name?.toLowerCase().includes(q) || s.district?.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <StoreIcon className="w-6 h-6 text-[#920d35]" />
            <span>Multi-Vendor Marketplace Administration</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Supervise registered stores, approve vendor applications, monitor commissions & authorize Uganda Mobile Money withdrawals.
          </p>
        </div>

        <button
          onClick={loadMarketplaceData}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Analytics KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold">Total Marketplace GMV</span>
            <TrendingUp className="w-4 h-4 text-[#920d35]" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900">
            {formatPrice(analytics?.marketplace_gmv || 0)}
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            From {analytics?.total_vendor_orders || 0} vendor order fulfillments
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold">Platform Commissions Revenue</span>
            <Percent className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-600">
            {formatPrice(analytics?.platform_commissions || 0)}
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Platform earnings retained from vendor sales
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold">Vendor Net Disbursed</span>
            <DollarSign className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900">
            {formatPrice(analytics?.vendor_earnings || 0)}
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Net revenue allocated to store partners
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold">Pending Withdrawals</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-600">
            {formatPrice(analytics?.pending_payouts_amount || 0)}
          </div>
          <p className="text-[11px] text-slate-500 mt-2 font-semibold">
            {analytics?.pending_payouts_count || 0} payout requests awaiting action
          </p>
        </div>
      </div>

      {/* Sub-tabs Navigation */}
      <div className="bg-white rounded-2xl border border-slate-200 p-2 flex flex-wrap gap-2">
        <button
          onClick={() => setActiveSubTab('stores')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'stores'
              ? 'bg-[#920d35] text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All Stores ({stores.length})
        </button>

        <button
          onClick={() => setActiveSubTab('pending')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeSubTab === 'pending'
              ? 'bg-[#920d35] text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>Pending Applications</span>
          {pendingStores.length > 0 && (
            <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-extrabold animate-pulse">
              {pendingStores.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('payouts')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeSubTab === 'payouts'
              ? 'bg-[#920d35] text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>Payout Requests</span>
          {pendingPayoutsList.length > 0 && (
            <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-extrabold animate-pulse">
              {pendingPayoutsList.length}
            </span>
          )}
        </button>
      </div>

      {/* TAB: STORES LIST & PENDING */}
      {(activeSubTab === 'stores' || activeSubTab === 'pending') && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={storeSearch}
                onChange={(e) => setStoreSearch(e.target.value)}
                placeholder="Search stores by name, owner, or district..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#920d35] focus:outline-none"
              />
            </div>
            <span className="text-xs text-slate-500 font-semibold">
              Showing {filteredStores.length} of {stores.length} stores
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[10px] tracking-wider border-y border-slate-200">
                <tr>
                  <th className="py-3 px-4">Store Brand</th>
                  <th className="py-3 px-4">Owner & Location</th>
                  <th className="py-3 px-4">Catalog</th>
                  <th className="py-3 px-4">Commission</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStores.map((s) => {
                  const isMain = Boolean(s.is_platform_store);
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/80">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={s.logo_url || '/logo.png'}
                            alt={s.name}
                            className="w-9 h-9 object-cover rounded-lg border border-slate-200 shrink-0"
                          />
                          <div>
                            <span className="font-bold text-slate-900 block">{s.name}</span>
                            <span className="text-[11px] text-slate-400 font-mono">ID: {s.id}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-800 block">{s.owner_name}</span>
                        <span className="text-slate-400 text-[11px]">{s.district}, Uganda</span>
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {s.product_count} products
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {isMain ? (
                          <span className="text-slate-400">0% (Main Hub)</span>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingStore(s);
                              setNewCommissionRate(s.commission_rate ?? 8);
                            }}
                            className="text-[#920d35] hover:underline flex items-center gap-1 font-bold"
                          >
                            <span>{s.commission_rate ?? 8}%</span>
                            <Edit2 className="w-3 h-3" />
                          </button>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            s.status === 'active' || s.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : s.status === 'pending'
                              ? 'bg-amber-100 text-amber-800 animate-pulse'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {s.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleUpdateStoreStatus(s.id, 'active')}
                                className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                                title="Approve Store"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleUpdateStoreStatus(s.id, 'rejected', 'Application did not meet requirements')}
                                className="p-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white shadow-sm"
                                title="Reject Store"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}

                          {s.status === 'active' && !isMain && (
                            <button
                              onClick={() => handleUpdateStoreStatus(s.id, 'suspended', 'Store policy review')}
                              className="px-2.5 py-1 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-[11px] font-bold"
                            >
                              Suspend
                            </button>
                          )}

                          {s.status === 'suspended' && (
                            <button
                              onClick={() => handleUpdateStoreStatus(s.id, 'active')}
                              className="px-2.5 py-1 rounded-lg border border-emerald-200 text-emerald-600 hover:bg-emerald-50 text-[11px] font-bold"
                            >
                              Reactivate
                            </button>
                          )}

                          <button
                            onClick={() => setCurrentView('storefront', { slug: s.slug })}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100"
                            title="Visit Public Storefront"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: PAYOUTS */}
      {activeSubTab === 'payouts' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Vendor Withdrawal Requests</h3>
              <p className="text-xs text-slate-400">Verify and disburse vendor Mobile Money payouts</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[10px] tracking-wider border-y border-slate-200">
                <tr>
                  <th className="py-3 px-4">Payout ID</th>
                  <th className="py-3 px-4">Vendor Store</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Method & Account</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payouts.map((po) => (
                  <tr key={po.id} className="hover:bg-slate-50/80">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800">{po.id}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">{po.vendor_name}</td>
                    <td className="py-3.5 px-4 font-black text-slate-900 text-sm">
                      {formatPrice(po.amount)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-800 uppercase block">{po.payout_method}</span>
                      <span className="font-mono text-slate-500 text-[11px]">{po.account_number} ({po.account_name})</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          po.status === 'paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : po.status === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {po.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {po.status === 'pending' || po.status === 'processing' ? (
                        <button
                          onClick={() => setSelectedPayout(po)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs shadow-sm transition-all"
                        >
                          Process Payout
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium">Completed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: EDIT COMMISSION */}
      {editingStore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl relative border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Configure Commission Rate
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Set custom commission fee percentage for <strong>{editingStore.name}</strong>.
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Commission Percentage (%)</label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.5}
                    value={newCommissionRate}
                    onChange={(e) => setNewCommissionRate(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-sm focus:ring-2 focus:ring-[#920d35] focus:outline-none"
                  />
                  <Percent className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingStore(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveCommission}
                  className="bg-[#920d35] hover:bg-[#770929] text-white px-5 py-2 rounded-xl font-bold text-xs shadow-md"
                >
                  Save Rate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PROCESS PAYOUT */}
      {selectedPayout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Disburse Vendor Payout</h3>
            <p className="text-xs text-slate-500 mb-4">
              Withdrawal ID: <strong>{selectedPayout.id}</strong> for {selectedPayout.vendor_name}.
            </p>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs mb-4">
              <div className="flex justify-between">
                <span className="text-slate-500">Amount to Disburse:</span>
                <span className="font-black text-slate-900 text-sm">{formatPrice(selectedPayout.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Gateway:</span>
                <span className="font-bold text-slate-800 uppercase">{selectedPayout.payout_method}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Account / Phone:</span>
                <span className="font-mono text-slate-800">{selectedPayout.account_number} ({selectedPayout.account_name})</span>
              </div>
            </div>

            <div className="space-y-3 text-xs mb-6">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Mobile Money Transaction Reference / Receipt ID
                </label>
                <input
                  type="text"
                  value={payoutTxRef}
                  onChange={(e) => setPayoutTxRef(e.target.value)}
                  placeholder="e.g. MTN-MOMO-TX-998822"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Admin Notes (Optional)</label>
                <input
                  type="text"
                  value={payoutNotes}
                  onChange={(e) => setPayoutNotes(e.target.value)}
                  placeholder="Processed via MTN MoMo bulk disburser"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleProcessPayout('rejected')}
                className="px-4 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold"
              >
                Reject Payout
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedPayout(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleProcessPayout('paid')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-md"
                >
                  Confirm Disbursal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
