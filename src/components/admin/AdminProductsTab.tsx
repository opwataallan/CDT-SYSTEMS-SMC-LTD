import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Copy,
  ExternalLink,
  Upload,
  X,
  Check,
  AlertCircle,
  TrendingUp,
  Tag,
  DollarSign,
  Percent,
  Layers,
  BarChart2,
  Boxes,
  Archive,
  RefreshCw,
  FolderPlus,
  Image as ImageIcon,
  CheckCircle2,
  Eye,
  Sliders,
  ChevronDown,
} from 'lucide-react';
import { Product, Category, ProductImage, ProductVariation } from '../../types';
import { api } from '../../services/api';
import { useShop } from '../../context/ShopContext';
import { uploadProductImage, seedInitialFirestoreCatalogIfEmpty } from '../../firebase';

export const AdminProductsTab: React.FC = () => {
  const { formatPrice, showToast, setCurrentView } = useShop();

  // Catalog State
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedStockStatus, setSelectedStockStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'price_asc' | 'price_desc' | 'stock' | 'date'>('date');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [activeFormTab, setActiveFormTab] = useState<'general' | 'pricing' | 'inventory' | 'images' | 'attributes' | 'seo'>('general');
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [regularPrice, setRegularPrice] = useState<number | ''>('');
  const [salePrice, setSalePrice] = useState<number | ''>('');
  const [discountPercent, setDiscountPercent] = useState<number | ''>('');
  const [discountAmount, setDiscountAmount] = useState<number | ''>('');

  const handleRegularPriceChange = (val: number | '') => {
    setRegularPrice(val);
    if (val === '' || Number(val) <= 0) return;
    const numReg = Number(val);
    if (discountPercent !== '' && Number(discountPercent) > 0) {
      const discounted = Math.round(numReg * (1 - Number(discountPercent) / 100));
      setSalePrice(discounted);
      setDiscountAmount(numReg - discounted);
    } else if (salePrice !== '' && numReg > Number(salePrice)) {
      const pct = Math.round(((numReg - Number(salePrice)) / numReg) * 100);
      setDiscountPercent(pct);
      setDiscountAmount(numReg - Number(salePrice));
    }
  };

  const handleDiscountPercentChange = (val: number | '') => {
    setDiscountPercent(val);
    if (val === '' || Number(val) <= 0) {
      setSalePrice('');
      setDiscountAmount('');
      return;
    }
    const cleanPct = Math.min(99, Math.max(1, Number(val)));
    if (regularPrice !== '' && Number(regularPrice) > 0) {
      const discounted = Math.round(Number(regularPrice) * (1 - cleanPct / 100));
      setSalePrice(discounted);
      setDiscountAmount(Number(regularPrice) - discounted);
    }
  };

  const handleSalePriceChange = (val: number | '') => {
    setSalePrice(val);
    if (val === '' || Number(val) <= 0) {
      setDiscountPercent('');
      setDiscountAmount('');
      return;
    }
    const numSale = Number(val);
    if (regularPrice !== '' && Number(regularPrice) > numSale) {
      const savings = Number(regularPrice) - numSale;
      const pct = Math.round((savings / Number(regularPrice)) * 100);
      setDiscountPercent(pct);
      setDiscountAmount(savings);
    } else {
      setDiscountPercent('');
      setDiscountAmount('');
    }
  };

  const handleDiscountAmountChange = (val: number | '') => {
    setDiscountAmount(val);
    if (val === '' || Number(val) <= 0) {
      setDiscountPercent('');
      setSalePrice('');
      return;
    }
    const numAmt = Number(val);
    const numReg = Number(regularPrice);
    if (numReg > 0) {
      const cleanAmt = Math.min(numReg - 1, numAmt);
      const discounted = numReg - cleanAmt;
      setSalePrice(discounted);
      const pct = Math.round((cleanAmt / numReg) * 100);
      setDiscountPercent(pct);
    }
  };

  const applyDiscountPreset = (percent: number) => {
    setDiscountPercent(percent);
    if (regularPrice !== '' && Number(regularPrice) > 0) {
      const discounted = Math.round(Number(regularPrice) * (1 - percent / 100));
      setSalePrice(discounted);
      setDiscountAmount(Number(regularPrice) - discounted);
    }
  };

  const clearDiscount = () => {
    setDiscountPercent('');
    setSalePrice('');
    setDiscountAmount('');
  };
  const [purchaseCost, setPurchaseCost] = useState<number | ''>('');
  const [stockQuantity, setStockQuantity] = useState<number | ''>(10);
  const [lowStockThreshold, setLowStockThreshold] = useState<number | ''>(3);
  const [status, setStatus] = useState<'published' | 'draft' | 'archived'>('published');
  const [productType, setProductType] = useState<'physical' | 'digital'>('physical');
  const [brand, setBrand] = useState('Cyber Dynamic Tech');
  const [productCategories, setProductCategories] = useState<number[]>([]);
  const [tagsInput, setTagsInput] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [featured, setFeatured] = useState(false);
  const [flashSale, setFlashSale] = useState(false);
  const [warranty, setWarranty] = useState('1 Year Official Warranty');
  const [weight, setWeight] = useState('1.5 kg');
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [shippingRequired, setShippingRequired] = useState(true);
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');

  // Images state
  const [images, setImages] = useState<ProductImage[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Category management form
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('Folder');

  // Load Data
  const loadCatalog = async () => {
    setIsLoading(true);
    try {
      const [prodRes, catRes] = await Promise.allSettled([
        api.getProducts({ limit: 100 }, { forceRefresh: true }),
        api.getCategories(),
      ]);

      if (prodRes.status === 'fulfilled' && Array.isArray(prodRes.value.products)) {
        setProducts(prodRes.value.products);
      }
      if (catRes.status === 'fulfilled' && Array.isArray(catRes.value)) {
        setCategories(catRes.value);
      }
    } catch (e) {
      console.warn('Failed to load products:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCatalog();
  }, []);

  // Filtered & Sorted Products
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        if (!p) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = p.name?.toLowerCase().includes(q);
          const matchSku = p.sku?.toLowerCase().includes(q);
          const matchBrand = p.brand?.toLowerCase().includes(q);
          if (!matchName && !matchSku && !matchBrand) return false;
        }
        if (selectedCategory !== 'all') {
          const inCat = p.categories?.some((c) => c.slug === selectedCategory || c.id === Number(selectedCategory));
          if (!inCat) return false;
        }
        if (selectedStatus !== 'all') {
          if ((p.status || 'published') !== selectedStatus) return false;
        }
        if (selectedStockStatus !== 'all') {
          if (selectedStockStatus === 'low_stock') {
            const threshold = p.low_stock_threshold || 3;
            if (p.stock_quantity > threshold || p.stock_quantity <= 0) return false;
          } else if (selectedStockStatus === 'on_sale') {
            const isDiscounted = Boolean(
              p.on_sale ||
              (p.sale_price && p.regular_price > p.sale_price) ||
              (p.discount_percent && p.discount_percent > 0)
            );
            if (!isDiscounted) return false;
          } else if (p.stock_status !== selectedStockStatus) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'price_asc') return a.price - b.price;
        if (sortBy === 'price_desc') return b.price - a.price;
        if (sortBy === 'stock') return a.stock_quantity - b.stock_quantity;
        return (b.id || 0) - (a.id || 0);
      });
  }, [products, searchQuery, selectedCategory, selectedStatus, selectedStockStatus, sortBy]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingProduct(null);
    setName('');
    setSlug('');
    setSku(`CDT-${Math.floor(1000 + Math.random() * 9000)}`);
    setBarcode('');
    setRegularPrice('');
    setSalePrice('');
    setDiscountPercent('');
    setDiscountAmount('');
    setPurchaseCost('');
    setStockQuantity(10);
    setLowStockThreshold(3);
    setStatus('published');
    setProductType('physical');
    setBrand('Cyber Dynamic Tech');
    setProductCategories(categories[0]?.id ? [categories[0].id] : []);
    setTagsInput('');
    setShortDescription('');
    setDescription('');
    setFeatured(false);
    setFlashSale(false);
    setWarranty('1 Year Official Warranty');
    setWeight('1.5 kg');
    setLength('');
    setWidth('');
    setHeight('');
    setShippingRequired(true);
    setSeoTitle('');
    setSeoDescription('');
    setImages([{ id: 1, src: '/logo.png', name: 'Product Logo', alt: 'Product Logo' }]);
    setActiveFormTab('general');
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setSlug(p.slug);
    setSku(p.sku);
    setBarcode(p.barcode || '');
    const initialReg = p.regular_price || p.price;
    const initialSale = p.sale_price || (p.on_sale && p.price < initialReg ? p.price : '');
    setRegularPrice(initialReg);
    setSalePrice(initialSale);
    if (initialSale && initialReg > Number(initialSale)) {
      const savings = initialReg - Number(initialSale);
      const pct = Math.round((savings / initialReg) * 100);
      setDiscountPercent(pct);
      setDiscountAmount(savings);
    } else if (p.discount_percent && p.discount_percent > 0) {
      setDiscountPercent(p.discount_percent);
      const discounted = Math.round(initialReg * (1 - p.discount_percent / 100));
      setSalePrice(discounted);
      setDiscountAmount(initialReg - discounted);
    } else {
      setDiscountPercent('');
      setDiscountAmount('');
    }
    setPurchaseCost(p.purchase_cost !== undefined ? p.purchase_cost : '');
    setStockQuantity(p.stock_quantity);
    setLowStockThreshold(p.low_stock_threshold || 3);
    setStatus((p.status as any) || 'published');
    setProductType((p.product_type as any) || 'physical');
    setBrand(p.brand || 'Cyber Dynamic Tech');
    setProductCategories(p.categories?.map((c) => c.id) || []);
    setTagsInput(Array.isArray(p.tags) ? p.tags.join(', ') : '');
    setShortDescription(p.short_description || '');
    setDescription(p.description || '');
    setFeatured(Boolean(p.featured));
    setFlashSale(Boolean(p.flash_sale));
    setWarranty(p.warranty || '1 Year Official Warranty');
    setWeight(p.weight || '1.5 kg');
    setLength(p.dimensions?.length || '');
    setWidth(p.dimensions?.width || '');
    setHeight(p.dimensions?.height || '');
    setShippingRequired(p.shipping_required ?? true);
    setSeoTitle(p.seo_title || p.name);
    setSeoDescription(p.seo_description || p.short_description || '');
    setImages(p.images?.length > 0 ? p.images : [{ id: 1, src: '/logo.png', name: p.name, alt: p.name }]);
    setActiveFormTab('general');
    setFormError(null);
    setIsModalOpen(true);
  };

  // Save Product
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError('Product name is required.');
      setActiveFormTab('general');
      return;
    }

    const regPriceNum = Number(regularPrice);
    if (isNaN(regPriceNum) || regPriceNum <= 0) {
      setFormError('A valid regular price in UGX is required.');
      setActiveFormTab('general');
      return;
    }

    if (!sku.trim()) {
      setFormError('Product SKU is required.');
      setActiveFormTab('general');
      return;
    }

    let finalSalePrice = salePrice !== '' && Number(salePrice) > 0 ? Number(salePrice) : undefined;
    if (!finalSalePrice && discountPercent !== '' && Number(discountPercent) > 0) {
      finalSalePrice = Math.round(regPriceNum * (1 - Number(discountPercent) / 100));
    } else if (!finalSalePrice && discountAmount !== '' && Number(discountAmount) > 0) {
      finalSalePrice = Math.max(1, regPriceNum - Number(discountAmount));
    }
    if (finalSalePrice && finalSalePrice >= regPriceNum) {
      finalSalePrice = undefined;
    }

    const currentPrice = finalSalePrice ? finalSalePrice : regPriceNum;
    const isOnSale = Boolean(finalSalePrice && finalSalePrice < regPriceNum);
    const calculatedDiscount = isOnSale
      ? Math.round(((regPriceNum - finalSalePrice!) / regPriceNum) * 100)
      : undefined;

    const assignedCategories = categories
      .filter((c) => productCategories.includes(c.id))
      .map((c) => ({ id: c.id, name: c.name, slug: c.slug }));

    const tagsArray = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const productPayload: Partial<Product> = {
      name: name.trim(),
      slug: (slug.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')),
      sku: sku.trim().toUpperCase(),
      barcode: barcode.trim(),
      price: currentPrice,
      regular_price: regPriceNum,
      sale_price: finalSalePrice,
      discount_percent: calculatedDiscount,
      on_sale: isOnSale,
      purchase_cost: purchaseCost !== '' ? Number(purchaseCost) : undefined,
      stock_quantity: Number(stockQuantity || 0),
      low_stock_threshold: Number(lowStockThreshold || 3),
      status,
      product_type: productType,
      brand: brand.trim(),
      categories: assignedCategories.length > 0 ? assignedCategories : [{ id: 1, name: 'General', slug: 'general' }],
      tags: tagsArray,
      images: images.length > 0 ? images : [{ id: 1, src: '/logo.png', name, alt: name }],
      short_description: shortDescription.trim(),
      description: description.trim(),
      featured,
      flash_sale: flashSale,
      warranty: warranty.trim(),
      weight: weight.trim(),
      dimensions: { length, width, height },
      shipping_required: shippingRequired,
      seo_title: seoTitle.trim() || name.trim(),
      seo_description: seoDescription.trim() || shortDescription.trim(),
    };

    setIsSaving(true);
    try {
      if (editingProduct) {
        const updated = await api.updateProduct(editingProduct.id, productPayload);
        setProducts((prev) => prev.map((p) => (p.id === editingProduct.id ? updated : p)));
        showToast(`Product '${updated.name}' updated in database.`);
      } else {
        const created = await api.createProduct(productPayload);
        setProducts((prev) => [created, ...prev]);
        showToast(`Product '${created.name}' published to catalog.`);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save product to database.');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Product
  const handleDeleteProduct = async (p: Product) => {
    if (!window.confirm(`Are you sure you want to permanently delete '${p.name}' from the database?`)) {
      return;
    }
    try {
      await api.deleteProduct(p.id);
      setProducts((prev) => prev.filter((item) => item.id !== p.id));
      showToast(`Product '${p.name}' deleted.`);
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    }
  };

  // Duplicate Product
  const handleDuplicateProduct = async (p: Product) => {
    try {
      const duplicated = await api.duplicateProduct(p.id);
      setProducts((prev) => [duplicated, ...prev]);
      showToast(`Created draft duplicate of '${p.name}'.`);
    } catch (err: any) {
      showToast(`Duplicate error: ${err.message}`);
    }
  };

  // Image upload handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const downloadUrl = await uploadProductImage(file);
      const newImg: ProductImage = {
        id: Date.now(),
        src: downloadUrl,
        name: file.name,
        alt: name || 'Product image',
      };
      setImages((prev) => [...prev, newImg]);
      showToast('Image uploaded to Firebase Storage.');
    } catch (err: any) {
      showToast(`Upload failed: ${err.message}`);
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAddImageUrl = () => {
    if (!newImageUrl.trim()) return;
    const newImg: ProductImage = {
      id: Date.now(),
      src: newImageUrl.trim(),
      name: 'Product Image',
      alt: name || 'Product image',
    };
    setImages((prev) => [...prev, newImg]);
    setNewImageUrl('');
  };

  const handleRemoveImage = (imgId: number) => {
    setImages((prev) => prev.filter((img) => img.id !== imgId));
  };

  // Category creation
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    try {
      const cat = await api.createCategory({
        name: newCategoryName.trim(),
        description: newCategoryDescription.trim(),
        icon: newCategoryIcon,
      });
      setCategories((prev) => [...prev, cat]);
      setNewCategoryName('');
      setNewCategoryDescription('');
      setIsCategoryModalOpen(false);
      showToast(`Category '${cat.name}' added.`);
    } catch (err: any) {
      showToast(`Category error: ${err.message}`);
    }
  };

  // Metrics
  const totalProducts = products.length;
  const publishedCount = products.filter((p) => p.status !== 'draft' && p.status !== 'archived').length;
  const lowStockCount = products.filter((p) => (p.stock_quantity <= (p.low_stock_threshold || 3)) && p.stock_quantity > 0).length;
  const outOfStockCount = products.filter((p) => p.stock_quantity <= 0 || p.stock_status === 'outofstock').length;

  return (
    <div className="space-y-6">
      {/* Top Banner / Metrics Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Total Catalog</span>
            <Boxes className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">{totalProducts}</div>
          <div className="text-[11px] text-slate-400 mt-1">Permanent products in database</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Published Live</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600 tracking-tight">{publishedCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Visible on storefront</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Low Stock</span>
            <AlertCircle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-500 tracking-tight">{lowStockCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">At or below reorder level</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Out of Stock</span>
            <Archive className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-600 tracking-tight">{outOfStockCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Requires procurement</div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by product name, SKU, or brand..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 focus:outline-none"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={selectedStockStatus}
            onChange={(e) => setSelectedStockStatus(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 focus:outline-none hidden sm:block"
          >
            <option value="all">All Inventory & Pricing</option>
            <option value="on_sale">🏷️ Discounted / On Sale</option>
            <option value="instock">In Stock</option>
            <option value="low_stock">Low Stock (≤ threshold)</option>
            <option value="outofstock">Out of Stock</option>
          </select>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FolderPlus className="w-4 h-4" />
            <span>Manage Categories</span>
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2 bg-[#920d35] hover:bg-[#770929] text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-cyan-600" />
            <p className="text-sm font-medium">Loading database catalog...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No products match your criteria</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {searchQuery ? 'Try adjusting your search terms or filters.' : 'Click Add Product to start building your persistent catalog.'}
            </p>
            <button
              onClick={handleOpenCreateModal}
              className="mt-4 px-4 py-2 bg-[#920d35] text-white text-xs font-bold rounded-xl shadow-xs"
            >
              Add First Product
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-3">SKU</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Price</th>
                  <th className="py-3 px-3">Cost & Profit</th>
                  <th className="py-3 px-3">Stock</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredProducts.map((p) => {
                  const profit = p.purchase_cost !== undefined ? p.price - p.purchase_cost : undefined;
                  const profitMargin = p.purchase_cost && p.price > 0 ? Math.round(((p.price - p.purchase_cost) / p.price) * 100) : null;
                  const isLow = p.stock_quantity <= (p.low_stock_threshold || 3) && p.stock_quantity > 0;
                  const isOut = p.stock_quantity <= 0;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.images?.[0]?.src || '/logo.png'}
                            alt={p.name}
                            className="w-10 h-10 object-contain rounded-lg border border-slate-100 bg-slate-50 shrink-0"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = '/logo.png';
                            }}
                          />
                          <div className="min-w-0 max-w-xs">
                            <div className="font-bold text-slate-900 truncate hover:text-[#920d35] cursor-pointer" onClick={() => handleOpenEditModal(p)}>
                              {p.name}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate">{p.brand}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3 font-mono text-[11px] text-slate-600">
                        {p.sku}
                      </td>

                      <td className="py-3 px-3">
                        <span className="inline-block px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-semibold">
                          {p.categories?.[0]?.name || 'General'}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-slate-900">{formatPrice(p.price)}</span>
                          {((p.sale_price && p.regular_price > p.price) || (p.discount_percent && p.discount_percent > 0)) && (
                            <span className="px-1.5 py-0.5 rounded bg-rose-500 text-white font-black text-[9px] shadow-2xs">
                              -{p.discount_percent || Math.round(((p.regular_price - p.price) / p.regular_price) * 100)}%
                            </span>
                          )}
                        </div>
                        {p.sale_price && p.regular_price > p.price && (
                          <div className="text-[10px] text-slate-400 line-through">
                            {formatPrice(p.regular_price)}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        {p.purchase_cost !== undefined ? (
                          <div>
                            <div className="text-[11px] text-slate-500">Cost: {formatPrice(p.purchase_cost)}</div>
                            <div className={`text-[11px] font-bold ${profit && profit > 0 ? 'text-emerald-600' : 'text-slate-600'}`}>
                              +{formatPrice(profit || 0)} {profitMargin !== null && `(${profitMargin}%)`}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Unspecified</span>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isOut
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : isLow
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isOut ? 'bg-rose-600' : isLow ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                          {p.stock_quantity} in stock
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                            p.status === 'draft'
                              ? 'bg-slate-100 text-slate-600'
                              : p.status === 'archived'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-cyan-50 text-cyan-800 border border-cyan-200'
                          }`}
                        >
                          {p.status || 'published'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setCurrentView('product', p)}
                            title="View on storefront"
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDuplicateProduct(p)}
                            title="Duplicate product"
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(p)}
                            title="Edit product"
                            className="p-1.5 text-slate-600 hover:text-cyan-700 hover:bg-cyan-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p)}
                            title="Delete product"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADD / EDIT PRODUCT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-4xl w-full my-8 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#920d35]/10 text-[#920d35] flex items-center justify-center font-bold">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {editingProduct ? `Edit: ${editingProduct.name}` : 'Create New Product'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Saved directly to permanent Firestore & server database
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Tabs */}
            <div className="flex border-b border-slate-200 bg-white px-6 overflow-x-auto no-scrollbar gap-1 text-xs font-bold">
              {[
                { id: 'general', label: 'General Info' },
                { id: 'pricing', label: 'Pricing & Cost' },
                { id: 'inventory', label: 'Inventory & Shipping' },
                { id: 'images', label: `Images (${images.length})` },
                { id: 'seo', label: 'SEO & Search' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveFormTab(tab.id as any)}
                  className={`py-3 px-3.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                    activeFormTab === tab.id
                      ? 'border-[#920d35] text-[#920d35]'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Error Message */}
            {formError && (
              <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Form Content */}
            <form onSubmit={handleSaveProduct} className="flex-1 overflow-y-auto p-6 space-y-5">
              {activeFormTab === 'general' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Product Title <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value);
                          if (!editingProduct) {
                            setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
                          }
                        }}
                        placeholder="e.g. HP EliteBook 840 G8 Core i7 16GB 512GB"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#920d35]/20 focus:border-[#920d35]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        URL Slug
                      </label>
                      <input
                        type="text"
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                        placeholder="hp-elitebook-840-g8"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        SKU <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={sku}
                        onChange={(e) => setSku(e.target.value.toUpperCase())}
                        placeholder="CDT-HP-840"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Barcode / UPC / EAN
                      </label>
                      <input
                        type="text"
                        value={barcode}
                        onChange={(e) => setBarcode(e.target.value)}
                        placeholder="194252123456"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Brand / Manufacturer
                      </label>
                      <input
                        type="text"
                        value={brand}
                        onChange={(e) => setBrand(e.target.value)}
                        placeholder="HP, Dell, Apple, Epson..."
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Dedicated Price & Discount Control Card on General Tab */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-50/50 via-rose-50/20 to-slate-50 border-2 border-amber-200/90 shadow-xs space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-amber-200/70">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-xl bg-gradient-to-br from-[#920d35] to-amber-600 text-white shadow-xs">
                          <Tag className="w-4 h-4" />
                        </span>
                        <div>
                          <h4 className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-2">
                            <span>Price & Discount Settings (UGX)</span>
                            {discountPercent !== '' && Number(discountPercent) > 0 && (
                              <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black uppercase tracking-wider animate-pulse">
                                -{discountPercent}% OFF
                              </span>
                            )}
                          </h4>
                          <p className="text-[11px] text-slate-500">
                            Set the regular price and apply a discount percentage or promotional sale price.
                          </p>
                        </div>
                      </div>
                      {discountPercent !== '' && Number(discountPercent) > 0 && (
                        <button
                          type="button"
                          onClick={clearDiscount}
                          className="text-[11px] font-bold text-rose-600 hover:text-rose-800 underline self-start sm:self-auto cursor-pointer"
                        >
                          Remove Discount
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                      {/* 1. Regular Price */}
                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1">
                          Product / Regular Price (UGX) <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400">UGX</span>
                          <input
                            type="number"
                            required
                            min={100}
                            value={regularPrice}
                            onChange={(e) => handleRegularPriceChange(e.target.value ? Number(e.target.value) : '')}
                            placeholder="e.g. 2500000"
                            className="w-full pl-13 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-extrabold text-slate-900 focus:ring-2 focus:ring-[#920d35] focus:outline-none"
                          />
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1 block">Catalog / Standard retail price</span>
                      </div>

                      {/* 2. Discount % */}
                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center justify-between">
                          <span>Discount (%)</span>
                          {discountPercent !== '' && Number(discountPercent) > 0 && (
                            <span className="text-[10px] font-bold text-rose-600">Active</span>
                          )}
                        </label>
                        <div className="relative">
                          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-rose-500">%</span>
                          <input
                            type="number"
                            min={0}
                            max={99}
                            value={discountPercent}
                            onChange={(e) => handleDiscountPercentChange(e.target.value ? Number(e.target.value) : '')}
                            placeholder="e.g. 15"
                            className="w-full pl-3.5 pr-8 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-extrabold text-rose-600 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                          />
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1 block">Percentage cut off</span>
                      </div>

                      {/* 3. Discount Amount (UGX) */}
                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center justify-between">
                          <span>Discount Cut (UGX)</span>
                          {discountAmount !== '' && Number(discountAmount) > 0 && (
                            <span className="text-[10px] font-bold text-emerald-600">Saved</span>
                          )}
                        </label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400">UGX</span>
                          <input
                            type="number"
                            min={0}
                            value={discountAmount}
                            onChange={(e) => handleDiscountAmountChange(e.target.value ? Number(e.target.value) : '')}
                            placeholder="e.g. 250000"
                            className="w-full pl-13 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-extrabold text-emerald-600 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                          />
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1 block">Cash deduction in UGX</span>
                      </div>

                      {/* 4. Discounted Sale Price */}
                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1">
                          Final Customer Price (UGX)
                        </label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400">UGX</span>
                          <input
                            type="number"
                            min={100}
                            value={salePrice}
                            onChange={(e) => handleSalePriceChange(e.target.value ? Number(e.target.value) : '')}
                            placeholder={regularPrice ? String(regularPrice) : 'Auto-calculated'}
                            className={`w-full pl-13 pr-3.5 py-2.5 bg-white border rounded-xl text-xs sm:text-sm font-extrabold focus:outline-none ${
                              salePrice && regularPrice && Number(regularPrice) > Number(salePrice)
                                ? 'border-emerald-400 text-emerald-700 bg-emerald-50/40'
                                : 'border-slate-300 text-slate-900'
                            }`}
                          />
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1 block">Shopper selling price</span>
                      </div>
                    </div>

                    {/* Quick 1-Click Preset Discount Buttons */}
                    <div>
                      <div className="text-[11px] font-bold text-slate-600 mb-1.5 flex items-center gap-1">
                        <Tag className="w-3 h-3 text-amber-500" />
                        <span>Quick 1-Click Discount Presets:</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {[5, 10, 15, 20, 25, 30, 40, 50].map((pct) => {
                          const isSelected = Number(discountPercent) === pct;
                          return (
                            <button
                              key={pct}
                              type="button"
                              onClick={() => applyDiscountPreset(pct)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-rose-600 text-white shadow-xs scale-105'
                                  : 'bg-white hover:bg-rose-50 text-slate-700 border border-slate-200 hover:border-rose-200'
                              }`}
                            >
                              {pct}% OFF
                            </button>
                          );
                        })}
                        {discountPercent !== '' && Number(discountPercent) > 0 && (
                          <button
                            type="button"
                            onClick={clearDiscount}
                            className="px-2 py-1 rounded-lg text-[11px] font-bold bg-slate-200 hover:bg-slate-300 text-slate-600 transition-colors cursor-pointer"
                          >
                            Reset (0%)
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Live Pricing Breakdown / Preview Banner */}
                    {regularPrice && Number(regularPrice) > 0 ? (
                      <div className="p-3 rounded-xl bg-white border border-amber-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs">
                        <div className="space-y-0.5">
                          <div className="text-[11px] text-slate-500">Live Customer Storefront Preview:</div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-base font-black text-slate-900">
                              {formatPrice(salePrice && Number(salePrice) > 0 ? Number(salePrice) : Number(regularPrice))}
                            </span>
                            {salePrice && Number(regularPrice) > Number(salePrice) && (
                              <span className="text-xs text-slate-400 line-through">
                                {formatPrice(Number(regularPrice))}
                              </span>
                            )}
                            {discountPercent !== '' && Number(discountPercent) > 0 && (
                              <span className="px-2 py-0.5 rounded bg-rose-500 text-white font-black text-[10px] shadow-2xs">
                                -{discountPercent}% OFF
                              </span>
                            )}
                          </div>
                        </div>

                        {salePrice && Number(regularPrice) > Number(salePrice) ? (
                          <div className="sm:text-right">
                            <span className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider block">Shopper Savings</span>
                            <span className="text-xs font-black text-emerald-700">
                              Saves {formatPrice(Number(regularPrice) - Number(salePrice))} ({Math.round(((Number(regularPrice) - Number(salePrice)) / Number(regularPrice)) * 100)}% discount)
                            </span>
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-400 italic">No discount active (Sold at full retail price)</div>
                        )}
                      </div>
                    ) : null}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Categories (Select all that apply)
                      </label>
                      <div className="max-h-36 overflow-y-auto p-2 border border-slate-200 rounded-xl bg-slate-50 space-y-1.5">
                        {categories.map((c) => {
                          const isChecked = productCategories.includes(c.id);
                          return (
                            <label key={c.id} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer hover:text-slate-900">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setProductCategories((prev) => [...prev, c.id]);
                                  } else {
                                    setProductCategories((prev) => prev.filter((id) => id !== c.id));
                                  }
                                }}
                                className="rounded text-[#920d35] focus:ring-[#920d35]"
                              />
                              <span>{c.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Publication Status
                        </label>
                        <select
                          value={status}
                          onChange={(e) => setStatus(e.target.value as any)}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800"
                        >
                          <option value="published">Published (Live on Storefront)</option>
                          <option value="draft">Draft (Hidden from Storefront)</option>
                          <option value="archived">Archived</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Product Type
                        </label>
                        <select
                          value={productType}
                          onChange={(e) => setProductType(e.target.value as any)}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800"
                        >
                          <option value="physical">Physical Product (Requires Shipping/Pickup)</option>
                          <option value="digital">Digital Product / License Key</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Short Summary Description
                    </label>
                    <textarea
                      rows={2}
                      value={shortDescription}
                      onChange={(e) => setShortDescription(e.target.value)}
                      placeholder="Brief highlight of key specifications for catalog cards..."
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Full Technical Description & Specifications
                    </label>
                    <textarea
                      rows={4}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Comprehensive hardware details, ports, warranty terms, and pack contents..."
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none font-mono"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-6 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                      <input
                        type="checkbox"
                        checked={featured}
                        onChange={(e) => setFeatured(e.target.checked)}
                        className="rounded text-[#920d35] focus:ring-[#920d35]"
                      />
                      <span>Feature on Homepage Spotlight</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                      <input
                        type="checkbox"
                        checked={flashSale}
                        onChange={(e) => setFlashSale(e.target.checked)}
                        className="rounded text-[#920d35] focus:ring-[#920d35]"
                      />
                      <span>Include in Flash Deals Countdown</span>
                    </label>
                  </div>
                </div>
              )}

              {activeFormTab === 'pricing' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                    {/* 1. Regular Price */}
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        Regular Price (UGX) <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">UGX</span>
                        <input
                          type="number"
                          required
                          min={100}
                          value={regularPrice}
                          onChange={(e) => handleRegularPriceChange(e.target.value ? Number(e.target.value) : '')}
                          placeholder="3500000"
                          className="w-full pl-13 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#920d35]"
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 block">Full retail catalog price</span>
                    </div>

                    {/* 2. Discount % */}
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center justify-between">
                        <span>Discount (%)</span>
                        {discountPercent !== '' && Number(discountPercent) > 0 && (
                          <span className="text-[10px] font-bold text-rose-600">Active</span>
                        )}
                      </label>
                      <div className="relative">
                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-rose-500">%</span>
                        <input
                          type="number"
                          min={0}
                          max={99}
                          value={discountPercent}
                          onChange={(e) => handleDiscountPercentChange(e.target.value ? Number(e.target.value) : '')}
                          placeholder="15"
                          className="w-full pl-3.5 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-extrabold text-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-500"
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 block">Percentage deduction</span>
                    </div>

                    {/* 3. Discount Amount (UGX) */}
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center justify-between">
                        <span>Discount Cut (UGX)</span>
                        {discountAmount !== '' && Number(discountAmount) > 0 && (
                          <span className="text-[10px] font-bold text-emerald-600">Saved</span>
                        )}
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">UGX</span>
                        <input
                          type="number"
                          min={0}
                          value={discountAmount}
                          onChange={(e) => handleDiscountAmountChange(e.target.value ? Number(e.target.value) : '')}
                          placeholder="e.g. 250000"
                          className="w-full pl-13 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-extrabold text-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 block">Amount saved in UGX</span>
                    </div>

                    {/* 4. Discounted Sale Price */}
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        Sale Price (UGX - Optional)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">UGX</span>
                        <input
                          type="number"
                          min={100}
                          value={salePrice}
                          onChange={(e) => handleSalePriceChange(e.target.value ? Number(e.target.value) : '')}
                          placeholder={regularPrice ? String(regularPrice) : '3200000'}
                          className={`w-full pl-13 pr-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs sm:text-sm font-extrabold focus:outline-none ${
                            salePrice && regularPrice && Number(regularPrice) > Number(salePrice)
                              ? 'border-emerald-400 text-emerald-700 bg-emerald-50/40'
                              : 'border-slate-200 text-slate-900'
                          }`}
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 block">Discounted customer selling price</span>
                    </div>
                  </div>

                  {/* Quick 1-Click Preset Discount Buttons */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="text-[11px] font-bold text-slate-600 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-amber-500" />
                        <span>Quick Discount Presets:</span>
                      </div>
                      {discountPercent !== '' && Number(discountPercent) > 0 && (
                        <button
                          type="button"
                          onClick={clearDiscount}
                          className="text-[11px] font-bold text-rose-600 hover:text-rose-800 underline cursor-pointer"
                        >
                          Clear Discount
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {[5, 10, 15, 20, 25, 30, 40, 50].map((pct) => {
                        const isSelected = Number(discountPercent) === pct;
                        return (
                          <button
                            key={pct}
                            type="button"
                            onClick={() => applyDiscountPreset(pct)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-rose-600 text-white shadow-xs scale-105'
                                : 'bg-white hover:bg-rose-50 text-slate-700 border border-slate-200 hover:border-rose-200'
                            }`}
                          >
                            {pct}% OFF
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Live Pricing Breakdown / Preview Banner */}
                  {regularPrice && Number(regularPrice) > 0 ? (
                    <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="text-[11px] text-slate-500">Live Customer Storefront Price:</div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-base font-black text-slate-900">
                            {formatPrice(salePrice && Number(salePrice) > 0 ? Number(salePrice) : Number(regularPrice))}
                          </span>
                          {salePrice && Number(regularPrice) > Number(salePrice) && (
                            <span className="text-xs text-slate-400 line-through">
                              {formatPrice(Number(regularPrice))}
                            </span>
                          )}
                          {discountPercent !== '' && Number(discountPercent) > 0 && (
                            <span className="px-2 py-0.5 rounded bg-rose-500 text-white font-black text-[10px] shadow-2xs">
                              -{discountPercent}% OFF
                            </span>
                          )}
                        </div>
                      </div>

                      {salePrice && Number(regularPrice) > Number(salePrice) ? (
                        <div className="sm:text-right">
                          <span className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider block">Customer Savings</span>
                          <span className="text-xs font-black text-emerald-700">
                            Saves {formatPrice(Number(regularPrice) - Number(salePrice))} ({Math.round(((Number(regularPrice) - Number(salePrice)) / Number(regularPrice)) * 100)}% off)
                          </span>
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-400 italic">No discount active</div>
                      )}
                    </div>
                  ) : null}

                  {/* Purchase Cost & Profit (Visible to authorized staff) */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center gap-1.5 text-xs font-black text-slate-800">
                      <TrendingUp className="w-4 h-4 text-cyan-600" />
                      <span>Staff Cost & Profit Calculations (Confidential)</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          Purchase / Wholesale Cost (UGX)
                        </label>
                        <input
                          type="number"
                          value={purchaseCost}
                          onChange={(e) => setPurchaseCost(e.target.value ? Number(e.target.value) : '')}
                          placeholder="2800000"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                        />
                      </div>

                      <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                        <div className="text-[10px] text-slate-400 font-semibold">Estimated Gross Profit</div>
                        <div className="text-sm font-bold text-emerald-600 mt-0.5">
                          {regularPrice && purchaseCost
                            ? formatPrice(Number(salePrice || regularPrice) - Number(purchaseCost))
                            : '—'}
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                        <div className="text-[10px] text-slate-400 font-semibold">Profit Margin</div>
                        <div className="text-sm font-bold text-cyan-700 mt-0.5">
                          {regularPrice && purchaseCost && Number(salePrice || regularPrice) > 0
                            ? `${Math.round(
                                ((Number(salePrice || regularPrice) - Number(purchaseCost)) /
                                  Number(salePrice || regularPrice)) *
                                  100
                              )}%`
                            : '—'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeFormTab === 'inventory' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Stock Quantity <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        required
                        value={stockQuantity}
                        onChange={(e) => setStockQuantity(e.target.value ? Number(e.target.value) : '')}
                        placeholder="10"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Low Stock Alert Threshold
                      </label>
                      <input
                        type="number"
                        value={lowStockThreshold}
                        onChange={(e) => setLowStockThreshold(e.target.value ? Number(e.target.value) : '')}
                        placeholder="3"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Official Warranty Coverage
                      </label>
                      <input
                        type="text"
                        value={warranty}
                        onChange={(e) => setWarranty(e.target.value)}
                        placeholder="1 Year Official Manufacturer Warranty"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Weight (Package)
                      </label>
                      <input
                        type="text"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        placeholder="e.g. 1.8 kg"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Dimensions (Length × Width × Height cm)
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="text"
                        value={length}
                        onChange={(e) => setLength(e.target.value)}
                        placeholder="L (cm)"
                        className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                      />
                      <input
                        type="text"
                        value={width}
                        onChange={(e) => setWidth(e.target.value)}
                        placeholder="W (cm)"
                        className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                      />
                      <input
                        type="text"
                        value={height}
                        onChange={(e) => setHeight(e.target.value)}
                        placeholder="H (cm)"
                        className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeFormTab === 'images' && (
                <div className="space-y-4">
                  {/* Upload controls */}
                  <div className="p-4 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 text-center">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept="image/*"
                      className="hidden"
                      id="product-image-file-input"
                    />
                    <label
                      htmlFor="product-image-file-input"
                      className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs cursor-pointer shadow-xs transition-all ${
                        isUploadingImage
                          ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                          : 'bg-[#920d35] hover:bg-[#770929] text-white'
                      }`}
                    >
                      <Upload className="w-4 h-4" />
                      <span>{isUploadingImage ? 'Uploading to Firebase Storage...' : 'Upload Image to Storage'}</span>
                    </label>
                    <p className="text-[11px] text-slate-400 mt-2">
                      Supports JPG, PNG, WebP up to 15MB. Stored permanently in Cloud Storage.
                    </p>

                    <div className="mt-3 flex items-center justify-center gap-2 max-w-md mx-auto">
                      <input
                        type="url"
                        value={newImageUrl}
                        onChange={(e) => setNewImageUrl(e.target.value)}
                        placeholder="Or paste external image URL..."
                        className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleAddImageUrl}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
                      >
                        Add URL
                      </button>
                    </div>
                  </div>

                  {/* Image Grid Preview */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">
                      Gallery Images ({images.length})
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {images.map((img, idx) => (
                        <div
                          key={img.id || idx}
                          className="relative group rounded-xl border border-slate-200 bg-slate-50 p-2 flex flex-col items-center overflow-hidden"
                        >
                          <img
                            src={img.src}
                            alt={img.alt || 'Product image'}
                            className="w-full h-24 object-contain rounded-lg"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = '/logo.png';
                            }}
                          />
                          <div className="text-[10px] text-slate-400 truncate w-full mt-1.5 text-center">
                            {idx === 0 ? 'Primary Thumbnail' : `Image #${idx + 1}`}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(img.id)}
                            className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-xs"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeFormTab === 'seo' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      SEO Meta Title
                    </label>
                    <input
                      type="text"
                      value={seoTitle}
                      onChange={(e) => setSeoTitle(e.target.value)}
                      placeholder={name || 'Meta title for Google search results...'}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      SEO Meta Description
                    </label>
                    <textarea
                      rows={3}
                      value={seoDescription}
                      onChange={(e) => setSeoDescription(e.target.value)}
                      placeholder={shortDescription || 'Search engine summary snippet...'}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Tags (Comma separated)
                    </label>
                    <input
                      type="text"
                      value={tagsInput}
                      onChange={(e) => setTagsInput(e.target.value)}
                      placeholder="e.g. laptop, core i7, 16gb, ssd, business"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Form Actions */}
              <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-[#920d35] hover:bg-[#770929] text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSaving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isSaving ? 'Saving to Database...' : editingProduct ? 'Save Changes' : 'Publish Product'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CATEGORIES MANAGEMENT MODAL */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full my-8 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-cyan-600" />
                <h3 className="font-bold text-slate-900 text-base">Category Management</h3>
              </div>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Create Category Form */}
            <form onSubmit={handleCreateCategory} className="space-y-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="text-xs font-bold text-slate-800">Add New Category</div>
              <input
                type="text"
                required
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Category Name e.g. Gaming Monitors"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
              />
              <input
                type="text"
                value={newCategoryDescription}
                onChange={(e) => setNewCategoryDescription(e.target.value)}
                placeholder="Brief description..."
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
              />
              <button
                type="submit"
                className="w-full py-2 bg-[#920d35] hover:bg-[#770929] text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Create Category
              </button>
            </form>

            {/* Category List */}
            <div className="space-y-2 max-h-60 overflow-y-auto">
              <div className="text-xs font-bold text-slate-700">Existing Categories ({categories.length})</div>
              {categories.map((c) => (
                <div key={c.id} className="p-2.5 rounded-xl border border-slate-100 bg-white flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-800">{c.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono ml-2">/{c.slug}</span>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      if (window.confirm(`Delete category '${c.name}'?`)) {
                        await api.deleteCategory(c.id);
                        setCategories((prev) => prev.filter((item) => item.id !== c.id));
                        showToast(`Category deleted.`);
                      }
                    }}
                    className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
