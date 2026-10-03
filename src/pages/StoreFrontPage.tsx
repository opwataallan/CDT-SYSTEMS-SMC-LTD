import React, { useState, useEffect } from 'react';
import { useShop } from '../context/ShopContext';
import { api } from '../services/api';
import { Store, Product, StoreReview, StorePromotion } from '../types';
import { ProductCard } from '../components/ProductCard';
import {
  MapPin,
  Phone,
  Mail,
  MessageCircle,
  Star,
  ShieldCheck,
  Package,
  Truck,
  ArrowLeft,
  Search,
  SlidersHorizontal,
  Sparkles,
  CheckCircle2,
  Clock,
  Send,
  X,
  Share2,
} from 'lucide-react';

interface StoreFrontPageProps {
  slug?: string;
}

export const StoreFrontPage: React.FC<StoreFrontPageProps> = ({ slug: initialSlug }) => {
  const { currentView, viewData, setCurrentView, showToast } = useShop();
  const slug = initialSlug || viewData?.slug || 'cyber-dynamic-tech';

  const [storeData, setStoreData] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<StoreReview[]>([]);
  const [promotions, setPromotions] = useState<StorePromotion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filter & Search states within storefront
  const [activeTab, setActiveTab] = useState<'products' | 'reviews' | 'about'>('products');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'popularity' | 'price_asc' | 'price_desc' | 'rating'>('popularity');

  // Review modal
  const [isReviewModalOpen, setIsReviewModalOpen] = useState<boolean>(false);
  const [reviewerName, setReviewerName] = useState<string>('');
  const [reviewerEmail, setReviewerEmail] = useState<string>('');
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>('');
  const [orderNumber, setOrderNumber] = useState<string>('');
  const [submittingReview, setSubmittingReview] = useState<boolean>(false);

  useEffect(() => {
    loadStorefront();
  }, [slug]);

  const loadStorefront = async () => {
    setLoading(true);
    try {
      const res = await api.getStoreBySlug(slug);
      if (res && res.store) {
        setStoreData(res.store);
        setProducts(res.products || []);
        setReviews(res.reviews || []);
        setPromotions(res.promotions || []);
      }
    } catch (err: any) {
      console.warn('Failed to load store:', err);
      showToast('Store not found or unavailable');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeData) return;
    if (!reviewerName.trim() || !reviewComment.trim()) {
      showToast('Please enter your name and review comments.');
      return;
    }

    setSubmittingReview(true);
    try {
      const res = await api.submitStoreReview(storeData.id, {
        reviewer_name: reviewerName.trim(),
        reviewer_email: reviewerEmail.trim() || undefined,
        rating: reviewRating,
        comment: reviewComment.trim(),
        order_number: orderNumber.trim() || undefined,
      });

      if (res.success) {
        showToast(res.message || 'Review submitted successfully!');
        setIsReviewModalOpen(false);
        setReviewComment('');
        setOrderNumber('');
        // Reload reviews
        loadStorefront();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Filter products within store
  const filteredProducts = products.filter((p) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const match =
        p.name.toLowerCase().includes(q) ||
        p.brand?.toLowerCase().includes(q) ||
        p.short_description?.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (selectedCategory !== 'all') {
      const hasCat = p.categories.some(
        (c) => c.slug.toLowerCase() === selectedCategory.toLowerCase() || c.name.toLowerCase() === selectedCategory.toLowerCase()
      );
      if (!hasCat) return false;
    }
    return true;
  });

  // Sort products
  filteredProducts.sort((a, b) => {
    if (sortBy === 'price_asc') return a.price - b.price;
    if (sortBy === 'price_desc') return b.price - a.price;
    if (sortBy === 'rating') return (b.average_rating || 0) - (a.average_rating || 0);
    return (b.rating_count || 0) - (a.rating_count || 0);
  });

  const availableCategories = Array.from(
    new Set(products.flatMap((p) => p.categories.map((c) => c.name)))
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center py-24">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-[#920d35] rounded-full animate-spin mb-4" />
        <p className="text-slate-600 font-semibold text-sm">Loading storefront...</p>
      </div>
    );
  }

  if (!storeData) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Store Not Found</h2>
        <p className="text-slate-500 mb-6 text-sm">
          The requested store "{slug}" is either inactive, suspended, or does not exist.
        </p>
        <button
          onClick={() => setCurrentView('stores')}
          className="bg-[#920d35] text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow hover:bg-[#770929] transition-all"
        >
          Browse All Stores
        </button>
      </div>
    );
  }

  const isMainStore = Boolean(storeData.is_platform_store);

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      {/* Back to Stores Navigation Link */}
      <div className="bg-white border-b border-slate-200 py-2.5 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={() => setCurrentView('stores')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#920d35] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>All Ugandan Stores</span>
          </button>
          <div className="text-xs text-slate-400 font-medium">
            <span>Marketplace Storefront: </span>
            <span className="font-semibold text-slate-700">{storeData.name}</span>
          </div>
        </div>
      </div>

      {/* Store Banner Hero */}
      <div className="relative h-48 sm:h-72 lg:h-80 w-full bg-slate-900 overflow-hidden">
        <img
          src={storeData.banner_url || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1600&q=80'}
          alt={storeData.name}
          className="w-full h-full object-cover opacity-85"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-black/30" />
      </div>

      {/* Store Profile Card Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 sm:-mt-24 relative z-10 mb-8">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200/90 p-6 sm:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              {/* Store Logo */}
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-4 border-white shadow-xl bg-white p-1.5 overflow-hidden shrink-0">
                <img
                  src={storeData.logo_url || '/logo.png'}
                  alt={storeData.name}
                  className="w-full h-full object-cover rounded-xl"
                />
              </div>

              {/* Store Identity */}
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    {storeData.name}
                  </h1>
                  {isMainStore ? (
                    <span className="bg-[#920d35] text-white text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                      <Sparkles className="w-3 h-3" />
                      Platform Flagship Store
                    </span>
                  ) : (
                    <span className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      Verified Seller
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500 mb-2">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{storeData.district}, {storeData.city}, Uganda</span>
                  </div>
                  <div className="flex items-center gap-1 text-amber-500 font-semibold">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>{storeData.rating?.toFixed(1) || '5.0'}</span>
                    <span className="text-slate-400 font-normal">({storeData.rating_count || 0} reviews)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Package className="w-3.5 h-3.5 text-slate-400" />
                    <span>{products.length} Products</span>
                  </div>
                </div>

                <p className="text-slate-600 text-xs sm:text-sm max-w-2xl leading-relaxed">
                  {storeData.description}
                </p>
              </div>
            </div>

            {/* Quick Contact & Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 self-start md:self-center shrink-0">
              {storeData.phone && (
                <a
                  href={`tel:${storeData.phone}`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-all"
                >
                  <Phone className="w-3.5 h-3.5 text-slate-600" />
                  <span>Call Store</span>
                </a>
              )}
              {storeData.phone && (
                <a
                  href={`https://wa.me/${storeData.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                    `Hello ${storeData.name}, I am contacting you from Cyber Dynamic Tech Marketplace.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>
              )}
              <button
                onClick={() => setIsReviewModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-semibold transition-all"
              >
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                <span>Write Review</span>
              </button>
            </div>
          </div>

          {/* Store Delivery Policy Banner */}
          <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="flex items-center gap-2 text-slate-600">
              <Truck className="w-4 h-4 text-[#920d35] shrink-0" />
              <span>
                <strong>Delivery: </strong>
                {storeData.delivery_settings?.estimated_days || 'Express courier across Uganda'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>Warranty: </strong>
                Official warranty backed by {storeData.name}
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <Clock className="w-4 h-4 text-cyan-600 shrink-0" />
              <span>
                <strong>Pick-up: </strong>
                {storeData.delivery_settings?.allow_pickup ? 'Store collection available' : 'Nationwide delivery only'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <button
            onClick={() => setActiveTab('products')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'products'
                ? 'bg-[#920d35] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Product Catalog ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'reviews'
                ? 'bg-[#920d35] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Store Reviews ({reviews.length})
          </button>
          <button
            onClick={() => setActiveTab('about')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'about'
                ? 'bg-[#920d35] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            About & Location
          </button>
        </div>
      </div>

      {/* Tab 1: Products */}
      {activeTab === 'products' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Store Promotions Banner if active */}
          {promotions.length > 0 && (
            <div className="mb-6 bg-gradient-to-r from-amber-500 to-rose-600 text-white rounded-xl p-4 sm:p-5 flex items-center justify-between shadow-md">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded">
                  Special Promotion
                </span>
                <h4 className="text-lg font-extrabold mt-1">{promotions[0].title}</h4>
                <p className="text-xs text-white/90">{promotions[0].description}</p>
              </div>
              {promotions[0].code && (
                <div className="bg-white text-slate-900 px-4 py-2 rounded-lg font-mono font-bold text-sm shrink-0 shadow">
                  Use Code: {promotions[0].code}
                </div>
              )}
            </div>
          )}

          {/* Search & Filter Strip within store */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search inside ${storeData.name}...`}
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#920d35]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              {availableCategories.length > 0 && (
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white text-slate-700"
                >
                  <option value="all">All Categories</option>
                  {availableCategories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              )}

              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white text-slate-700"
              >
                <option value="popularity">Most Popular</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="rating">Top Rated</option>
              </select>
            </div>
          </div>

          {/* Products Grid */}
          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h4 className="font-bold text-slate-800 text-sm">No Products Found</h4>
              <p className="text-xs text-slate-500 mt-1">
                No products in {storeData.name} match your active search or category filter.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {filteredProducts.map((prod) => (
                <ProductCard key={prod.id} product={prod} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Reviews */}
      {activeTab === 'reviews' && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 mb-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-6 border-b border-slate-100">
              <div className="flex items-center gap-5">
                <div className="text-center">
                  <div className="text-5xl font-extrabold text-slate-900">
                    {storeData.rating?.toFixed(1) || '5.0'}
                  </div>
                  <div className="flex items-center gap-1 justify-center my-1 text-amber-400">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-4 h-4 ${
                          s <= Math.round(storeData.rating || 5)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-slate-400">Based on {reviews.length} reviews</p>
                </div>
                <div className="h-14 w-px bg-slate-200 hidden sm:block" />
                <div className="text-xs text-slate-600 hidden sm:block">
                  <p className="font-semibold text-slate-800">Verified Seller Rating</p>
                  <p className="text-slate-500">100% genuine customer reviews from completed orders.</p>
                </div>
              </div>
              <button
                onClick={() => setIsReviewModalOpen(true)}
                className="bg-[#920d35] hover:bg-[#770929] text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow transition-all shrink-0"
              >
                Write a Store Review
              </button>
            </div>

            {/* Reviews List */}
            <div className="divide-y divide-slate-100 mt-6">
              {reviews.length === 0 ? (
                <div className="text-center py-10">
                  <Star className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700">No reviews yet for {storeData.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Be the first customer to share your shopping experience!</p>
                </div>
              ) : (
                reviews.map((rev) => (
                  <div key={rev.id} className="py-5">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{rev.reviewer_name}</span>
                        {rev.verified_purchase && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Verified Buyer
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {new Date(rev.date_created).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-amber-400 mb-2">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${
                            s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                          }`}
                        />
                      ))}
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed mb-3">{rev.comment}</p>

                    {/* Vendor Response */}
                    {rev.vendor_reply && (
                      <div className="ml-4 bg-slate-50 border-l-2 border-[#920d35] p-3 rounded-r-lg text-xs">
                        <span className="font-bold text-slate-900 block mb-0.5">
                          Response from {storeData.name}:
                        </span>
                        <p className="text-slate-600">{rev.vendor_reply.comment}</p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: About & Location */}
      {activeTab === 'about' && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 mb-2">About {storeData.name}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{storeData.description}</p>
            </div>

            <div className="pt-6 border-t border-slate-100">
              <h3 className="text-base font-bold text-slate-900 mb-3">Store Location & Physical Address</h3>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#920d35]" />
                  <span className="font-semibold text-slate-800">Physical Address:</span>
                  <span className="text-slate-600">{storeData.address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-800 ml-6">District & City:</span>
                  <span className="text-slate-600">{storeData.district}, {storeData.city}, Uganda</span>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100">
              <h3 className="text-base font-bold text-slate-900 mb-3">Delivery & Dispatch Terms</h3>
              <div className="space-y-2 text-xs text-slate-600">
                <p>
                  <strong>Fulfillment Model: </strong>
                  {storeData.delivery_settings?.type === 'platform'
                    ? 'Handled by Cyber Dynamic Technologies Central Logistics Hub'
                    : 'Dispatched directly by verified vendor warehouse'}
                </p>
                <p>
                  <strong>Estimated Delivery Timeline: </strong>
                  {storeData.delivery_settings?.estimated_days || '1-2 days across Uganda'}
                </p>
                <p>
                  <strong>Store Pickup: </strong>
                  {storeData.delivery_settings?.allow_pickup
                    ? `Available at: ${storeData.delivery_settings.pickup_address || storeData.address}`
                    : 'Delivery only'}
                </p>
              </div>
            </div>

            {storeData.tin_number && (
              <div className="pt-6 border-t border-slate-100 text-xs text-slate-500">
                <span>Tax Identification Number (TIN): </span>
                <span className="font-mono text-slate-800">{storeData.tin_number}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Review Modal */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative border border-slate-200">
            <button
              onClick={() => setIsReviewModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 mb-1">Review {storeData.name}</h3>
            <p className="text-xs text-slate-500 mb-4">
              Share your feedback to help fellow shoppers make confident tech purchases.
            </p>

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Your Rating</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setReviewRating(star)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= reviewRating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-200'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-slate-700 ml-2">
                    {reviewRating} of 5 Stars
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Your Full Name *</label>
                <input
                  type="text"
                  required
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  placeholder="e.g. Samuel Kigozi"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-[#920d35] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address (Optional)</label>
                <input
                  type="email"
                  value={reviewerEmail}
                  onChange={(e) => setReviewerEmail(e.target.value)}
                  placeholder="samuel@gmail.com"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-[#920d35] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  CDT Order Number (For Verified Buyer Badge)
                </label>
                <input
                  type="text"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  placeholder="e.g. CDT-10495"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-[#920d35] focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Your Review *</label>
                <textarea
                  required
                  rows={3}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Describe product quality, delivery speed, and customer care..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-[#920d35] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsReviewModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="px-5 py-2 rounded-lg bg-[#920d35] hover:bg-[#770929] text-white text-xs font-bold shadow flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submittingReview ? 'Submitting...' : 'Post Review'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
