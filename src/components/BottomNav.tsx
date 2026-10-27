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
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-1 pt-1 pb-[max(6px,calc(env(safe-area-inset-bottom,0px)+4px))] shadow-lg print:hidden touch-manipulation"
    >
      <div className="grid grid-cols-5 items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={item.action}
              className={`flex flex-col items-center justify-center min-h-[48px] py-1 px-1 rounded-lg transition-all cursor-pointer relative touch-manipulation ${
                item.isActive
                  ? 'text-[#920d35] font-bold'
                  : 'text-slate-500 hover:text-slate-900 font-medium active:scale-95'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${item.isActive ? 'scale-110 stroke-[2.25]' : 'stroke-[1.75]'}`} />
                {item.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-2.5 bg-[#920d35] text-white text-[9px] font-black min-w-[17px] h-[17px] rounded-full flex items-center justify-center px-1 border-2 border-white shadow-2xs">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] mt-1 tracking-tight line-clamp-1 ${item.isActive ? 'font-bold text-[#920d35]' : 'text-slate-500'}`}>
                {item.label}
              </span>
              {item.isActive && (
                <span className="w-1 h-1 rounded-full bg-[#920d35] mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
