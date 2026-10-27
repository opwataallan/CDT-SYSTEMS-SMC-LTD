import React from 'react';
import {
  TrendingUp,
  Package,
  Sliders,
  Store,
  Menu,
  X,
  Home,
  Truck,
  Building2,
  Users,
  ShieldCheck,
  Server,
  Eye,
  LogOut,
  ChevronRight,
  Clock,
  Boxes,
} from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { AdminTab } from './AdminSidebar';

interface AdminMobileNavProps {
  activeTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  isOpen: boolean;
  onClose: () => void;
  pendingPaymentCount: number;
  ordersCount: number;
  wcConnected: boolean;
}

export const AdminMobileNav: React.FC<AdminMobileNavProps> = ({
  activeTab,
  onSelectTab,
  isOpen,
  onClose,
  pendingPaymentCount,
  ordersCount,
  wcConnected,
}) => {
  const { user, logoutUser, setCurrentView } = useShop();

  const isOverviewActive = activeTab === 'overview' || activeTab === 'analytics';

  const allNavItems = [
    {
      group: 'Core Operations',
      items: [
        {
          id: 'overview' as AdminTab,
          label: 'Executive Overview & Sales',
          icon: TrendingUp,
          active: isOverviewActive,
        },
        {
          id: 'products' as AdminTab,
          label: 'Products & Catalog',
          icon: Boxes,
          active: activeTab === 'products',
        },
        {
          id: 'orders' as AdminTab,
          label: 'Orders & Dispatch',
          icon: Package,
          active: activeTab === 'orders',
          badge: pendingPaymentCount > 0 ? `${pendingPaymentCount} urgent` : `${ordersCount}`,
          badgeColor: pendingPaymentCount > 0 ? 'bg-amber-500 text-white animate-pulse' : 'bg-slate-700 text-slate-300',
        },
      ],
    },
    {
      group: 'Store Management',
      items: [
        {
          id: 'settings' as AdminTab,
          label: '31 Settings Center',
          icon: Sliders,
          active: activeTab === 'settings',
        },
        {
          id: 'homepage' as AdminTab,
          label: 'Homepage Builder',
          icon: Home,
          active: activeTab === 'homepage',
        },
        {
          id: 'delivery' as AdminTab,
          label: 'Regional Delivery Zones',
          icon: Truck,
          active: activeTab === 'delivery',
        },
        {
          id: 'store' as AdminTab,
          label: 'Headquarters & Showroom',
          icon: Building2,
          active: activeTab === 'store',
        },
      ],
    },
    {
      group: 'System & Security',
      items: [
        {
          id: 'users' as AdminTab,
          label: 'Users & Staff RBAC',
          icon: Users,
          active: activeTab === 'users',
        },
        {
          id: 'audit' as AdminTab,
          label: 'Security & Audit Logs',
          icon: ShieldCheck,
          active: activeTab === 'audit',
        },
        {
          id: 'woocommerce' as AdminTab,
          label: 'WooCommerce REST Host',
          icon: Server,
          active: activeTab === 'woocommerce',
          badge: wcConnected ? 'Live' : 'Local',
          badgeColor: wcConnected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400',
        },
      ],
    },
  ];

  return (
    <>
      {/* 1. SLIDE-OVER MOBILE DRAWER (< lg) */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity animate-in fade-in"
          />

          {/* Drawer Panel */}
          <div className="relative w-4/5 max-w-xs bg-slate-900 border-r border-slate-800 text-white flex flex-col h-full z-10 shadow-2xl animate-in slide-in-from-left duration-200">
            {/* Drawer Header */}
            <div className="h-16 px-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#920d35] flex items-center justify-center font-black text-white text-xs">
                  CDT
                </div>
                <div>
                  <div className="font-black text-xs text-white">Cyber Dynamic</div>
                  <div className="text-[10px] text-slate-400 font-mono">Admin Navigation</div>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Current Admin Card */}
            <div className="p-3 bg-slate-850 border-b border-slate-800 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-black text-xs">
                {user?.first_name?.charAt(0) || 'A'}
              </div>
              <div className="truncate flex-1">
                <div className="font-bold text-xs text-white truncate">
                  {user?.first_name} {user?.last_name}
                </div>
                <div className="text-[10px] text-slate-400 uppercase font-mono">
                  {user?.role} • {user?.email}
                </div>
              </div>
            </div>

            {/* Nav Items List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-4 no-scrollbar">
              {allNavItems.map((grp, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="px-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    {grp.group}
                  </div>

                  <div className="space-y-1">
                    {grp.items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            onSelectTab(item.id);
                            onClose();
                          }}
                          className={`w-full flex items-center justify-between px-3 py-3 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                            item.active
                              ? 'bg-[#920d35] text-white shadow-xs'
                              : 'text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className="w-4 h-4 text-slate-400" />
                            <span>{item.label}</span>
                          </div>

                          {item.badge && (
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-black uppercase ${item.badgeColor}`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Quick Actions */}
              <div className="pt-2 border-t border-slate-800 space-y-1.5">
                <div className="px-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Quick Access
                </div>

                <button
                  onClick={() => {
                    setCurrentView('pos');
                    onClose();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-cyan-300 hover:bg-cyan-950/40 cursor-pointer"
                >
                  <Store className="w-4 h-4 text-cyan-400" />
                  <span>Launch In-Store POS</span>
                </button>

                <button
                  onClick={() => {
                    setCurrentView('shop');
                    onClose();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:bg-slate-800 cursor-pointer"
                >
                  <Eye className="w-4 h-4 text-slate-400" />
                  <span>View Public Storefront</span>
                </button>
              </div>
            </div>

            {/* Logout Footer */}
            <div className="p-3 border-t border-slate-800">
              <button
                onClick={() => {
                  logoutUser();
                  onClose();
                }}
                className="w-full h-10 px-3 rounded-xl bg-slate-800 hover:bg-rose-950/50 hover:text-rose-300 text-slate-300 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out of Admin</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. STICKY MOBILE BOTTOM BAR (< lg) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/98 backdrop-blur-md border-t border-slate-800 flex justify-around items-center px-1 py-1.5 shadow-2xl safe-area-inset-bottom">
        {/* Overview Tab */}
        <button
          onClick={() => onSelectTab('overview')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
            isOverviewActive ? 'text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className={`p-1 rounded-lg ${isOverviewActive ? 'bg-[#920d35] text-white shadow-xs' : ''}`}>
            <TrendingUp className="w-4 h-4" />
          </div>
          <span className="mt-0.5">Overview</span>
        </button>

        {/* Orders Tab (with badge) */}
        <button
          onClick={() => onSelectTab('orders')}
          className={`relative flex flex-col items-center justify-center py-1 px-2 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
            activeTab === 'orders' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className={`p-1 rounded-lg ${activeTab === 'orders' ? 'bg-[#920d35] text-white shadow-xs' : ''}`}>
            <Package className="w-4 h-4" />
          </div>
          <span className="mt-0.5">Orders</span>

          {pendingPaymentCount > 0 && (
            <span className="absolute top-0.5 right-1 w-4 h-4 rounded-full bg-amber-500 text-white text-[9px] font-black flex items-center justify-center shadow-xs animate-pulse">
              {pendingPaymentCount}
            </span>
          )}
        </button>

        {/* Settings Tab */}
        <button
          onClick={() => onSelectTab('settings')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
            activeTab === 'settings' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className={`p-1 rounded-lg ${activeTab === 'settings' ? 'bg-[#920d35] text-white shadow-xs' : ''}`}>
            <Sliders className="w-4 h-4" />
          </div>
          <span className="mt-0.5">Settings</span>
        </button>

        {/* POS Tab */}
        <button
          onClick={() => setCurrentView('pos')}
          className="flex flex-col items-center justify-center py-1 px-2 rounded-lg text-[10px] font-bold text-cyan-400 hover:text-cyan-300 transition-all cursor-pointer"
        >
          <div className="p-1 rounded-lg bg-cyan-950/60 border border-cyan-500/30 text-cyan-300">
            <Store className="w-4 h-4" />
          </div>
          <span className="mt-0.5">POS</span>
        </button>

        {/* Menu / More Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            const event = new CustomEvent('open-admin-drawer');
            window.dispatchEvent(event);
          }}
          className="flex flex-col items-center justify-center py-1 px-2 rounded-lg text-[10px] font-bold text-slate-400 hover:text-white transition-all cursor-pointer"
        >
          <div className="p-1 rounded-lg">
            <Menu className="w-4 h-4" />
          </div>
          <span className="mt-0.5">Menu</span>
        </button>
      </nav>
    </>
  );
};
