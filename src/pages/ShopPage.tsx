import React, { useState, useEffect } from 'react';
import { Filter, X, SlidersHorizontal, ChevronDown, Search, Check } from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { ProductCardSkeleton } from '../components/ProductCardSkeleton';
import { CdtPageLoader } from '../components/CdtPageLoader';
import { useShop } from '../context/ShopContext';
import { api } from '../services/api';
import { Product, Category } from '../types';

interface ShopPageProps {
  initialCategory?: string;
  initialSearch?: string;
  initialFlashSale?: boolean;
}

export const ShopPage: React.FC<ShopPageProps> = ({
  initialCategory,
  initialSearch = '',
  initialFlashSale = false,
}) => {
  const { setCurrentView, stores } = useShop();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [search, setSearch] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || 'all');
  const [selectedVendor, setSelectedVendor] = useState<string>('all');
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<{ min?: number; max?: number }>({});
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [onlyFlashSale, setOnlyFlashSale] = useState(initialFlashSale);
  const [sortBy, setSortBy] = useState('popularity');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Mobile filters drawer
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Available brands in store
  const availableBrands = ['HP', 'Lenovo', 'Epson', 'MTN', 'Samsung', 'Dell', 'Rongta', 'Hikvision', 'SanDisk', 'TP-Link'];

  // Load categories
  useEffect(() => {
    api.getCategories().then(setCategories).catch(console.error);
  }, []);

  // Sync props if changed
  useEffect(() => {
    if (initialCategory) setSelectedCategory(initialCategory);
    if (initialSearch) setSearch(initialSearch);
    if (initialFlashSale !== undefined) setOnlyFlashSale(initialFlashSale);
  }, [initialCategory, initialSearch, initialFlashSale]);

  // Fetch products matching filters
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api.getProducts({
        search: search.trim() || undefined,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        vendor: selectedVendor !== 'all' ? selectedVendor : undefined,
        brand: selectedBrands.length > 0 ? selectedBrands.join(',') : undefined,
        flash_sale: onlyFlashSale ? true : undefined,
        stock_status: onlyInStock ? 'instock' : undefined,
        min_price: priceRange.min,
        max_price: priceRange.max,
        sort: sortBy,
        page,
        limit: 18,
      });
      setProducts(res.products);
      setTotalPages(res.totalPages || 1);
      setTotalCount(res.total || 0);
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, selectedVendor, selectedBrands, priceRange, onlyInStock, onlyFlashSale, sortBy, page, search]);

  const toggleBrand = (brand: string) => {
    setPage(1);
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
    );
  };

  const handlePricePreset = (min?: number, max?: number) => {
    setPage(1);
    setPriceRange({ min, max });
  };

  const clearAllFilters = () => {
    setSearch('');
    setSelectedCategory('all');
    setSelectedVendor('all');
    setSelectedBrands([]);
    setPriceRange({});
    setOnlyInStock(false);
    setOnlyFlashSale(false);
    setSortBy('popularity');
    setPage(1);
  };

  const hasActiveFilters =
    search ||
    selectedCategory !== 'all' ||
    selectedVendor !== 'all' ||
    selectedBrands.length > 0 ||
    priceRange.min !== undefined ||
    priceRange.max !== undefined ||
    onlyInStock ||
    onlyFlashSale;

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6">
      {/* 1. TOP BREADCRUMB & HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-0.5">
            <button onClick={() => setCurrentView('home')} className="hover:text-cyan-600 transition-colors">
              Home
            </button>
            <span>/</span>
            <span className="font-semibold text-slate-800">
              {selectedCategory !== 'all'
                ? categories.find((c) => c.slug === selectedCategory)?.name || 'Category'
                : 'Marketplace Catalog'}
            </span>
          </div>
          <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight uppercase">
            {selectedCategory !== 'all'
              ? categories.find((c) => c.slug === selectedCategory)?.name
              : 'All Computer & ICT Hardware'}
          </h1>
          <p className="text-[11px] text-slate-500">
            Showing <span className="font-bold text-slate-800">{totalCount}</span> verified products in Uganda (UGX)
          </p>
        </div>

        {/* Sorting Dropdown & Mobile Filter Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMobileFiltersOpen(true)}
            className="lg:hidden px-3 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Filter className="w-3.5 h-3.5 text-cyan-600" />
            <span>Filters {hasActiveFilters && '(Active)'}</span>
          </button>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-semibold hidden sm:inline text-[11px]">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
              className="h-8 px-2.5 pr-7 rounded border border-slate-200 bg-white font-bold text-slate-800 focus:outline-hidden focus:border-cyan-500 cursor-pointer text-xs"
            >
              <option value="popularity">Popularity & Best Selling</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating">Highest Customer Rating</option>
              <option value="newest">Newest Arrivals</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. ACTIVE FILTERS CHIP BAR */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-1.5 py-2.5 border-b border-slate-200 text-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mr-1">Active Filters:</span>
          {search && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-medium text-xs">
              Keyword: "{search}"
              <X className="w-3 h-3 cursor-pointer hover:text-red-500" onClick={() => setSearch('')} />
            </span>
          )}
          {selectedCategory !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-50 text-cyan-700 border border-cyan-200 font-bold text-xs">
              Category: {categories.find((c) => c.slug === selectedCategory)?.name}
              <X className="w-3 h-3 cursor-pointer hover:text-red-500" onClick={() => setSelectedCategory('all')} />
            </span>
          )}
          {selectedVendor !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-50 text-[#920d35] border border-rose-200 font-bold text-xs">
              Store: {stores.find((s) => s.id === selectedVendor || s.slug === selectedVendor)?.name || selectedVendor}
              <X className="w-3 h-3 cursor-pointer hover:text-red-500" onClick={() => setSelectedVendor('all')} />
            </span>
          )}
          {selectedBrands.map((b) => (
            <span key={b} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-medium text-xs">
              Brand: {b}
              <X className="w-3 h-3 cursor-pointer hover:text-red-500" onClick={() => toggleBrand(b)} />
            </span>
          ))}
          {onlyFlashSale && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-orange-100 text-orange-800 font-bold text-xs">
              ⚡ Flash Deals Only
              <X className="w-3 h-3 cursor-pointer hover:text-red-500" onClick={() => setOnlyFlashSale(false)} />
            </span>
          )}
          {onlyInStock && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-bold text-xs">
              In-Stock Only
              <X className="w-3 h-3 cursor-pointer hover:text-red-500" onClick={() => setOnlyInStock(false)} />
            </span>
          )}
          <button
            onClick={clearAllFilters}
            className="text-cyan-600 hover:underline font-bold text-xs ml-2 cursor-pointer"
          >
            Clear All
          </button>
        </div>
      )}

      {/* 3. MAIN CATALOG GRID & SIDEBAR */}
      {/* Mobile Horizontal Quick-Category Scroll Strip */}
      <div className="lg:hidden flex items-center gap-1.5 overflow-x-auto pt-2 pb-1 no-scrollbar -mx-4 px-4">
        <button
          onClick={() => {
            setSelectedCategory('all');
            setPage(1);
          }}
          className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
            selectedCategory === 'all'
              ? 'bg-cyan-500 text-white shadow-2xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          All Items
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => {
              setSelectedCategory(cat.slug);
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
              selectedCategory === cat.slug
                ? 'bg-cyan-500 text-white shadow-2xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {cat.name} ({cat.count})
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 pt-2 lg:pt-4">
        {/* Desktop Filters Sidebar (High Density) */}
        <aside className="hidden lg:block space-y-3">
          {/* Categories */}
          <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs space-y-2">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Categories</h3>
            <div className="space-y-0.5">
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setPage(1);
                }}
                className={`w-full text-left px-2 py-1.5 rounded text-xs transition-colors flex items-center justify-between cursor-pointer ${
                  selectedCategory === 'all' ? 'bg-cyan-50 font-bold text-cyan-600' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>All Products</span>
                <span className="text-[10px] text-slate-400">{products.length}</span>
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.slug);
                    setPage(1);
                  }}
                  className={`w-full text-left px-2 py-1.5 rounded text-xs transition-colors flex items-center justify-between cursor-pointer ${
                    selectedCategory === cat.slug
                      ? 'bg-cyan-50 font-bold text-cyan-600'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="line-clamp-1">{cat.name}</span>
                  <span className="text-[10px] text-slate-400">({cat.count})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Filter: In Stock & Flash Sales */}
          <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs space-y-2">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Availability & Deals</h3>
            <div className="space-y-2 text-xs">
              <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={onlyInStock}
                  onChange={(e) => setOnlyInStock(e.target.checked)}
                  className="rounded text-cyan-600 focus:ring-0"
                />
                <span>In Stock (Ready in Kampala)</span>
              </label>

              <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={onlyFlashSale}
                  onChange={(e) => setOnlyFlashSale(e.target.checked)}
                  className="rounded text-orange-500 focus:ring-0"
                />
                <span className="text-orange-600 font-bold">⚡ Flash Sales & Deals</span>
              </label>
            </div>
          </div>

          {/* Price Range Presets */}
          <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs space-y-2">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Price in UGX</h3>
            <div className="space-y-0.5 text-xs">
              <button
                onClick={() => handlePricePreset(undefined, 200000)}
                className={`w-full text-left px-2 py-1 rounded transition-colors cursor-pointer ${
                  priceRange.max === 200000 ? 'bg-cyan-50 font-bold text-cyan-600' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                Under UGX 200,000
              </button>
              <button
                onClick={() => handlePricePreset(200000, 600000)}
                className={`w-full text-left px-2 py-1 rounded transition-colors cursor-pointer ${
                  priceRange.min === 200000 && priceRange.max === 600000
                    ? 'bg-cyan-50 font-bold text-cyan-600'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                UGX 200,000 - 600,000
              </button>
              <button
                onClick={() => handlePricePreset(600000, 1500000)}
                className={`w-full text-left px-2 py-1 rounded transition-colors cursor-pointer ${
                  priceRange.min === 600000 && priceRange.max === 1500000
                    ? 'bg-cyan-50 font-bold text-cyan-600'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                UGX 600,000 - 1,500,000
              </button>
              <button
                onClick={() => handlePricePreset(1500000, undefined)}
                className={`w-full text-left px-2 py-1 rounded transition-colors cursor-pointer ${
                  priceRange.min === 1500000 ? 'bg-cyan-50 font-bold text-cyan-600' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                Over UGX 1,500,000
              </button>
            </div>
          </div>

          {/* Brands Filter */}
          <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs space-y-2">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Brands</h3>
            <div className="space-y-1 text-xs max-h-48 overflow-y-auto pr-1">
              {availableBrands.map((brand) => (
                <label
                  key={brand}
                  className="flex items-center justify-between text-slate-700 hover:text-slate-900 cursor-pointer py-0.5"
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedBrands.includes(brand)}
                      onChange={() => toggleBrand(brand)}
                      className="rounded text-cyan-600 focus:ring-0"
                    />
                    <span>{brand}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Marketplace Stores & Vendors Filter */}
          <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Verified Stores</h3>
              <button
                type="button"
                onClick={() => setCurrentView('stores')}
                className="text-[10px] text-[#920d35] font-bold hover:underline"
              >
                All Stores →
              </button>
            </div>
            <div className="space-y-1 text-xs max-h-48 overflow-y-auto pr-1">
              <label className="flex items-center gap-2 text-slate-700 hover:text-slate-900 cursor-pointer py-0.5 font-medium">
                <input
                  type="radio"
                  name="store_filter_desktop"
                  checked={selectedVendor === 'all'}
                  onChange={() => {
                    setSelectedVendor('all');
                    setPage(1);
                  }}
                  className="text-[#920d35] focus:ring-0"
                />
                <span>All Stores (Platform)</span>
              </label>
              {stores.map((s) => (
                <label
                  key={s.id}
                  className="flex items-center justify-between text-slate-700 hover:text-slate-900 cursor-pointer py-0.5"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <input
                      type="radio"
                      name="store_filter_desktop"
                      checked={selectedVendor === s.id || selectedVendor === s.slug}
                      onChange={() => {
                        setSelectedVendor(s.id);
                        setPage(1);
                      }}
                      className="text-[#920d35] focus:ring-0"
                    />
                    <span className="truncate text-xs">{s.name}</span>
                  </div>
                  <span className="text-[9px] text-slate-400 shrink-0 ml-1">
                    {s.district?.split(' ')[0]}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </aside>

        {/* Product Grid Area */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <div className="h-3 w-32 bg-slate-200 animate-pulse rounded"></div>
                <div className="h-3 w-20 bg-slate-200 animate-pulse rounded"></div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3 md:gap-3.5">
                {Array.from({ length: 18 }).map((_, idx) => (
                  <ProductCardSkeleton key={idx} />
                ))}
              </div>
            </div>
          ) : products.length === 0 ? (
            <div className="p-10 bg-white rounded-lg border border-slate-200 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <Search className="w-6 h-6 stroke-1" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">No matching products found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                We couldn't find any products matching your current filters. Try relaxing your price filters or searching for another brand.
              </p>
              <button
                onClick={clearAllFilters}
                className="px-5 py-2 bg-cyan-500 hover:bg-cyan-600 text-white text-xs font-bold rounded shadow-2xs transition-colors cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3 md:gap-3.5">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Pagination with Responsive Windowing */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-1.5 mt-5 sm:mt-6">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1.5 rounded border border-slate-200 bg-white font-bold text-xs text-slate-700 disabled:opacity-40 hover:bg-slate-50 cursor-pointer"
                  >
                    Previous
                  </button>

                  {Array.from({ length: totalPages })
                    .map((_, idx) => idx + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                    .reduce<(number | string)[]>((acc, p, i, arr) => {
                      if (i > 0 && p - (arr[i - 1] as number) > 1) {
                        acc.push('...');
                      }
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((item, idx) =>
                      typeof item === 'string' ? (
                        <span key={`ellipsis-${idx}`} className="px-2 text-slate-400 text-xs">
                          ...
                        </span>
                      ) : (
                        <button
                          key={item}
                          onClick={() => setPage(item)}
                          className={`w-8 h-8 rounded font-bold text-xs transition-colors cursor-pointer ${
                            page === item
                              ? 'bg-cyan-500 text-white shadow-2xs'
                              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {item}
                        </button>
                      )
                    )}

                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="px-3 py-1.5 rounded border border-slate-200 bg-white font-bold text-xs text-slate-700 disabled:opacity-40 hover:bg-slate-50 cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* 4. MOBILE FILTERS MODAL */}
      {isMobileFiltersOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end">
          <div className="w-4/5 max-w-sm bg-white h-full overflow-y-auto p-4 space-y-4 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h3 className="font-extrabold text-sm text-slate-900">Filter Products</h3>
              <button onClick={() => setIsMobileFiltersOpen(false)} className="text-slate-500 hover:text-slate-800 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto pr-1">
              {/* Mobile Categories */}
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Category</h4>
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setPage(1);
                  }}
                  className="w-full p-2 rounded-lg border border-slate-200 text-xs font-semibold bg-white"
                >
                  <option value="all">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Deals & Stock */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Deals & Availability</h4>
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={onlyInStock}
                    onChange={(e) => {
                      setOnlyInStock(e.target.checked);
                      setPage(1);
                    }}
                    className="rounded text-cyan-600 focus:ring-0"
                  />
                  <span>In Stock (Ready in Kampala)</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={onlyFlashSale}
                    onChange={(e) => {
                      setOnlyFlashSale(e.target.checked);
                      setPage(1);
                    }}
                    className="rounded text-orange-500 focus:ring-0"
                  />
                  <span className="text-orange-600 font-bold">⚡ Flash Sales & Deals</span>
                </label>
              </div>

              {/* Price Ranges */}
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Price in UGX</h4>
                <div className="space-y-1 text-xs">
                  <button
                    onClick={() => handlePricePreset(undefined, 200000)}
                    className={`w-full text-left px-2 py-1.5 rounded transition-colors cursor-pointer ${
                      priceRange.max === 200000 ? 'bg-cyan-50 font-bold text-cyan-600' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    Under UGX 200,000
                  </button>
                  <button
                    onClick={() => handlePricePreset(200000, 600000)}
                    className={`w-full text-left px-2 py-1.5 rounded transition-colors cursor-pointer ${
                      priceRange.min === 200000 && priceRange.max === 600000
                        ? 'bg-cyan-50 font-bold text-cyan-600'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    UGX 200,000 - 600,000
                  </button>
                  <button
                    onClick={() => handlePricePreset(600000, 1500000)}
                    className={`w-full text-left px-2 py-1.5 rounded transition-colors cursor-pointer ${
                      priceRange.min === 600000 && priceRange.max === 1500000
                        ? 'bg-cyan-50 font-bold text-cyan-600'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    UGX 600,000 - 1,500,000
                  </button>
                  <button
                    onClick={() => handlePricePreset(1500000, undefined)}
                    className={`w-full text-left px-2 py-1.5 rounded transition-colors cursor-pointer ${
                      priceRange.min === 1500000 ? 'bg-cyan-50 font-bold text-cyan-600' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    Over UGX 1,500,000
                  </button>
                </div>
              </div>

              {/* Brands */}
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Brands</h4>
                <div className="grid grid-cols-2 gap-1 text-xs">
                  {availableBrands.map((brand) => (
                    <label key={brand} className="flex items-center gap-1.5 py-1 text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedBrands.includes(brand)}
                        onChange={() => toggleBrand(brand)}
                        className="rounded text-cyan-600 focus:ring-0"
                      />
                      <span>{brand}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Verified Stores (Mobile) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400">Stores & Vendors</h4>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileFiltersOpen(false);
                      setCurrentView('stores');
                    }}
                    className="text-[10px] text-[#920d35] font-bold"
                  >
                    Directory →
                  </button>
                </div>
                <div className="space-y-1 text-xs max-h-36 overflow-y-auto">
                  <label className="flex items-center gap-2 text-slate-700 cursor-pointer py-1">
                    <input
                      type="radio"
                      name="store_filter_mobile"
                      checked={selectedVendor === 'all'}
                      onChange={() => {
                        setSelectedVendor('all');
                        setPage(1);
                      }}
                      className="text-[#920d35] focus:ring-0"
                    />
                    <span>All Stores</span>
                  </label>
                  {stores.map((s) => (
                    <label key={s.id} className="flex items-center justify-between text-slate-700 cursor-pointer py-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <input
                          type="radio"
                          name="store_filter_mobile"
                          checked={selectedVendor === s.id || selectedVendor === s.slug}
                          onChange={() => {
                            setSelectedVendor(s.id);
                            setPage(1);
                          }}
                          className="text-[#920d35] focus:ring-0"
                        />
                        <span className="truncate">{s.name}</span>
                      </div>
                      <span className="text-[9px] text-slate-400 shrink-0 ml-1">
                        {s.district?.split(' ')[0]}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Modal Actions */}
            <div className="pt-2 border-t border-slate-200 space-y-2">
              <button
                onClick={() => setIsMobileFiltersOpen(false)}
                className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-600 text-white font-bold text-xs rounded-lg shadow-xs cursor-pointer"
              >
                Apply Filters ({totalCount} Results)
              </button>
              {hasActiveFilters && (
                <button
                  onClick={() => {
                    clearAllFilters();
                    setIsMobileFiltersOpen(false);
                  }}
                  className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg cursor-pointer"
                >
                  Reset All Filters
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
