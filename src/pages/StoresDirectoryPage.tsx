import React, { useState, useEffect } from 'react';
import { useShop } from '../context/ShopContext';
import { api } from '../services/api';
import { Store } from '../types';
import {
  Store as StoreIcon,
  Search,
  MapPin,
  Star,
  ShieldCheck,
  Package,
  ArrowRight,
  TrendingUp,
  Phone,
  Truck,
  CheckCircle2,
} from 'lucide-react';

export const StoresDirectoryPage: React.FC = () => {
  const { setCurrentView, formatPrice } = useShop();
  const [stores, setStores] = useState<Array<Partial<Store> & { product_count: number }>>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const UGANDA_DISTRICTS = [
    'Kampala Central',
    'Nakawa',
    'Wakiso',
    'Mukono',
    'Jinja',
    'Mbarara',
    'Gulu',
    'Mbale',
    'Arua',
    'Kumi',
  ];

  const CATEGORIES = [
    'Laptops',
    'Smartphones',
    'Networking',
    'Accessories',
    'Solar & Power',
    'Gaming',
    'Security',
  ];

  useEffect(() => {
    loadStores();
  }, [selectedDistrict, selectedCategory]);

  const loadStores = async () => {
    setLoading(true);
    try {
      const res = await api.getPublicStores({
        district: selectedDistrict !== 'all' ? selectedDistrict : undefined,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        search: searchQuery.trim() || undefined,
      });
      if (res && res.stores) {
        setStores(res.stores);
      }
    } catch (err) {
      console.warn('Failed to load stores:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadStores();
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-[#920d35] to-slate-950 p-8 sm:p-12 text-white shadow-xl mb-10">
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-cyan-300 text-xs font-semibold mb-4 border border-white/10">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Uganda Multi-Vendor Electronics Marketplace</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-4">
              Explore Verified Tech Stores & Vendors in Uganda
            </h1>
            <p className="text-slate-200 text-base sm:text-lg mb-6 leading-relaxed">
              Discover verified hardware suppliers, gaming gear specialists, certified solar inverter distributors, and laptop retailers across Kampala, Jinja, and Uganda. All orders protected by Cyber Dynamic Tech delivery guarantee.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setCurrentView('vendor-register')}
                className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-6 py-3 rounded-xl shadow-lg transition-all text-sm"
              >
                <TrendingUp className="w-4 h-4" />
                <span>Become a Vendor / Sell with Us</span>
              </button>
              <button
                onClick={() => setCurrentView('shop')}
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-5 py-3 rounded-xl backdrop-blur-md transition-all text-sm border border-white/20"
              >
                <span>Browse All Products</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-15 pointer-events-none hidden lg:block">
            <StoreIcon className="w-full h-full text-white p-12" />
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6 mb-8">
          <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search stores by name, specialty, or city..."
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#920d35] focus:border-transparent text-sm"
              />
            </div>

            <div className="flex flex-wrap sm:flex-nowrap gap-3">
              {/* District Filter */}
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#920d35]"
              >
                <option value="all">All Uganda Districts</option>
                {UGANDA_DISTRICTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>

              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#920d35]"
              >
                <option value="all">All Categories</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <button
                type="submit"
                className="bg-[#920d35] hover:bg-[#770929] text-white px-5 py-2.5 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-1.5"
              >
                <span>Filter</span>
              </button>
            </div>
          </form>
        </div>

        {/* Stores Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-slate-200 border-t-[#920d35] rounded-full animate-spin mb-4" />
            <p className="text-slate-500 font-medium text-sm">Loading verified Ugandan stores...</p>
          </div>
        ) : stores.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center max-w-lg mx-auto">
            <StoreIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-800 mb-1">No Stores Found</h3>
            <p className="text-sm text-slate-500 mb-6">
              No registered stores match your active search filters. Try clearing filters or register a store in this district.
            </p>
            <button
              onClick={() => {
                setSelectedDistrict('all');
                setSelectedCategory('all');
                setSearchQuery('');
              }}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold px-4 py-2 rounded-lg text-sm transition-all"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stores.map((store) => {
              const isMain = Boolean(store.is_platform_store);
              return (
                <div
                  key={store.id}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col group"
                >
                  {/* Banner Image */}
                  <div className="relative h-36 bg-slate-800 overflow-hidden">
                    <img
                      src={store.banner_url || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1000&q=80'}
                      alt={store.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />

                    {isMain ? (
                      <span className="absolute top-3 left-3 bg-[#920d35] text-white text-[11px] font-bold px-2.5 py-1 rounded-md shadow-sm border border-white/20 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        Main Platform Store
                      </span>
                    ) : (
                      <span className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md text-emerald-400 text-[11px] font-semibold px-2.5 py-1 rounded-md border border-slate-700 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-400" />
                        Verified Vendor
                      </span>
                    )}

                    <div className="absolute bottom-2 right-3 text-white text-xs font-semibold flex items-center gap-1 bg-black/50 px-2 py-0.5 rounded backdrop-blur-sm">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <span>{store.rating?.toFixed(1) || '5.0'}</span>
                      <span className="text-slate-300">({store.rating_count || 0})</span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex items-start gap-3.5 -mt-10 mb-3 relative z-10">
                      <div className="w-16 h-16 rounded-xl border-2 border-white shadow-md bg-white p-1 overflow-hidden shrink-0">
                        <img
                          src={store.logo_url || '/logo.png'}
                          alt={store.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      </div>
                      <div className="pt-7 min-w-0 flex-1">
                        <h2 className="font-bold text-slate-900 text-lg leading-tight truncate group-hover:text-[#920d35] transition-colors">
                          {store.name}
                        </h2>
                        <div className="flex items-center gap-1 text-slate-500 text-xs mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{store.district}, {store.city}</span>
                        </div>
                      </div>
                    </div>

                    <p className="text-slate-600 text-xs line-clamp-2 mb-4 leading-relaxed flex-1">
                      {store.description}
                    </p>

                    {/* Categories Badges */}
                    {store.product_categories && store.product_categories.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {store.product_categories.slice(0, 3).map((cat) => (
                          <span
                            key={cat}
                            className="bg-slate-100 text-slate-700 text-[11px] font-medium px-2 py-0.5 rounded"
                          >
                            {cat}
                          </span>
                        ))}
                        {store.product_categories.length > 3 && (
                          <span className="text-slate-400 text-[10px] self-center">
                            +{store.product_categories.length - 3} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Stats Strip */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 mb-4">
                      <div className="flex items-center gap-1">
                        <Package className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-semibold text-slate-700">{store.product_count}</span> products
                      </div>
                      <div className="flex items-center gap-1">
                        <Truck className="w-3.5 h-3.5 text-slate-400" />
                        <span>{store.delivery_settings?.estimated_days || 'Uganda delivery'}</span>
                      </div>
                    </div>

                    {/* Visit Store Button */}
                    <button
                      onClick={() => setCurrentView('storefront', { slug: store.slug })}
                      className="w-full py-2.5 px-4 bg-slate-900 hover:bg-[#920d35] text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
                    >
                      <span>Visit Storefront</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Vendor Call to Action Banner */}
        <div className="mt-16 bg-white border border-slate-200 rounded-2xl p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-1 text-[#920d35] font-bold text-xs uppercase tracking-wider mb-2">
              <CheckCircle2 className="w-4 h-4 text-[#920d35]" />
              Sell on Cyber Dynamic Tech
            </span>
            <h3 className="text-2xl font-extrabold text-slate-900 mb-2">
              Own an Electronics or Tech Business in Uganda?
            </h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Reach thousands of shoppers looking for laptops, phones, gaming equipment, and electronics across Uganda. Receive automatic Mobile Money (MTN MoMo / Airtel Money) payouts with isolated seller tools.
            </p>
          </div>
          <button
            onClick={() => setCurrentView('vendor-register')}
            className="bg-[#920d35] hover:bg-[#770929] text-white font-bold px-7 py-3.5 rounded-xl shadow-lg hover:shadow-xl transition-all text-sm shrink-0 whitespace-nowrap"
          >
            Register Your Store Now
          </button>
        </div>
      </div>
    </div>
  );
};
