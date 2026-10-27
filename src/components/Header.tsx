import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  ShoppingCart,
  Heart,
  User,
  MapPin,
  Truck,
  ChevronDown,
  Menu,
  X,
  Laptop,
  Printer,
  Wifi,
  Smartphone,
  ShieldCheck,
  Settings,
  Store,
  Flame,
  Phone,
  HelpCircle,
  Tag,
  Headphones,
  SlidersHorizontal,
} from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { useShop } from '../context/ShopContext';
import { api } from '../services/api';
import { Category, Product } from '../types';
import { NotificationCenter } from './NotificationCenter';

export const Header: React.FC = () => {
  const {
    cartCount,
    cartSubtotal,
    setIsCartOpen,
    wishlist,
    user,
    isAdmin,
    isVendor,
    storeSettings,
    deliveryZones,
    selectedZone,
    setSelectedZone,
    setCurrentView,
    currentView,
    isPosAllowed,
    formatPrice,
  } = useShop();

  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [productSuggestions, setProductSuggestions] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isMobileSearchFocused, setIsMobileSearchFocused] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLocationMenuOpen, setIsLocationMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const mobileSearchContainerRef = useRef<HTMLDivElement>(null);

  // Popular e-commerce tech searches
  const popularSearches = [
    'HP EliteBook',
    'Dell Latitude',
    'ThinkPad',
    'Canon Printer',
    '4G MiFi Router',
    'POS Receipt Printer',
    'MacBook',
  ];

  // Load categories
  useEffect(() => {
    api.getCategories()
      .then(setCategories)
      .catch((err) => console.warn('Categories load error:', err));
  }, []);

  // Filter products on search query
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setProductSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await api.getProducts({
          search: searchQuery,
          limit: 6,
        });
        setProductSuggestions(res.products || []);
      } catch (err) {
        console.warn('Search suggestions error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside search containers
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
      if (mobileSearchContainerRef.current && !mobileSearchContainerRef.current.contains(e.target as Node)) {
        setIsMobileSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSearchFocused(false);
    setIsMobileSearchFocused(false);

    if (searchQuery.trim()) {
      setCurrentView('shop', { search: searchQuery.trim() });
    }
  };

  const handleSelectProduct = (product: Product) => {
    setIsSearchFocused(false);
    setIsMobileSearchFocused(false);
    setSearchQuery('');
    setCurrentView('product', { slug: product.slug, id: product.id });
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-slate-200/90 shadow-xs">
      {/* 1. MAIN HEADER BAR */}
      <div className="px-3 sm:px-6 py-2.5 sm:py-3 max-w-7xl mx-auto flex items-center justify-between gap-3 sm:gap-6">
        {/* Brand Logo & Mobile Menu Toggle */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-1.5 rounded-lg text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <BrandLogo
            inverted={false}
            size="md"
            customLogoUrl={storeSettings.logo_url}
            onClick={() => setCurrentView('home')}
          />
        </div>

        {/* 2. PRODUCT SEARCH BAR */}
        <div ref={searchContainerRef} className="relative flex-1 max-w-2xl hidden md:block">
          <form
            onSubmit={handleSearchSubmit}
            className="flex items-center border border-slate-300 hover:border-slate-400 focus-within:border-[#920d35] focus-within:ring-2 focus-within:ring-[#920d35]/20 rounded-xl overflow-hidden bg-slate-50/50 transition-all shadow-2xs"
          >
            <div className="pl-3.5 pr-2 text-slate-400">
              <Search className="w-4 h-4" />
            </div>

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              placeholder="Search laptops, smartphones, printers, accessories, networking..."
              className="w-full h-10 px-1 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 bg-transparent focus:outline-none font-normal"
            />

            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            <button
              type="submit"
              className="h-10 px-5 bg-[#920d35] hover:bg-[#770929] active:bg-[#600720] text-white font-bold text-xs uppercase tracking-wide transition-colors flex items-center justify-center cursor-pointer shrink-0"
            >
              Search
            </button>
          </form>

          {/* Autocomplete Dropdown */}
          {isSearchFocused && (
            <div className="absolute left-0 right-0 top-12 mt-1 bg-white rounded-xl shadow-xl border border-slate-200 text-slate-900 overflow-hidden z-50 animate-in fade-in-50 duration-150">
              {!searchQuery.trim() ? (
                <div className="p-3.5 bg-slate-50/80">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Popular Searches
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {popularSearches.map((term) => (
                      <button
                        key={term}
                        type="button"
                        onClick={() => {
                          setSearchQuery(term);
                          setIsSearchFocused(false);
                          setCurrentView('shop', { search: term });
                        }}
                        className="px-2.5 py-1 text-xs bg-white hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-200 transition-colors font-medium cursor-pointer"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
                  {isSearching ? (
                    <div className="p-4 text-center text-xs text-slate-500">
                      Searching catalog...
                    </div>
                  ) : productSuggestions.length > 0 ? (
                    <div className="p-2">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 mb-1">
                        Products ({productSuggestions.length})
                      </div>
                      {productSuggestions.map((prod) => (
                        <div
                          key={prod.id}
                          onClick={() => handleSelectProduct(prod)}
                          className="p-2 flex items-center gap-3 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
                        >
                          <img
                            src={prod.images?.[0]?.src || 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=100'}
                            alt={prod.name}
                            className="w-10 h-10 rounded-lg object-contain bg-slate-50 border border-slate-200 shrink-0 p-0.5"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-slate-900 truncate">{prod.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs font-bold text-[#920d35]">
                                {formatPrice(prod.price)}
                              </span>
                              {prod.brand && (
                                <span className="text-[10px] text-slate-400">· {prod.brand}</span>
                              )}
                            </div>
                          </div>
                          <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 shrink-0">
                            In Stock
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center">
                      <p className="text-xs text-slate-600 font-medium">
                        No direct match found for "{searchQuery}"
                      </p>
                      <button
                        onClick={handleSearchSubmit}
                        className="mt-2 text-xs font-bold text-[#920d35] hover:underline"
                      >
                        Search all products →
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 3. RIGHT ACTIONS */}
        <div className="flex items-center gap-2 sm:gap-3.5 shrink-0">
          {/* Deliver to Location Selector */}
          <div className="relative hidden xl:block">
            <button
              onClick={() => setIsLocationMenuOpen(!isLocationMenuOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-50/60 hover:bg-slate-100/70 text-left transition-colors text-xs cursor-pointer"
              title={`Delivery Zone: ${selectedZone?.name || 'Kampala'}`}
            >
              <MapPin className="w-4 h-4 text-[#920d35] shrink-0" />
              <div>
                <div className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Deliver to</div>
                <div className="font-semibold text-slate-800 line-clamp-1 max-w-[110px]">
                  {selectedZone?.name ? selectedZone.name.split('(')[0].trim() : 'Kampala'}
                </div>
              </div>
              <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
            </button>

            {isLocationMenuOpen && (
              <div className="absolute right-0 mt-1.5 w-80 max-h-[380px] overflow-y-auto bg-white rounded-xl shadow-xl border border-slate-200 p-2 text-slate-900 z-50">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1 mb-1 border-b border-slate-100 flex items-center justify-between">
                  <span>Select Delivery Hub</span>
                  <span className="text-[#920d35] font-semibold">Uganda Stations</span>
                </div>
                {deliveryZones.map((zone) => (
                  <button
                    key={zone.id}
                    onClick={() => {
                      setSelectedZone(zone);
                      setIsLocationMenuOpen(false);
                    }}
                    className={`w-full text-left p-2 rounded-lg text-xs transition-colors flex items-center justify-between cursor-pointer ${
                      selectedZone?.id === zone.id
                        ? 'bg-rose-50 text-[#920d35] font-bold border border-rose-200'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="pr-2">
                      <div className="font-semibold text-slate-800">{zone.name}</div>
                      <div className="text-[10px] text-slate-500">{zone.estimated_delivery}</div>
                      <div className="text-[10px] text-[#920d35] font-semibold">
                        Fee: {zone.fee === 0 ? 'FREE' : formatPrice(zone.fee)}
                      </div>
                    </div>
                    {selectedZone?.id === zone.id && <span className="text-[#920d35] font-bold text-sm">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* User Account Menu */}
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-1.5 p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer text-slate-700"
              aria-label="User account"
            >
              <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-xs font-bold text-[#920d35]">
                {user ? `${user.first_name?.[0] || 'U'}${user.last_name?.[0] || ''}` : <User className="w-4 h-4 text-slate-600" />}
              </div>
              <span className="hidden lg:inline text-xs font-semibold text-slate-800">
                {user ? (user.first_name || 'Account') : 'Account'}
              </span>
              <ChevronDown className="hidden lg:inline w-3 h-3 text-slate-400" />
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 text-slate-800 z-50 text-xs">
                {user ? (
                  <>
                    <div className="px-3 py-2 border-b border-slate-100">
                      <p className="font-bold text-slate-900">{user.first_name || 'Customer'} {user.last_name || ''}</p>
                      <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                    </div>
                    <button
                      onClick={() => {
                        setCurrentView('account', { tab: 'orders' });
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                    >
                      <Truck className="w-3.5 h-3.5 text-slate-500" />
                      <span>My Orders</span>
                    </button>
                    <button
                      onClick={() => {
                        setCurrentView('account', { tab: 'wishlist' });
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                    >
                      <Heart className="w-3.5 h-3.5 text-slate-500" />
                      <span>Wishlist ({wishlist.length})</span>
                    </button>
                    <div className="border-t border-slate-100 my-1" />
                    <button
                      onClick={() => {
                        setCurrentView('stores');
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 cursor-pointer text-slate-700"
                    >
                      <Store className="w-3.5 h-3.5 text-[#920d35]" />
                      <span>Verified Tech Stores</span>
                    </button>
                    {(isVendor || isAdmin) && (
                      <button
                        onClick={() => {
                          setCurrentView('vendor-dashboard');
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-[#920d35] font-bold hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                      >
                        <Store className="w-3.5 h-3.5" />
                        <span>Seller Center</span>
                      </button>
                    )}
                    {isPosAllowed && (
                      <button
                        onClick={() => {
                          setCurrentView('pos');
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-cyan-800 font-bold hover:bg-cyan-50 flex items-center gap-2 cursor-pointer"
                      >
                        <Store className="w-3.5 h-3.5 text-cyan-700" />
                        <span>POS Register</span>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setCurrentView('admin');
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-slate-800 font-bold hover:bg-slate-100 flex items-center gap-2 cursor-pointer"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      <span>Settings & Admin</span>
                    </button>
                  </>
                ) : (
                  <div className="p-3">
                    <p className="font-semibold text-slate-800 mb-2">Welcome to Cyber Dynamic Tech</p>
                    <button
                      onClick={() => {
                        setCurrentView('login');
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full py-2 bg-[#920d35] hover:bg-[#770929] text-white rounded-lg font-bold text-center mb-1.5 cursor-pointer shadow-xs transition-colors"
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => {
                        setCurrentView('register');
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-center cursor-pointer mb-2 transition-colors"
                    >
                      Create Account
                    </button>
                    <div className="border-t border-slate-100 pt-2 space-y-1">
                      <button
                        onClick={() => {
                          setCurrentView('stores');
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-md text-[11px] font-semibold flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200"
                      >
                        <Store className="w-3.5 h-3.5 text-[#920d35]" />
                        <span>Browse Verified Stores</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* In-App Notifications */}
          <NotificationCenter />

          {/* Wishlist Link */}
          <button
            onClick={() => setCurrentView('account', { tab: 'wishlist' })}
            className="hidden sm:flex relative p-2 rounded-lg text-slate-700 hover:text-[#920d35] hover:bg-slate-100 transition-colors cursor-pointer"
            title="Wishlist"
            aria-label="Wishlist"
          >
            <Heart className="w-5 h-5" />
            {wishlist.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#920d35] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {wishlist.length}
              </span>
            )}
          </button>

          {/* Cart Button */}
          <button
            id="header-cart-button"
            onClick={() => setIsCartOpen(true)}
            className="flex items-center gap-2 bg-[#0f172a] hover:bg-slate-800 text-white px-3 sm:px-4 py-2 rounded-xl transition-colors cursor-pointer shadow-xs border border-slate-800"
            aria-label="Open cart"
          >
            <div className="relative">
              <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#920d35] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold border-2 border-[#0f172a]">
                  {cartCount}
                </span>
              )}
            </div>
            <span className="hidden sm:inline font-bold text-xs whitespace-nowrap text-white">
              {formatPrice(cartSubtotal)}
            </span>
          </button>
        </div>
      </div>

      {/* 4. MOBILE SEARCH BAR (Visible on small screens) */}
      <div ref={mobileSearchContainerRef} className="px-3 pb-2.5 md:hidden">
        <form onSubmit={handleSearchSubmit} className="flex items-center border border-slate-300 rounded-xl overflow-hidden bg-slate-50/70 shadow-2xs">
          <div className="pl-3 pr-2 text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onFocus={() => setIsMobileSearchFocused(true)}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsMobileSearchFocused(true);
            }}
            placeholder="Search laptops, phones, printers..."
            className="flex-1 h-9 text-xs text-slate-900 placeholder:text-slate-400 bg-transparent focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="px-2 text-slate-400 hover:text-slate-600 text-xs"
            >
              ✕
            </button>
          )}
          <button
            type="submit"
            className="h-9 px-3.5 bg-[#920d35] text-white text-xs font-bold flex items-center justify-center cursor-pointer"
          >
            Go
          </button>
        </form>

        {/* Mobile Suggestions */}
        {isMobileSearchFocused && (
          <div className="absolute left-3 right-3 mt-1 bg-white rounded-xl shadow-xl border border-slate-200 text-slate-900 overflow-hidden z-50 max-h-72 overflow-y-auto">
            {!searchQuery.trim() ? (
              <div className="p-3 bg-slate-50">
                <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-2">
                  Trending Searches
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {popularSearches.slice(0, 5).map((term) => (
                    <button
                      key={term}
                      type="button"
                      onClick={() => {
                        setSearchQuery(term);
                        setIsMobileSearchFocused(false);
                        setCurrentView('shop', { search: term });
                      }}
                      className="px-2.5 py-1 text-xs bg-white border border-slate-200 text-slate-700 rounded-md font-medium"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {productSuggestions.map((prod) => (
                  <div
                    key={prod.id}
                    onClick={() => handleSelectProduct(prod)}
                    className="p-2.5 flex items-center gap-2.5 hover:bg-slate-50 cursor-pointer"
                  >
                    <img
                      src={prod.images?.[0]?.src || 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=100'}
                      alt={prod.name}
                      className="w-9 h-9 rounded-md object-contain border border-slate-200 shrink-0 bg-white p-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-900 line-clamp-1">{prod.name}</p>
                      <span className="text-xs font-bold text-[#920d35]">
                        {formatPrice(prod.price)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 5. CLEAN CATEGORY NAVIGATION RIBBON (Cyber Dynamic Tech) */}
      <nav className="bg-[#0f172a] text-white px-3 sm:px-6 py-2 hidden lg:block border-t border-slate-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs font-medium">
          <ul className="flex items-center gap-5 overflow-x-auto no-scrollbar">
            <li>
              <button
                onClick={() => setCurrentView('home')}
                className={`transition-colors py-1 cursor-pointer flex items-center gap-1.5 ${
                  currentView === 'home'
                    ? 'text-cyan-400 font-bold border-b-2 border-cyan-400'
                    : 'text-slate-200 hover:text-white'
                }`}
              >
                <span>Home</span>
              </button>
            </li>

            <li>
              <button
                onClick={() => setCurrentView('shop')}
                className={`transition-colors py-1 cursor-pointer flex items-center gap-1.5 ${
                  currentView === 'shop'
                    ? 'text-cyan-400 font-bold border-b-2 border-cyan-400'
                    : 'text-slate-200 hover:text-white'
                }`}
              >
                <span>All Products</span>
              </button>
            </li>

            <li>
              <button
                onClick={() => setCurrentView('category', { slug: 'laptops-computers', name: 'Laptops & Computers' })}
                className="text-slate-300 hover:text-white transition-colors py-1 cursor-pointer whitespace-nowrap"
              >
                Laptops & Computers
              </button>
            </li>

            <li>
              <button
                onClick={() => setCurrentView('category', { slug: 'smartphones-tablets', name: 'Smartphones & Tablets' })}
                className="text-slate-300 hover:text-white transition-colors py-1 cursor-pointer whitespace-nowrap"
              >
                Smartphones
              </button>
            </li>

            <li>
              <button
                onClick={() => setCurrentView('category', { slug: 'printers-office-equipment', name: 'Printers & Office' })}
                className="text-slate-300 hover:text-white transition-colors py-1 cursor-pointer whitespace-nowrap"
              >
                Printers & Office
              </button>
            </li>

            <li>
              <button
                onClick={() => setCurrentView('category', { slug: 'networking-security', name: 'Networking & Security' })}
                className="text-slate-300 hover:text-white transition-colors py-1 cursor-pointer whitespace-nowrap"
              >
                Networking
              </button>
            </li>

            <li>
              <button
                onClick={() => setCurrentView('shop', { flash_sale: true })}
                className="text-amber-400 hover:text-amber-300 transition-colors py-1 cursor-pointer whitespace-nowrap flex items-center gap-1 font-bold"
              >
                <Flame className="w-3.5 h-3.5 fill-amber-400" />
                <span>Daily Flash Deals</span>
              </button>
            </li>

            {isPosAllowed && (
              <li>
                <button
                  onClick={() => setCurrentView('pos')}
                  className="px-2 py-0.5 rounded bg-cyan-900/60 hover:bg-cyan-900 text-cyan-300 border border-cyan-700/60 font-semibold flex items-center gap-1 cursor-pointer whitespace-nowrap transition-colors"
                >
                  <Store className="w-3.5 h-3.5" />
                  <span>POS Terminal</span>
                </button>
              </li>
            )}
          </ul>

          <div className="flex items-center gap-4 shrink-0 text-[11px] text-slate-300">
            <button
              onClick={() => setCurrentView('stores')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Verified Stores
            </button>
            <span className="text-slate-600">|</span>
            <button
              onClick={() => setCurrentView('vendor-register')}
              className="text-rose-300 hover:text-white font-bold transition-colors cursor-pointer"
            >
              Sell on CDT
            </button>
            <span className="text-slate-600">|</span>
            <a href="tel:+256779743101" className="text-slate-300 hover:text-white flex items-center gap-1">
              <Phone className="w-3 h-3 text-cyan-400" />
              <span>0779 743 101</span>
            </a>
          </div>
        </div>
      </nav>

      {/* 6. MOBILE DRAWER MENU */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex">
          <div className="w-4/5 max-w-sm bg-white h-full overflow-y-auto flex flex-col p-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <BrandLogo size="sm" onClick={() => { setCurrentView('home'); setIsMobileMenuOpen(false); }} />
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Hardware Shop Categories */}
            <div className="py-3 space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-1.5">
                Marketplace Categories
              </p>
              <button
                onClick={() => {
                  setCurrentView('shop');
                  setIsMobileMenuOpen(false);
                }}
                className="w-full text-left py-2 px-3 rounded-lg font-bold text-slate-900 hover:bg-slate-50 text-xs flex items-center justify-between"
              >
                <span>All Products</span>
                <span className="text-[10px] text-slate-400">View Catalog</span>
              </button>
              {categories.slice(0, 8).map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setCurrentView('category', { slug: cat.slug, name: cat.name });
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full text-left py-2 px-3 rounded-lg font-medium text-slate-700 hover:bg-slate-50 flex items-center justify-between text-xs"
                >
                  <span>{cat.name}</span>
                  {cat.count ? <span className="text-[10px] text-slate-400">({cat.count})</span> : null}
                </button>
              ))}
            </div>

            {/* Quick Links */}
            <div className="mt-auto pt-4 border-t border-slate-200 space-y-2 text-xs">
              <button
                onClick={() => {
                  setCurrentView('shop', { flash_sale: true });
                  setIsMobileMenuOpen(false);
                }}
                className="w-full text-left py-2 px-3 rounded-lg bg-amber-50 text-amber-900 font-bold flex items-center gap-2 border border-amber-200"
              >
                <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span>Today's Flash Deals</span>
              </button>

              {isPosAllowed && (
                <button
                  onClick={() => {
                    setCurrentView('pos');
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full text-left py-2 px-3 rounded-lg bg-slate-900 font-bold text-white flex items-center gap-2 cursor-pointer"
                >
                  <Store className="w-4 h-4 text-cyan-400" />
                  <span>Launch POS Register</span>
                </button>
              )}

              <button
                onClick={() => {
                  setCurrentView('stores');
                  setIsMobileMenuOpen(false);
                }}
                className="w-full text-left py-2 px-3 rounded-lg bg-slate-50 font-semibold text-slate-800 flex items-center gap-2 border border-slate-200"
              >
                <Store className="w-4 h-4 text-[#920d35]" />
                <span>Verified Tech Stores</span>
              </button>

              <button
                onClick={() => {
                  setCurrentView('vendor-register');
                  setIsMobileMenuOpen(false);
                }}
                className="w-full text-left py-2 px-3 rounded-lg bg-rose-50 font-bold text-[#920d35] flex items-center gap-2 border border-rose-200"
              >
                <Tag className="w-4 h-4 text-[#920d35]" />
                <span>Sell on Cyber Dynamic Tech</span>
              </button>

              <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                <p className="font-semibold text-slate-700">Need help with an order?</p>
                <p>Hotline: <a href="tel:+256779743101" className="text-[#920d35] font-bold">+256 779 743 101</a></p>
                <p className="text-[10px] text-slate-400 mt-1">Kampala, Wakiso & Nationwide Delivery</p>
              </div>
            </div>
          </div>
          <div className="flex-1" onClick={() => setIsMobileMenuOpen(false)} />
        </div>
      )}
    </header>
  );
};
