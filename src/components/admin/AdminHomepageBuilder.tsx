import React, { useState } from 'react';
import {
  Home,
  Layers,
  Eye,
  ArrowUp,
  ArrowDown,
  Save,
  CheckCircle2,
  Image as ImageIcon,
  Laptop,
  Plus,
  Trash2,
  ExternalLink,
  Tag,
  Upload,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { HomepageSectionConfig, HeroBanner } from '../../types';
import { INITIAL_HERO_BANNERS } from '../../data/cyberCatalog';
import { stripHtmlToPlainText } from '../../utils/sanitizeWooCommerceHtml';

export const AdminHomepageBuilder: React.FC = () => {
  const { config, updateCategorySettings, showToast, setCurrentView, products } = useShop();

  const homepageSettings = config.homepage || {};
  const [sections, setSections] = useState<HomepageSectionConfig[]>(homepageSettings.sections || []);
  const [banners, setBanners] = useState<HeroBanner[]>(
    homepageSettings.banners && homepageSettings.banners.length > 0
      ? homepageSettings.banners
      : INITIAL_HERO_BANNERS
  );
  const [heroTitle, setHeroTitle] = useState(homepageSettings.hero_title || 'Welcome to Cyber Dynamic Technologies');
  const [heroSubtitle, setHeroSubtitle] = useState(homepageSettings.hero_subtitle || 'Genuine Laptops, Printers & Networking in Uganda');
  const [heroBannerImage, setHeroBannerImage] = useState(
    homepageSettings.hero_banner_image || homepageSettings.hero_image || '/assets/cdt-hero-banner.svg'
  );
  const [heroBannerLink, setHeroBannerLink] = useState(homepageSettings.hero_banner_link || 'shop');
  const [heroBannerAlt, setHeroBannerAlt] = useState(
    homepageSettings.hero_banner_alt || 'Cyber Dynamic Technologies Official Banner'
  );
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (PNG, JPG, WebP, SVG).');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      showToast('Image file too large. Please select an image under 8MB.');
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setHeroBannerImage(reader.result);
        showToast('Hero banner image loaded! Remember to click "Save Homepage Layout" to persist.');
      }
      setIsUploading(false);
    };
    reader.onerror = () => {
      showToast('Failed to read image file.');
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sections.length) return;
    const updated = [...sections];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    // update order numbers
    updated.forEach((s, idx) => {
      s.order = idx + 1;
    });
    setSections(updated);
  };

  const toggleSection = (index: number) => {
    const updated = [...sections];
    updated[index] = { ...updated[index], enabled: !updated[index].enabled };
    setSections(updated);
  };

  const updateBannerField = (index: number, field: keyof HeroBanner, value: any) => {
    const updated = [...banners];
    updated[index] = { ...updated[index], [field]: value };
    setBanners(updated);
  };

  const handleProductSelectForBanner = (index: number, productId: number) => {
    const selected = products.find((p) => p.id === productId);
    if (!selected) return;

    const updated = [...banners];
    updated[index] = {
      ...updated[index],
      productId: selected.id,
      title: selected.name,
      subtitle: stripHtmlToPlainText(selected.short_description)?.slice(0, 90) || 'Genuine official hardware with 1-Year Warranty',
      brand: selected.brand || updated[index].brand,
      highlightPrice: `UGX ${selected.price.toLocaleString()}`,
      originalPrice: selected.regular_price ? `UGX ${selected.regular_price.toLocaleString()}` : undefined,
      imageUrl: selected.images?.[0]?.src || updated[index].imageUrl,
      ctaLink: `product:${selected.id}`,
    };
    setBanners(updated);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateCategorySettings('homepage', {
        ...homepageSettings,
        sections,
        banners,
        hero_title: heroTitle,
        hero_subtitle: heroSubtitle,
        hero_image: heroBannerImage,
        hero_banner_image: heroBannerImage,
        hero_banner_link: heroBannerLink,
        hero_banner_alt: heroBannerAlt,
      });
      showToast('Homepage hero banner & layout saved successfully!');
    } catch (err: any) {
      showToast('Failed to save homepage: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-5 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <Home className="w-4 h-4 text-[#920d35]" />
            <span>Interactive Homepage Section Builder & Customizer</span>
          </h2>
          <p className="text-xs text-slate-500">
            Upload new hero image banners, customize links, and reorder storefront sections with official dark red, maroon, and gold styling.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentView('home')}
            className="px-3 py-1.5 border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Eye className="w-3.5 h-3.5 text-slate-400" />
            <span>Preview Storefront</span>
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-1.5 bg-[#920d35] hover:bg-[#770929] disabled:opacity-50 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-sm cursor-pointer transition-all border border-[#f59e0b]/40"
          >
            <Save className="w-3.5 h-3.5 text-[#fbbf24]" />
            <span>{isSaving ? 'Saving...' : 'Save Homepage Layout'}</span>
          </button>
        </div>
      </div>

      {/* Hero Banner Image Upload & Configuration (Requested Feature) */}
      <div className="bg-gradient-to-br from-slate-900 via-[#1e293b] to-[#0f172a] text-white border border-slate-800 rounded-2xl p-5 space-y-4 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-[#fbbf24]" />
              <span>Hero Banner Image (Direct Upload & Link)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Upload your branded promotional graphic or banner photo. It is prominently displayed at the top of the homepage.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label
              htmlFor="hero-banner-upload-input"
              className="px-3.5 py-2 bg-gradient-to-r from-[#920d35] to-[#580c1f] hover:brightness-110 text-white border border-[#f59e0b]/50 rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm cursor-pointer transition-all active:scale-95"
            >
              <Upload className="w-3.5 h-3.5 text-[#fbbf24]" />
              <span>{isUploading ? 'Loading...' : 'Upload Image Banner'}</span>
            </label>
            <input
              id="hero-banner-upload-input"
              type="file"
              accept="image/*"
              disabled={isUploading}
              onChange={handleFileUpload}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => {
                setHeroBannerImage('/assets/cdt-hero-banner.svg');
                showToast('Reset to official CDT Dark Red & Gold SVG banner.');
              }}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Reset to official CDT Dark Red / Gold vector banner"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Use Default CDT Banner</span>
            </button>
          </div>
        </div>

        {/* Live Banner Preview Frame */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-bold flex items-center gap-1.5 text-slate-300">
              <Sparkles className="w-3.5 h-3.5 text-[#fbbf24]" />
              Live Storefront Hero Preview:
            </span>
            <span>Recommended aspect ratio: 21:9 or 16:6 (e.g. 1920x600 px)</span>
          </div>

          <div className="relative rounded-xl overflow-hidden border-2 border-[#920d35]/60 shadow-inner bg-slate-950/80 group">
            {heroBannerImage ? (
              <img
                src={heroBannerImage}
                alt={heroBannerAlt}
                className="w-full h-44 sm:h-60 md:h-72 object-cover object-center transition-all duration-300 group-hover:scale-[1.01]"
              />
            ) : (
              <div className="w-full h-48 flex flex-col items-center justify-center text-slate-500">
                <ImageIcon className="w-10 h-10 mb-2 opacity-40 text-slate-400" />
                <p className="text-xs font-semibold">No banner image uploaded</p>
              </div>
            )}

            <div className="absolute bottom-2 left-2 px-2.5 py-1 bg-black/70 backdrop-blur-xs rounded-md text-[11px] font-mono text-[#fbbf24] border border-[#f59e0b]/30">
              Links to: <span className="text-white font-bold">/{heroBannerLink || 'shop'}</span>
            </div>
          </div>
        </div>

        {/* Link & Alt Meta Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2 text-xs">
          <div>
            <label className="font-bold text-slate-300 block mb-1">Click Action / Target View</label>
            <select
              value={heroBannerLink}
              onChange={(e) => setHeroBannerLink(e.target.value)}
              className="w-full h-9 px-3 bg-slate-800 border border-slate-700 text-white rounded-lg focus:outline-hidden focus:border-[#920d35]"
            >
              <option value="shop">Catalog / Shop All Products</option>
              <option value="category:laptops">Category: Laptops & Workstations</option>
              <option value="category:printers">Category: Printers & Copiers</option>
              <option value="category:networking">Category: Networking & Security</option>
              <option value="pos">Launch Cashier POS Terminal</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-300 block mb-1">Banner Image URL or Data</label>
            <input
              type="text"
              value={heroBannerImage}
              onChange={(e) => setHeroBannerImage(e.target.value)}
              placeholder="https://... or uploaded base64 data"
              className="w-full h-9 px-3 bg-slate-800 border border-slate-700 text-slate-200 rounded-lg text-xs font-mono focus:outline-hidden focus:border-[#920d35]"
            />
          </div>

          <div>
            <label className="font-bold text-slate-300 block mb-1">Alt / Accessibility Text</label>
            <input
              type="text"
              value={heroBannerAlt}
              onChange={(e) => setHeroBannerAlt(e.target.value)}
              placeholder="Cyber Dynamic Tech Promotional Banner"
              className="w-full h-9 px-3 bg-slate-800 border border-slate-700 text-slate-200 rounded-lg text-xs focus:outline-hidden focus:border-[#920d35]"
            />
          </div>
        </div>
      </div>

      {/* Hero Headline Content */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
        <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
          <Tag className="w-3.5 h-3.5 text-[#f59e0b]" />
          <span>Hero Banner Text Overlay (Optional)</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Headline Text</label>
            <input
              type="text"
              value={heroTitle}
              onChange={(e) => setHeroTitle(e.target.value)}
              className="w-full h-8.5 px-3 bg-white border border-slate-200 rounded-lg text-xs focus:border-[#920d35]"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Sub-headline / Tagline</label>
            <input
              type="text"
              value={heroSubtitle}
              onChange={(e) => setHeroSubtitle(e.target.value)}
              className="w-full h-8.5 px-3 bg-white border border-slate-200 rounded-lg text-xs focus:border-[#920d35]"
            />
          </div>
        </div>
      </div>

      {/* Featured Hardware Products in Hero Carousel */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
        <div className="flex items-center justify-between gap-3 pb-2 border-b border-slate-100">
          <div>
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Laptop className="w-3.5 h-3.5 text-cyan-600" />
              <span>Featured Product Banners ({banners.length} Active Items)</span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Each banner displays a specific hardware product with specs, pricing, and direct "Add to Cart" integration.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {banners.map((banner, bIdx) => (
            <div
              key={banner.id || bIdx}
              className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-cyan-100 text-cyan-800 font-bold text-[10px] flex items-center justify-center">
                    {bIdx + 1}
                  </span>
                  <span className="font-bold text-xs text-slate-900 truncate max-w-xs">{banner.title}</span>
                  {banner.brand && (
                    <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px] font-bold">
                      {banner.brand}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-[11px] font-medium text-slate-600 flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={banner.active !== false}
                      onChange={(e) => updateBannerField(bIdx, 'active', e.target.checked)}
                      className="rounded text-cyan-600"
                    />
                    <span>Active in Slider</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Link to Catalog Product</label>
                  <select
                    value={banner.productId || ''}
                    onChange={(e) => handleProductSelectForBanner(bIdx, Number(e.target.value))}
                    className="w-full h-8 px-2 bg-white border border-slate-200 rounded text-xs"
                  >
                    <option value="">-- Choose Hardware Product --</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (UGX {p.price.toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Product Headline Title</label>
                  <input
                    type="text"
                    value={banner.title}
                    onChange={(e) => updateBannerField(bIdx, 'title', e.target.value)}
                    className="w-full h-8 px-2 bg-white border border-slate-200 rounded text-xs"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Badge Tag</label>
                  <input
                    type="text"
                    value={banner.badge || ''}
                    onChange={(e) => updateBannerField(bIdx, 'badge', e.target.value)}
                    placeholder="e.g. FLAGSHIP LAPTOP"
                    className="w-full h-8 px-2 bg-white border border-slate-200 rounded text-xs"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Key Specs / Subtitle</label>
                  <input
                    type="text"
                    value={banner.subtitle || ''}
                    onChange={(e) => updateBannerField(bIdx, 'subtitle', e.target.value)}
                    className="w-full h-8 px-2 bg-white border border-slate-200 rounded text-xs"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Highlight Price</label>
                  <input
                    type="text"
                    value={banner.highlightPrice || ''}
                    onChange={(e) => updateBannerField(bIdx, 'highlightPrice', e.target.value)}
                    placeholder="UGX 2,850,000"
                    className="w-full h-8 px-2 bg-white border border-slate-200 rounded text-xs"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section Reordering List */}
      <div className="space-y-3">
        <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-cyan-600" />
          <span>Section Order & Visibility (Drag / Up / Down)</span>
        </h3>

        <div className="space-y-2">
          {sections.map((sec, idx) => (
            <div
              key={sec.id}
              className={`p-3 rounded-lg border transition-all flex items-center justify-between gap-3 ${
                sec.enabled
                  ? 'bg-white border-slate-200 shadow-2xs'
                  : 'bg-slate-100/70 border-slate-200 opacity-60'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded bg-slate-100 text-slate-500 font-bold text-xs flex items-center justify-center">
                  {idx + 1}
                </span>

                <div>
                  <h4 className="font-bold text-xs text-slate-900">{sec.title}</h4>
                  <span className="text-[10px] text-slate-400 font-mono">ID: {sec.id}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <label className="relative inline-flex items-center cursor-pointer mr-2">
                  <input
                    type="checkbox"
                    checked={sec.enabled}
                    onChange={() => toggleSection(idx)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-600"></div>
                </label>

                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() => moveSection(idx, 'up')}
                  className="w-7 h-7 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-30 flex items-center justify-center cursor-pointer"
                  title="Move Up"
                >
                  <ArrowUp className="w-3.5 h-3.5 text-slate-600" />
                </button>

                <button
                  type="button"
                  disabled={idx === sections.length - 1}
                  onClick={() => moveSection(idx, 'down')}
                  className="w-7 h-7 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-30 flex items-center justify-center cursor-pointer"
                  title="Move Down"
                >
                  <ArrowDown className="w-3.5 h-3.5 text-slate-600" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
