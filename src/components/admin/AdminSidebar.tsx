import React from 'react';
import {
  TrendingUp,
  Package,
  Store,
  Sliders,
  Home,
  Truck,
  Building2,
  Users,
  ShieldCheck,
  RefreshCw,
  Eye,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Server,
} from 'lucide-react';
import { useShop } from '../../context/ShopContext';

export type AdminTab =
  | 'overview'
  | 'analytics'
  | 'marketplace'
  | 'orders'
  | 'settings'
  | 'homepage'
  | 'users'
  | 'audit'
  | 'woocommerce'
  | 'delivery'
  | 'store';

interface AdminSidebarProps {
  activeTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  pendingPaymentCount: number;
  ordersCount: number;
  wcConnected: boolean;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeTab,
  onSelectTab,
  isCollapsed,
  onToggleCollapse,
  pendingPaymentCount,
  ordersCount,
  wcConnected,
}) => {
  const { user, logoutUser, setCurrentView } = useShop();

  const isOverviewActive = activeTab === 'overview' || activeTab === 'analytics';

  const navGroups = [
    {
      label: 'Core Operations',
      items: [
        {
          id: 'overview' as AdminTab,
          label: 'Overview & Sales',
          icon: TrendingUp,
          active: isOverviewActive,
        },
        {
          id: 'marketplace' as AdminTab,
          label: 'Marketplace & Vendors',
          icon: Store,
          active: activeTab === 'marketplace',
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
      label: 'Store Configuration',
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
          label: 'Delivery Zones',
          icon: Truck,
          active: activeTab === 'delivery',
        },
        {
          id: 'store' as AdminTab,
          label: 'Showroom & HQ',
          icon: Building2,
          active: activeTab === 'store',
        },
      ],
    },
    {
      label: 'System & Security',
      items: [
        {
          id: 'users' as AdminTab,
          label: 'Users & RBAC',
          icon: Users,
          active: activeTab === 'users',
        },
        {
          id: 'audit' as AdminTab,
          label: 'Security Audit Logs',
          icon: ShieldCheck,
          active: activeTab === 'audit',
        },
        {
          id: 'woocommerce' as AdminTab,
          label: 'WooCommerce Host',
          icon: Server,
          active: activeTab === 'woocommerce',
          badge: wcConnected ? 'Live' : 'Local',
          badgeColor: wcConnected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400',
        },
      ],
    },
  ];

  return (
    <aside
      className={`hidden lg:flex flex-col bg-slate-900 border-r border-slate-800 text-white transition-all duration-200 z-30 select-none ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* 1. Brand Header */}
      <div className="h-16 px-4 border-b border-slate-800/80 flex items-center justify-between">
        <div className={`flex items-center gap-3 overflow-hidden ${isCollapsed ? 'justify-center w-full' : ''}`}>
          <div className="w-9 h-9 rounded-xl bg-[#920d35] flex items-center justify-center font-black text-white shrink-0 shadow-sm shadow-[#920d35]/30">
            <span className="text-sm tracking-tighter">CDT</span>
          </div>

          {!isCollapsed && (
            <div className="truncate">
              <div className="font-black text-xs tracking-tight text-white flex items-center gap-1.5">
                <span>Cyber Dynamic</span>
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                Admin Operations
              </div>
            </div>
          )}
        </div>

        {!isCollapsed && (
          <button
            onClick={onToggleCollapse}
            className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Collapse Sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 2. Navigation Items List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-5 no-scrollbar">
        {navGroups.map((group, idx) => (
          <div key={idx} className="space-y-1">
            {!isCollapsed && (
              <div className="px-3 text-[10px] font-black uppercase tracking-wider text-slate-400">
                {group.label}
              </div>
            )}

            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    title={isCollapsed ? item.label : undefined}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer group ${
                      item.active
                        ? 'bg-gradient-to-r from-[#920d35] to-[#700a28] text-white shadow-xs'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    } ${isCollapsed ? 'justify-center px-0' : ''}`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-105 ${
                        item.active ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                      }`}
                    />

                    {!isCollapsed && (
                      <div className="flex-1 flex items-center justify-between truncate">
                        <span className="truncate">{item.label}</span>
                        {item.badge && (
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-black whitespace-nowrap uppercase ${item.badgeColor}`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* In-Store POS & Storefront shortcuts */}
        <div className="pt-2 border-t border-slate-800/80 space-y-1">
          {!isCollapsed && (
            <div className="px-3 text-[10px] font-black uppercase tracking-wider text-slate-400">
              Quick Portals
            </div>
          )}

          <button
            onClick={() => setCurrentView('pos')}
            title={isCollapsed ? 'Launch POS Register' : undefined}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-cyan-300 hover:bg-cyan-950/40 hover:text-cyan-200 transition-all cursor-pointer ${
              isCollapsed ? 'justify-center px-0' : ''
            }`}
          >
            <Store className="w-4 h-4 shrink-0 text-cyan-400" />
            {!isCollapsed && <span className="truncate">In-Store POS Register</span>}
          </button>

          <button
            onClick={() => setCurrentView('shop')}
            title={isCollapsed ? 'View Storefront' : undefined}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition-all cursor-pointer ${
              isCollapsed ? 'justify-center px-0' : ''
            }`}
          >
            <Eye className="w-4 h-4 shrink-0 text-slate-400" />
            {!isCollapsed && <span className="truncate">Storefront Preview</span>}
          </button>
        </div>
      </div>

      {/* 3. Footer: Active Admin & Expand Button */}
      <div className="p-3 border-t border-slate-800/80 space-y-2">
        {isCollapsed ? (
          <button
            onClick={onToggleCollapse}
            className="w-full h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
            title="Expand Sidebar"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <div className="p-2.5 rounded-xl bg-slate-850 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-black text-xs shrink-0">
                {user?.first_name?.charAt(0) || 'A'}
              </div>
              <div className="truncate">
                <div className="font-bold text-xs text-white truncate">
                  {user?.first_name} {user?.last_name}
                </div>
                <div className="text-[10px] text-slate-400 uppercase font-mono">
                  {user?.role}
                </div>
              </div>
            </div>

            <button
              onClick={logoutUser}
              className="p-1.5 rounded-lg hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
