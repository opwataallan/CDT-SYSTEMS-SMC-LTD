import React from 'react';
import { Home, Grid, ShoppingCart, Truck, User } from 'lucide-react';
import { useShop } from '../context/ShopContext';

export const BottomNav: React.FC = () => {
  const { currentView, setCurrentView, cartCount, setIsCartOpen, user } = useShop();

  const navItems = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
      action: () => setCurrentView('home'),
      isActive: currentView === 'home',
    },
    {
      id: 'shop',
      label: 'Catalog',
      icon: Grid,
      action: () => setCurrentView('shop'),
      isActive: currentView === 'shop' || currentView === 'category',
    },
    {
      id: 'track',
      label: 'Track',
      icon: Truck,
      action: () => setCurrentView('track-order'),
      isActive: currentView === 'track-order',
    },
    {
      id: 'cart',
      label: 'Cart',
      icon: ShoppingCart,
      action: () => setIsCartOpen(true),
      badge: cartCount > 0 ? cartCount : undefined,
      isActive: false,
    },
    {
      id: 'account',
      label: user ? user.first_name : 'Account',
      icon: User,
      action: () => setCurrentView('account'),
      isActive: currentView === 'account' || currentView === 'login' || currentView === 'register',
    },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-1 py-1 pb-[calc(4px+env(safe-area-inset-bottom,0px))] shadow-lg"
    >
      <div className="grid grid-cols-5 items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={item.action}
              className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-md transition-colors cursor-pointer relative ${
                item.isActive
                  ? 'text-cyan-600 font-bold'
                  : 'text-slate-600 hover:text-slate-900 font-medium'
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {item.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-2 bg-orange-500 text-white text-[9px] font-bold min-w-[16px] h-4 rounded-full flex items-center justify-center px-1 border border-white">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight line-clamp-1">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
