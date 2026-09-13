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
  Sparkles,
  Laptop,
  Plus,
  Trash2,
  ExternalLink,
  Tag,
} from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { HomepageSectionConfig, HeroBanner } from '../../types';
import { INITIAL_HERO_BANNERS } from '../../data/cyberCatalog';

export const AdminHomepageBuilder: React.FC = () => {
  const { config, updateCategorySettings, showToast, setCurrentView, products } = useShop();

  const homepageSettings = config.homepage || {};
  const [sections, setSections] = useState<HomepageSectionConfig[]>(homepageSettings.sections || []);
  const [banners, setBanners] = useState<HeroBanner[]>(
    homepageSettings.banners && homepageSettings.banners.length > 0
      ? homepageSettings.banners
      : INITIAL_HERO_BANNERS
  );
  const [heroTitle, setHeroTitle] = useState(homepageSettings.hero_title || 'Welcome to Cyber Dynamic Tech');
  const [heroSubtitle, setHeroSubtitle] = useState(homepageSettings.hero_subtitle || 'Genuine Laptops, Printers & Networking in Uganda');
  const [heroImage, setHeroImage] = useState(homepageSettings.hero_image || '');
  const [isSaving, setIsSaving] = useState(false);

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
      subtitle: selected.short_description?.slice(0, 90) || 'Genuine official hardware with 1-Year Warranty',
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
        hero_image: heroImage,
      });
      showToast('Homepage product banners & layout saved successfully!');
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
            <Home className="w-4 h-4 text-cyan-600" />
            <span>Interactive Homepage Section Builder & Customizer</span>
          </h2>
          <p className="text-xs text-slate-500">
            Reorder, toggle, and configure hero banners without modifying frontend code.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentView('home')}
            className="px-3 py-1.5 border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-slate-400" />
            <span>Preview Storefront</span>
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving...' : 'Save Homepage Layout'}</span>
          </button>
        </div>
      </div>

      {/* Hero Banner Details */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
        <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Hero Banner Content</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Headline Text</label>
            <input
              type="text"
              value={heroTitle}
              onChange={(e) => setHeroTitle(e.target.value)}
              className="w-full h-8.5 px-3 bg-white border border-slate-200 rounded-lg text-xs"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Sub-headline / Tagline</label>
            <input
              type="text"
              value={heroSubtitle}
              onChange={(e) => setHeroSubtitle(e.target.value)}
              className="w-full h-8.5 px-3 bg-white border border-slate-200 rounded-lg text-xs"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="font-bold text-slate-700 block mb-1">Hero Background / Banner Image URL</label>
            <input
              type="url"
              value={heroImage}
              onChange={(e) => setHeroImage(e.target.value)}
              placeholder="https://... optional custom hero image banner"
              className="w-full h-8.5 px-3 bg-white border border-slate-200 rounded-lg text-xs"
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
