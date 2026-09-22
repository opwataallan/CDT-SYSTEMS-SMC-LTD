import React from 'react';
import {
  Menu,
  Search,
  Store,
  RefreshCw,
  Eye,
  LogOut,
  Bell,
  Clock,
  ShieldCheck,
  ExternalLink,
  ChevronRight,
  Activity,
} from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { AdminTab } from './AdminSidebar';

interface AdminTopHeaderProps {
  activeTab: AdminTab;
  onOpenMobileMenu: () => void;
  pendingPaymentCount: number;
  wcStatus: any;
  onSyncWooCommerce: () => Promise<void>;
  isSyncing: boolean;
}

export const AdminTopHeader: React.FC<AdminTopHeaderProps> = ({
  activeTab,
  onOpenMobileMenu,
  pendingPaymentCount,
  wcStatus,
  onSyncWooCommerce,
  isSyncing,
}) => {
  const { user, logoutUser, setCurrentView } = useShop();

  const getTabTitle = (tab: AdminTab) => {
    switch (tab) {
      case 'overview':
      case 'analytics':
        return 'Executive Overview & Sales Analytics';
      case 'orders':
        return 'Orders & Regional Dispatch';
      case 'settings':
        return '31-Category Store Settings Center';
      case 'homepage':
        return 'Homepage Builder & Banners';
      case 'users':
        return 'Users & Staff RBAC Permissions';
      case 'audit':
        return 'Security & Audit Logs';
      case 'woocommerce':
        return 'WooCommerce REST Diagnostics';
      case 'delivery':
        return 'Regional Delivery Zones & Rates';
      case 'store':
        return 'Headquarters & Showroom Information';
      default:
        return 'Admin Portal';
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-3.5 sm:px-6 flex items-center justify-between sticky top-0 z-20 shadow-2xs">
      {/* Left: Mobile Drawer Trigger + Breadcrumb */}
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger Button */}
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
          aria-label="Open Admin Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Mobile Brand Logo & Title */}
        <div className="lg:hidden flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#920d35] flex items-center justify-center font-black text-white text-xs">
            CDT
          </div>
          <div>
            <div className="font-black text-xs text-slate-900 tracking-tight leading-none">
              Cyber Dynamic
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
              Admin Portal
            </div>
          </div>
        </div>

        {/* Desktop Breadcrumb */}
        <div className="hidden lg:flex items-center gap-2 text-xs">
          <span className="font-bold text-slate-400">Admin</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="font-black text-slate-900 text-sm tracking-tight">
            {getTabTitle(activeTab)}
          </span>
        </div>
      </div>

      {/* Right: Telemetry, Quick Actions & Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* WooCommerce Live Status Badge (Desktop) */}
        <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs">
          <span
            className={`w-2 h-2 rounded-full ${
              wcStatus?.connected ? 'bg-[#007f19] animate-pulse' : 'bg-amber-500'
            }`}
          />
          <span className="font-bold text-slate-700 text-[11px]">
            {wcStatus?.connected ? 'WooCommerce Live' : 'Local Fallback'}
          </span>
          {wcStatus?.latency_ms && (
            <span className="text-[10px] text-slate-400 font-mono">
              ({wcStatus.latency_ms}ms)
            </span>
          )}
        </div>

        {/* Pending Orders Counter Alert */}
        {pendingPaymentCount > 0 && (
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-300 text-amber-900 rounded-lg text-xs font-bold animate-pulse"
            title={`${pendingPaymentCount} order(s) awaiting payment confirmation`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>{pendingPaymentCount} Pending</span>
          </div>
        )}

        {/* Quick Sync WooCommerce Button (Desktop & Mobile) */}
        <button
          onClick={onSyncWooCommerce}
          disabled={isSyncing}
          className="h-9 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
          title="Synchronize remote catalog with WooCommerce"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#007f19] ${isSyncing ? 'animate-spin' : ''}`} />
          <span className="hidden md:inline">{isSyncing ? 'Syncing...' : 'Sync Catalog'}</span>
        </button>

        {/* In-Store POS Quick Launcher */}
        <button
          onClick={() => setCurrentView('pos')}
          className="h-9 px-3.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
          title="Launch Counter Register"
        >
          <Store className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Launch POS</span>
        </button>

        {/* View Storefront Link */}
        <button
          onClick={() => setCurrentView('shop')}
          className="h-9 px-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
          title="Open Customer Storefront"
        >
          <Eye className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Storefront</span>
        </button>

        {/* Admin Avatar & Role (Desktop) */}
        <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-xl bg-slate-900 text-white font-black text-xs flex items-center justify-center">
            {user?.first_name?.charAt(0) || 'A'}
          </div>
          <button
            onClick={logoutUser}
            className="p-2 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
            title="Log out of Admin"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
