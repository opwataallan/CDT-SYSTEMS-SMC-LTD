import React from 'react';
import {
  TrendingUp,
  Package,
  Clock,
  Store,
  RefreshCw,
  Sliders,
  ShieldCheck,
  Building2,
  Users,
  ExternalLink,
  DollarSign,
  ShoppingCart,
  Activity,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { CustomerOrder } from '../../types';
import { useShop } from '../../context/ShopContext';
import { AdminAnalyticsDashboard } from './AdminAnalyticsDashboard';

interface AdminOverviewTabProps {
  orders: CustomerOrder[];
  onNavigateTab: (tab: any) => void;
  onSyncWooCommerce: () => Promise<void>;
  isSyncing: boolean;
  wcStatus: any;
}

export const AdminOverviewTab: React.FC<AdminOverviewTabProps> = ({
  orders,
  onNavigateTab,
  onSyncWooCommerce,
  isSyncing,
  wcStatus,
}) => {
  const { user, setCurrentView } = useShop();

  const safeOrders = Array.isArray(orders) ? orders : [];
  const pendingPaymentOrders = safeOrders.filter(
    (o) => o?.payment_details?.status === 'awaiting_confirmation' || o?.status === 'pending_payment'
  );

  return (
    <div className="space-y-5">
      {/* 1. Welcome Executive Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white rounded-2xl p-5 sm:p-6 border border-slate-800 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-cyan-500/10 to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {user?.role === 'admin' ? 'Super Administrator' : 'Store Manager'}
              </span>
              <span className="text-xs text-slate-400">
                Cyber Dynamic Technologies • Central Store Hub
              </span>
            </div>
            <h1 className="text-lg sm:text-2xl font-black tracking-tight text-white">
              Welcome back, {user?.first_name || 'Administrator'}!
            </h1>
            <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
              Real-time administrative operations, Ugandan Mobile Money order confirmations, in-store point-of-sale management, and remote WooCommerce catalog sync.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setCurrentView('pos')}
              className="h-9 px-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-sm hover:shadow-md"
            >
              <Store className="w-4 h-4" />
              <span>Launch In-Store POS</span>
            </button>

            <button
              onClick={onSyncWooCommerce}
              disabled={isSyncing}
              className="h-9 px-3.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#007f19] ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Catalog'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Urgent Attention Alert (Pending Payments) */}
      {pendingPaymentOrders.length > 0 && (
        <div className="bg-amber-50 border-2 border-amber-300/80 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs sm:text-sm font-black text-amber-950">
                  {pendingPaymentOrders.length} Order{pendingPaymentOrders.length > 1 ? 's' : ''} Awaiting Mobile Money Verification
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-200 text-amber-900">
                  Action Required
                </span>
              </div>
              <p className="text-xs text-amber-900 mt-0.5">
                Customers have placed orders awaiting verification on <strong>0394760459 (OPWATA ALLAN SAMUEL)</strong>. Verify and confirm to dispatch.
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('orders')}
            className="h-9 px-4 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs whitespace-nowrap self-start sm:self-auto"
          >
            <span>Review Pending Orders</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 3. Fast Quick Actions Grid (Touch-friendly & Desktop-ready) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        <button
          onClick={() => onNavigateTab('orders')}
          className="bg-white hover:bg-slate-50 border border-slate-200 p-3.5 rounded-xl shadow-2xs text-left transition-all cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
            <Package className="w-4 h-4" />
          </div>
          <div className="text-xs font-black text-slate-900">Orders & Dispatch</div>
          <div className="text-[11px] text-slate-500 mt-0.5 flex items-center justify-between">
            <span>{safeOrders.length} total orders</span>
            <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-slate-700 transition-colors" />
          </div>
        </button>

        <button
          onClick={() => setCurrentView('pos')}
          className="bg-white hover:bg-slate-50 border border-slate-200 p-3.5 rounded-xl shadow-2xs text-left transition-all cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#007f19] flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
            <Store className="w-4 h-4" />
          </div>
          <div className="text-xs font-black text-slate-900">POS Register</div>
          <div className="text-[11px] text-slate-500 mt-0.5 flex items-center justify-between">
            <span>Counter sales & receipts</span>
            <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-slate-700 transition-colors" />
          </div>
        </button>

        <button
          onClick={() => onNavigateTab('settings')}
          className="bg-white hover:bg-slate-50 border border-slate-200 p-3.5 rounded-xl shadow-2xs text-left transition-all cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
            <Sliders className="w-4 h-4" />
          </div>
          <div className="text-xs font-black text-slate-900">31 Settings</div>
          <div className="text-[11px] text-slate-500 mt-0.5 flex items-center justify-between">
            <span>Store configurations</span>
            <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-slate-700 transition-colors" />
          </div>
        </button>

        <button
          onClick={() => onNavigateTab('users')}
          className="bg-white hover:bg-slate-50 border border-slate-200 p-3.5 rounded-xl shadow-2xs text-left transition-all cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
            <Users className="w-4 h-4" />
          </div>
          <div className="text-xs font-black text-slate-900">Users & Staff RBAC</div>
          <div className="text-[11px] text-slate-500 mt-0.5 flex items-center justify-between">
            <span>Manage permissions</span>
            <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-slate-700 transition-colors" />
          </div>
        </button>
      </div>

      {/* 4. Deep Telemetry & Sales Charts */}
      <AdminAnalyticsDashboard />
    </div>
  );
};
