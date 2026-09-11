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
} from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { HomepageSectionConfig } from '../../types';

export const AdminHomepageBuilder: React.FC = () => {
  const { config, updateCategorySettings, showToast, setCurrentView } = useShop();

  const homepageSettings = config.homepage;
  const [sections, setSections] = useState<HomepageSectionConfig[]>(homepageSettings.sections || []);
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

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateCategorySettings('homepage', {
        ...homepageSettings,
        sections,
        hero_title: heroTitle,
        hero_subtitle: heroSubtitle,
        hero_image: heroImage,
      });
      showToast('Homepage layout and content saved successfully!');
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
