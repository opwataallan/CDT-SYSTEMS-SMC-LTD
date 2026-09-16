import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  ShoppingCart,
  Heart,
  User,
  MapPin,
  Phone,
  Truck,
  ShieldCheck,
  ChevronDown,
  Menu,
  X,
  Clock,
  Sparkles,
  ExternalLink,
  Laptop,
  Printer,
  Wifi,
  Smartphone,
  Tv,
  MousePointer,
  HelpCircle,
  Settings,
  Palette,
  Store,
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
    storeSettings,
    deliveryZones,
    selectedZone,
    setSelectedZone,
    setCurrentView,
    currentView,
    isPosAllowed,
  } = useShop();

  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isMobileSearchFocused, setIsMobileSearchFocused] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLocationMenuOpen, setIsLocationMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const mobileSearchContainerRef = useRef<HTMLDivElement>(null);

  // Popular searches
  const popularSearches = ['HP Laptops', 'Epson EcoTank L3210', 'MTN Wakanet MiFi', 'Samsung A17', 'POS Thermal Printer', 'Barcode Scanner'];

  // Load categories
  useEffect(() => {
    api.getCategories()
      .then(setCategories)
      .catch((err) => console.warn('Categories load error:', err));
  }, []);

  // Debounced search suggestions
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await api.getProducts({
          search: searchQuery,
          category: selectedCategory !== 'all' ? selectedCategory : undefined,
          limit: 6,
        });
        setSearchSuggestions(res.products);
      } catch (err) {
        console.warn('Search suggestions error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory]);

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
    setCurrentView('shop', {
      search: searchQuery,
      category: selectedCategory !== 'all' ? selectedCategory : undefined,
    });
  };

  const handleSelectSuggestion = (product: Product) => {
    setIsSearchFocused(false);
    setIsMobileSearchFocused(false);
    setSearchQuery('');
    setCurrentView('product', { slug: product.slug, id: product.id });
  };

  const categoryIcons: Record<string, any> = {
    'laptops-computers': Laptop,
    'printers-photocopiers': Printer,
    'networking-mifi': Wifi,
    'phones-tablets': Smartphone,
    'monitors-displays': Tv,
    'accessories-peripherals': MousePointer,
  };

  return (
    <header className="sticky top-0 z-40 w-full shadow-xs">
      {/* 2. MAIN HEADER (High Density Clean White + Cyan Border Search) */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 sm:gap-6">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
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

          {/* Large Marketplace Search Bar with Cyan High-Density Container */}
          <div ref={searchContainerRef} className="relative flex-1 max-w-2xl hidden md:block">
            <form
              onSubmit={handleSearchSubmit}
              className="flex items-center border-2 border-cyan-500 rounded-md overflow-hidden bg-white shadow-2xs"
            >
              {/* Category Dropdown inside search */}
              <div className="relative border-r border-slate-200 hidden lg:block bg-slate-50">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="h-10 pl-3 pr-7 text-xs font-bold text-slate-600 bg-transparent focus:outline-hidden cursor-pointer appearance-none"
                >
                  <option value="all">All</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.slug}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-3.5 pointer-events-none" />
              </div>

              {/* Text Input */}
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  placeholder="Search for laptops, smartphones, networking, printers..."
                  className="w-full h-10 px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Search Submit Button (High Density Cyan) */}
              <button
                type="submit"
                id="header-search-btn"
                className="h-10 px-7 bg-cyan-500 hover:bg-cyan-600 text-white font-bold flex items-center justify-center gap-1.5 transition-colors uppercase text-xs tracking-wider cursor-pointer"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Search</span>
              </button>
            </form>

            {/* Live Search Autocomplete Dropdown */}
            {isSearchFocused && (
              <div className="absolute left-0 right-0 top-11 mt-1 bg-white rounded-lg shadow-xl border border-slate-200 text-slate-900 overflow-hidden z-50 animate-in fade-in-50 duration-150">
                {/* Popular Keywords if query empty */}
                {!searchQuery.trim() ? (
                  <div className="p-3.5">
                    <div className="flex items-center gap-1.5 text-[11px] font-black uppercase text-slate-400 tracking-widest mb-2">
                      <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                      <span>Popular Searches in Uganda</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {popularSearches.map((term) => (
                        <button
                          key={term}
                          onClick={() => {
                            setSearchQuery(term);
                            setCurrentView('shop', { search: term });
                            setIsSearchFocused(false);
                          }}
                          className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-cyan-50 hover:text-cyan-600 text-slate-700 rounded transition-colors font-medium cursor-pointer"
                        >
                          {term}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    {isSearching ? (
                      <div className="p-4 text-center text-xs text-slate-500">Searching catalog...</div>
                    ) : searchSuggestions.length > 0 ? (
                      <div className="divide-y divide-slate-100">
                        <div className="p-2.5 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                          <span>Products matching "{searchQuery}"</span>
                          <span className="text-cyan-600 font-semibold">{searchSuggestions.length} found</span>
                        </div>
                        {searchSuggestions.map((prod) => (
                          <div
                            key={prod.id}
                            onClick={() => handleSelectSuggestion(prod)}
                            className="p-2.5 flex items-center gap-3 hover:bg-slate-50 cursor-pointer transition-colors"
                          >
                            <img
                              src={prod.images[0]?.src}
                              alt={prod.name}
                              className="w-10 h-10 rounded object-cover border border-slate-200 flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-slate-800 line-clamp-1">{prod.name}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs font-black text-cyan-600 whitespace-nowrap">
                                  UGX {prod.price.toLocaleString()}
                                </span>
                                {prod.regular_price > prod.price && (
                                  <span className="text-[10px] text-slate-400 line-through whitespace-nowrap">
                                    UGX {prod.regular_price.toLocaleString()}
                                  </span>
                                )}
                                <span className="text-[10px] font-medium text-slate-400">
                                  ({prod.brand})
                                </span>
                              </div>
                            </div>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-50 text-cyan-600 font-bold border border-cyan-100">
                              In Stock
                            </span>
                          </div>
                        ))}
                        <button
                          onClick={handleSearchSubmit}
                          className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-xs font-bold text-cyan-600 text-center"
                        >
                          View all results for "{searchQuery}" →
                        </button>
                      </div>
                    ) : (
                      <div className="p-5 text-center">
                        <p className="text-xs text-slate-600 font-medium">
                          No matching products found for "{searchQuery}"
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Try searching for HP, Lenovo, Epson, MiFi, or Barcode
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Utilities: Location + Account + Wishlist + Cart (High Density) */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Delivery District Selector */}
            <div className="relative hidden xl:block">
              <button
                onClick={() => setIsLocationMenuOpen(!isLocationMenuOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-left transition-colors text-xs cursor-pointer"
                title={`Selected Delivery Area: ${selectedZone.name}`}
              >
                <MapPin className="w-3.5 h-3.5 text-cyan-600 flex-shrink-0" />
                <div>
                  <div className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Deliver to</div>
                  <div className="font-bold text-slate-800 line-clamp-1 max-w-[120px]">
                    {selectedZone.name.includes('(')
                      ? selectedZone.name.split('(')[0].trim()
                      : selectedZone.name.split('—')[0].trim()}
                  </div>
                </div>
                <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
              </button>

              {isLocationMenuOpen && (
                <div className="absolute right-0 mt-1 w-80 max-h-[380px] overflow-y-auto bg-white rounded-lg shadow-xl border border-slate-200 p-2 text-slate-900 z-50">
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-2 py-1 mb-1 border-b border-slate-100 flex items-center justify-between">
                    <span>Select Kampala Delivery Area</span>
                    <span className="text-cyan-600 font-bold">Kampala, UG</span>
                  </div>
                  {deliveryZones.map((zone) => (
                    <button
                      key={zone.id}
                      onClick={() => {
                        setSelectedZone(zone);
                        setIsLocationMenuOpen(false);
                      }}
                      className={`w-full text-left p-2 rounded-md text-xs transition-colors flex items-center justify-between cursor-pointer ${
                        selectedZone.id === zone.id
                          ? 'bg-cyan-50 text-cyan-700 font-bold border border-cyan-200'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="pr-2">
                        <div className="font-bold text-slate-800">{zone.name}</div>
                        <div className="text-[10px] text-slate-500 font-normal mt-0.5">
                          {zone.estimated_delivery}
                        </div>
                        <div className="text-[10px] text-cyan-700 font-semibold">
                          Fee: {zone.fee === 0 ? 'FREE' : `UGX ${zone.fee.toLocaleString()}`}
                          {zone.free_threshold && zone.fee > 0 && (
                            <span className="text-slate-400 font-normal ml-1">
                              (Free over UGX {zone.free_threshold.toLocaleString()})
                            </span>
                          )}
                        </div>
                      </div>
                      {selectedZone.id === zone.id && <span className="text-cyan-600 font-bold text-sm flex-shrink-0">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Account dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex flex-col items-center cursor-pointer group"
              >
                <div className="w-6 h-6 border-2 border-slate-400 group-hover:border-cyan-500 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-700 transition-colors">
                  {user ? `${user.first_name[0] || 'U'}${user.last_name[0] || ''}` : 'JD'}
                </div>
                <span className="text-[10px] mt-0.5 font-medium text-slate-600 group-hover:text-cyan-600 transition-colors">
                  {user ? user.first_name : 'Account'}
                </span>
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-lg shadow-xl border border-slate-200 py-1.5 text-slate-800 z-50 text-xs">
                  {user ? (
                    <>
                      <div className="px-3 py-2 border-b border-slate-100">
                        <p className="font-bold text-slate-900">{user.first_name} {user.last_name}</p>
                        <p className="text-[11px] text-slate-500">{user.email}</p>
                      </div>
                      <button
                        onClick={() => {
                          setCurrentView('account', { tab: 'orders' });
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <Truck className="w-3.5 h-3.5 text-slate-500" />
                        <span>My Orders</span>
                      </button>
                      <button
                        onClick={() => {
                          setCurrentView('account', { tab: 'wishlist' });
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <Heart className="w-3.5 h-3.5 text-slate-500" />
                        <span>Wishlist ({wishlist.length})</span>
                      </button>
                      <div className="border-t border-slate-100 my-1" />
                      {isPosAllowed && (
                        <button
                          onClick={() => {
                            setCurrentView('pos');
                            setIsUserMenuOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 text-cyan-700 font-bold hover:bg-cyan-50 flex items-center gap-2 cursor-pointer"
                        >
                          <Store className="w-3.5 h-3.5 text-cyan-600" />
                          <span>POS Counter Register</span>
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setCurrentView('admin');
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-cyan-600 font-bold hover:bg-cyan-50 flex items-center gap-2"
                      >
                        <Settings className="w-3.5 h-3.5" />
                        <span>Store Management & Settings</span>
                      </button>
                    </>
                  ) : (
                    <div className="p-3">
                      <p className="font-bold text-slate-800 mb-2">Access your tech account</p>
                      <button
                        onClick={() => {
                          setCurrentView('login');
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full py-1.5 bg-cyan-500 hover:bg-cyan-600 text-white rounded font-bold text-center mb-1.5 cursor-pointer"
                      >
                        Sign In
                      </button>
                      <button
                        onClick={() => {
                          setCurrentView('register');
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-bold text-center cursor-pointer"
                      >
                        Create Account
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* In-App Notifications & Store Alerts Center */}
            <NotificationCenter />

            {/* Wishlist Button (With Orange High-Density Counter) - Hidden on mobile */}
            <div
              id="header-wishlist-button"
              className="hidden md:block relative cursor-pointer"
              onClick={() => setCurrentView('account', { tab: 'wishlist' })}
              title="View Wishlist"
            >
              <div className="w-6 h-6 flex items-center justify-center text-slate-700 hover:text-cyan-600 transition-colors">
                <Heart className="w-5 h-5" />
              </div>
              {wishlist.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {wishlist.length}
                </span>
              )}
            </div>

            {/* Cart Button (High Density Slate-100 Pill with Bold UGX) */}
            <div
              id="header-cart-button"
              onClick={() => setIsCartOpen(true)}
              className="flex items-center gap-1.5 sm:gap-2 bg-slate-100 hover:bg-slate-200 px-2.5 sm:px-3 py-2 rounded-lg cursor-pointer transition-colors border border-slate-200 text-slate-800 shrink-0"
            >
              <div className="relative">
                <ShoppingCart className="w-5 h-5 text-slate-700" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2.5 bg-orange-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                    {cartCount}
                  </span>
                )}
              </div>
              <span className="hidden sm:inline font-bold text-xs md:text-sm text-slate-900 whitespace-nowrap">
                UGX {cartSubtotal > 0 ? cartSubtotal.toLocaleString() : '0'}
              </span>
            </div>
          </div>
        </div>

        {/* Mobile Search Bar Row */}
        <div ref={mobileSearchContainerRef} className="mt-2.5 md:hidden relative">
          <form onSubmit={handleSearchSubmit} className="flex items-center border-2 border-cyan-500 rounded-lg overflow-hidden bg-white shadow-2xs">
            <input
              type="text"
              value={searchQuery}
              onFocus={() => setIsMobileSearchFocused(true)}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsMobileSearchFocused(true);
              }}
              placeholder="Search laptops, printers, MiFi..."
              className="flex-1 h-9 px-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden"
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
              className="h-9 px-3.5 bg-cyan-500 text-white flex items-center justify-center cursor-pointer"
            >
              <Search className="w-4 h-4" />
            </button>
          </form>

          {/* Mobile Live Autocomplete Dropdown */}
          {isMobileSearchFocused && (
            <div className="absolute left-0 right-0 top-10.5 mt-1 bg-white rounded-lg shadow-xl border border-slate-200 text-slate-900 overflow-hidden z-50 animate-in fade-in-50 duration-150 max-h-80 overflow-y-auto">
              {!searchQuery.trim() ? (
                <div className="p-3">
                  <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">
                    <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                    <span>Popular Searches</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {popularSearches.map((term) => (
                      <button
                        key={term}
                        type="button"
                        onClick={() => {
                          setSearchQuery(term);
                          setCurrentView('shop', { search: term });
                          setIsMobileSearchFocused(false);
                        }}
                        className="px-2.5 py-1 text-xs bg-slate-100 text-slate-700 rounded font-medium"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  {isSearching ? (
                    <div className="p-4 text-center text-xs text-slate-500">Searching catalog...</div>
                  ) : searchSuggestions.length > 0 ? (
                    <div className="divide-y divide-slate-100">
                      {searchSuggestions.map((prod) => (
                        <div
                          key={prod.id}
                          onClick={() => handleSelectSuggestion(prod)}
                          className="p-2 flex items-center gap-2.5 hover:bg-slate-50 cursor-pointer"
                        >
                          <img
                            src={prod.images[0]?.src}
                            alt={prod.name}
                            className="w-9 h-9 rounded object-cover border border-slate-200 flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-800 line-clamp-1">{prod.name}</p>
                            <span className="text-xs font-black text-cyan-600 whitespace-nowrap">
                              UGX {prod.price.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={handleSearchSubmit}
                        className="w-full py-2 bg-slate-100 text-xs font-bold text-cyan-600 text-center"
                      >
                        View all results for "{searchQuery}" →
                      </button>
                    </div>
                  ) : (
                    <div className="p-4 text-center text-xs text-slate-500">
                      No matching products found for "{searchQuery}"
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 3. CATEGORY NAVIGATION BAR (High Density Typography & Orange Flash Sale) */}
      <nav className="bg-white border-b border-slate-200 px-4 sm:px-6 py-2 shadow-2xs hidden lg:block">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <ul className="flex items-center gap-8 text-[12px] font-bold uppercase tracking-wide text-slate-600 overflow-x-auto no-scrollbar">
            <li>
              <button
                onClick={() => setCurrentView('shop')}
                className={`cursor-pointer transition-colors pb-0.5 ${
                  currentView === 'shop' && !selectedCategory
                    ? 'text-cyan-600 border-b-2 border-cyan-600'
                    : 'hover:text-cyan-600'
                }`}
              >
                All Products
              </button>
            </li>

            {categories.slice(0, 7).map((cat) => (
              <li key={cat.id}>
                <button
                  onClick={() => setCurrentView('category', { slug: cat.slug, name: cat.name })}
                  className={`cursor-pointer transition-colors pb-0.5 whitespace-nowrap ${
                    currentView === 'category' && selectedCategory === cat.slug
                      ? 'text-cyan-600 border-b-2 border-cyan-600'
                      : 'hover:text-cyan-600'
                  }`}
                >
                  {cat.name}
                </button>
              </li>
            ))}

            {isPosAllowed && (
              <li>
                <button
                  onClick={() => setCurrentView('pos')}
                  className="px-2.5 py-1 rounded bg-cyan-50 hover:bg-cyan-100 text-cyan-700 hover:text-cyan-900 border border-cyan-200 font-extrabold flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors"
                  title="Open in-store checkout terminal"
                >
                  <Store className="w-3.5 h-3.5 text-cyan-600" />
                  <span>POS Terminal</span>
                </button>
              </li>
            )}

            <li className="ml-auto">
              <button
                onClick={() => setCurrentView('shop', { flash_sale: true })}
                className="text-orange-500 hover:text-orange-600 font-black flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <Sparkles className="w-3.5 h-3.5 fill-orange-500" />
                <span>Flash Sales</span>
              </button>
            </li>
          </ul>
        </div>
      </nav>

      {/* 4. MOBILE DRAWER MENU */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex">
          <div className="w-4/5 max-w-sm bg-white h-full overflow-y-auto flex flex-col p-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <BrandLogo size="sm" onClick={() => { setCurrentView('home'); setIsMobileMenuOpen(false); }} />
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1 text-slate-500 hover:text-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Categories */}
            <div className="py-4 space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Shop Categories</p>
              <button
                onClick={() => {
                  setCurrentView('shop');
                  setIsMobileMenuOpen(false);
                }}
                className="w-full text-left py-2 px-3 rounded-lg font-bold text-cyan-600 bg-cyan-50 text-xs"
              >
                All Products
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setCurrentView('category', { slug: cat.slug, name: cat.name });
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full text-left py-2 px-3 rounded-lg font-medium text-slate-700 hover:bg-slate-50 flex items-center justify-between text-xs"
                >
                  <span>{cat.name}</span>
                  <span className="text-[10px] text-slate-400">({cat.count})</span>
                </button>
              ))}
            </div>

            {/* Quick Links */}
            <div className="mt-auto pt-4 border-t border-slate-200 space-y-2 text-xs">
              {isPosAllowed && (
                <button
                  onClick={() => {
                    setCurrentView('pos');
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full text-left py-2 px-3 rounded-lg bg-cyan-50 border border-cyan-200 font-bold text-cyan-800 flex items-center gap-2 cursor-pointer"
                >
                  <Store className="w-4 h-4 text-cyan-600" />
                  <span>Launch POS Register</span>
                </button>
              )}
              <button
                onClick={() => {
                  setCurrentView('track-order');
                  setIsMobileMenuOpen(false);
                }}
                className="w-full text-left py-2 px-3 rounded-lg bg-slate-100 font-semibold text-slate-800 flex items-center gap-2"
              >
                <Truck className="w-4 h-4 text-cyan-600" />
                <span>Track My Order</span>
              </button>
              <button
                onClick={() => {
                  setCurrentView('admin');
                  setIsMobileMenuOpen(false);
                }}
                className="w-full text-left py-2 px-3 rounded-lg bg-slate-900 font-bold text-cyan-400 flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                <span>Store Settings</span>
              </button>
              <div className="text-[10px] text-slate-500 pt-2">
                <p>Hotline: {storeSettings.phone}</p>
                <p>Kampala, Wakiso & Nationwide Delivery</p>
              </div>
            </div>
          </div>
          <div className="flex-1" onClick={() => setIsMobileMenuOpen(false)} />
        </div>
      )}
    </header>
  );
};
