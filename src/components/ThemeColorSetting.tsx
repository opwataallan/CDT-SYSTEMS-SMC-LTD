import React, { useState, useEffect } from 'react';
import { Palette, Check, RotateCcw, Sparkles, Sliders } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { settingsService } from '../services/settingsService';

export interface ThemePreset {
  name: string;
  hex: string;
  description: string;
  isDefault?: boolean;
}

export const THEME_COLOR_PRESETS: ThemePreset[] = [
  {
    name: 'Cyber Burgundy',
    hex: '#920d35',
    description: 'Official Brand Primary',
    isDefault: true,
  },
  {
    name: 'Forest Green',
    hex: '#007f19',
    description: 'Eco & Ugandan Agro',
  },
  {
    name: 'Electric Cyan',
    hex: '#009bb5',
    description: 'High Tech Digital',
  },
  {
    name: 'Sapphire Blue',
    hex: '#1d4ed8',
    description: 'Enterprise & Corporate',
  },
  {
    name: 'Amethyst Purple',
    hex: '#7c3aed',
    description: 'Modern Premium',
  },
  {
    name: 'Sunset Orange',
    hex: '#ea580c',
    description: 'High Energy Marketplace',
  },
  {
    name: 'Midnight Slate',
    hex: '#0f172a',
    description: 'Sleek Dark Minimalist',
  },
];

interface ThemeColorSettingProps {
  mode?: 'full' | 'compact' | 'popover';
  onClose?: () => void;
  className?: string;
}

export const ThemeColorSetting: React.FC<ThemeColorSettingProps> = ({
  mode = 'full',
  onClose,
  className = '',
}) => {
  const { config, primaryColor, setThemeColor, updateCategorySettings, showToast, setCurrentView } = useShop();

  const [currentColor, setCurrentColor] = useState(primaryColor || '#920d35');
  const [secondaryColor, setSecondaryColor] = useState(config?.branding?.secondary_color || '#0f172a');
  const [accentColor, setAccentColor] = useState(config?.branding?.accent_color || '#770929');
  const [isApplying, setIsApplying] = useState(false);

  useEffect(() => {
    if (primaryColor) {
      setCurrentColor(primaryColor);
    }
  }, [primaryColor]);

  const handleSelectColor = async (hex: string) => {
    setCurrentColor(hex);
    setIsApplying(true);
    try {
      await setThemeColor(hex);
      showToast(`Theme color updated to ${hex}`);
    } catch (e: any) {
      showToast(`Applied color ${hex}`);
    } finally {
      setIsApplying(false);
    }
  };

  const handleResetToBurgundy = async () => {
    const defaultColor = '#920d35';
    setCurrentColor(defaultColor);
    setIsApplying(true);
    try {
      await setThemeColor(defaultColor);
      await updateCategorySettings('branding', {
        primary_color: defaultColor,
        secondary_color: '#0f172a',
        accent_color: '#770929',
      });
      showToast('Theme color reset to official Cyber Burgundy (#920d35)');
    } catch (e: any) {
      settingsService.setPrimaryColor(defaultColor);
      showToast('Theme reset to #920d35');
    } finally {
      setIsApplying(false);
    }
  };

  // Compact / Popover Mode
  if (mode === 'popover' || mode === 'compact') {
    return (
      <div
        id="theme-color-popover"
        className={`w-72 bg-white rounded-xl shadow-2xl border border-slate-200 p-3.5 text-slate-800 animate-in fade-in-50 zoom-in-95 duration-150 z-50 ${className}`}
      >
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
          <div className="flex items-center gap-1.5">
            <Palette className="w-4 h-4 text-cyan-600" />
            <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Theme Color Setting
            </span>
          </div>
          <button
            type="button"
            onClick={handleResetToBurgundy}
            className="text-[10px] font-bold text-slate-500 hover:text-cyan-600 flex items-center gap-1 cursor-pointer"
            title="Reset to #920d35"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>

        <p className="text-[11px] text-slate-500 mb-2.5">
          Select or customize the primary brand color for the entire website:
        </p>

        {/* Preset swatches grid */}
        <div className="grid grid-cols-4 gap-1.5 mb-3">
          {THEME_COLOR_PRESETS.map((preset) => {
            const isSelected = currentColor.toLowerCase() === preset.hex.toLowerCase();
            return (
              <button
                key={preset.hex}
                type="button"
                onClick={() => handleSelectColor(preset.hex)}
                className={`group relative flex flex-col items-center p-1.5 rounded-lg border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-slate-800 bg-slate-50 ring-2 ring-slate-800/10'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                }`}
                title={`${preset.name} (${preset.hex}) - ${preset.description}`}
              >
                <div
                  className="w-6 h-6 rounded-full shadow-inner flex items-center justify-center transition-transform group-hover:scale-105"
                  style={{ backgroundColor: preset.hex }}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                </div>
                <span className="text-[9px] font-bold text-slate-700 truncate max-w-[50px] mt-1">
                  {preset.name.split(' ')[0]}
                </span>
                {preset.isDefault && (
                  <span className="text-[7px] uppercase font-black px-1 rounded bg-amber-100 text-amber-800">
                    Main
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Custom hex color input */}
        <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
          <div className="flex items-center gap-2 flex-1">
            <input
              type="color"
              value={currentColor}
              onChange={(e) => handleSelectColor(e.target.value)}
              className="w-7 h-7 rounded border border-slate-200 p-0.5 cursor-pointer"
              title="Pick custom color"
            />
            <div className="flex-1">
              <input
                type="text"
                value={currentColor}
                onChange={(e) => {
                  const val = e.target.value;
                  setCurrentColor(val);
                  if (/^#([0-9A-F]{3}){1,2}$/i.test(val)) {
                    handleSelectColor(val);
                  }
                }}
                placeholder="#920d35"
                maxLength={7}
                className="w-full h-7 px-2 font-mono text-xs uppercase font-bold text-slate-800 border border-slate-200 rounded focus:outline-hidden focus:border-cyan-500"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleSelectColor(currentColor)}
            disabled={isApplying}
            className="h-7 px-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-[11px] font-bold cursor-pointer transition-colors"
          >
            Apply
          </button>
        </div>

        {/* Link to full admin appearance settings */}
        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
          <span className="text-slate-400 font-mono text-[10px]">{currentColor}</span>
          <button
            type="button"
            onClick={() => {
              if (onClose) onClose();
              setCurrentView('admin');
            }}
            className="text-cyan-600 hover:underline font-bold flex items-center gap-1"
          >
            <Sliders className="w-3 h-3" />
            <span>More Settings</span>
          </button>
        </div>
      </div>
    );
  }

  // Full Mode (for Admin Appearance / Branding Center)
  return (
    <div
      id="theme-color-setting-card"
      className={`bg-white rounded-xl border border-slate-200 p-5 space-y-5 shadow-xs ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center text-white shadow-xs"
            style={{ backgroundColor: currentColor }}
          >
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900">Marketplace Theme Color & Branding</h3>
            <p className="text-xs text-slate-500">
              Active Theme Color: <strong className="font-mono text-slate-800">{currentColor}</strong>{' '}
              {currentColor.toLowerCase() === '#920d35' && (
                <span className="inline-block ml-1 px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold uppercase">
                  Default Official
                </span>
              )}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleResetToBurgundy}
          className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
          <span>Reset to #920d35</span>
        </button>
      </div>

      {/* Preset Swatches Palette */}
      <div>
        <label className="text-xs font-bold text-slate-800 block mb-2">
          Curated Theme Color Presets
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {THEME_COLOR_PRESETS.map((preset) => {
            const isSelected = currentColor.toLowerCase() === preset.hex.toLowerCase();
            return (
              <button
                key={preset.hex}
                type="button"
                onClick={() => handleSelectColor(preset.hex)}
                className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col gap-2 ${
                  isSelected
                    ? 'border-slate-800 bg-slate-50 ring-2 ring-slate-800/10'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div
                    className="w-7 h-7 rounded-full shadow-inner flex items-center justify-center"
                    style={{ backgroundColor: preset.hex }}
                  >
                    {isSelected && <Check className="w-4 h-4 text-white stroke-[3]" />}
                  </div>
                  {preset.isDefault && (
                    <span className="text-[9px] font-black uppercase bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                      Official
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">{preset.name}</p>
                  <p className="text-[10px] font-mono text-slate-500">{preset.hex}</p>
                  <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{preset.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Color Fine-Tuning */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
        <div>
          <label className="font-bold text-slate-800 block mb-1 text-xs">
            Primary Theme Color (Hex)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={currentColor}
              onChange={(e) => handleSelectColor(e.target.value)}
              className="w-10 h-8.5 rounded border border-slate-200 cursor-pointer p-0.5"
            />
            <input
              type="text"
              value={currentColor}
              onChange={(e) => {
                const val = e.target.value;
                setCurrentColor(val);
                if (/^#([0-9A-F]{3}){1,2}$/i.test(val)) {
                  handleSelectColor(val);
                }
              }}
              placeholder="#920d35"
              maxLength={7}
              className="flex-1 h-8.5 px-3 border border-slate-200 rounded-lg text-xs font-mono uppercase font-bold text-slate-800"
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Applies to buttons, navbar highlights, accents & badges</p>
        </div>

        <div>
          <label className="font-bold text-slate-800 block mb-1 text-xs">
            Secondary Surface Color
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={secondaryColor}
              onChange={(e) => {
                setSecondaryColor(e.target.value);
                updateCategorySettings('branding', { secondary_color: e.target.value });
              }}
              className="w-10 h-8.5 rounded border border-slate-200 cursor-pointer p-0.5"
            />
            <input
              type="text"
              value={secondaryColor}
              onChange={(e) => {
                setSecondaryColor(e.target.value);
                if (/^#([0-9A-F]{3}){1,2}$/i.test(e.target.value)) {
                  updateCategorySettings('branding', { secondary_color: e.target.value });
                }
              }}
              placeholder="#0f172a"
              maxLength={7}
              className="flex-1 h-8.5 px-3 border border-slate-200 rounded-lg text-xs font-mono uppercase font-bold text-slate-800"
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Used on dark headers, hero cards, and contrast bars</p>
        </div>

        <div>
          <label className="font-bold text-slate-800 block mb-1 text-xs">
            Accent / Hover Tone
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={accentColor}
              onChange={(e) => {
                setAccentColor(e.target.value);
                updateCategorySettings('branding', { accent_color: e.target.value });
              }}
              className="w-10 h-8.5 rounded border border-slate-200 cursor-pointer p-0.5"
            />
            <input
              type="text"
              value={accentColor}
              onChange={(e) => {
                setAccentColor(e.target.value);
                if (/^#([0-9A-F]{3}){1,2}$/i.test(e.target.value)) {
                  updateCategorySettings('branding', { accent_color: e.target.value });
                }
              }}
              placeholder="#770929"
              maxLength={7}
              className="flex-1 h-8.5 px-3 border border-slate-200 rounded-lg text-xs font-mono uppercase font-bold text-slate-800"
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Used on button hover states and subtle gradient glows</p>
        </div>
      </div>

      {/* Real-time preview sample bar */}
      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span className="font-bold text-slate-700">Live Preview:</span>
          <span
            className="px-2.5 py-1 text-white font-bold rounded shadow-xs"
            style={{ backgroundColor: currentColor }}
          >
            Button Sample
          </span>
          <span
            className="px-2.5 py-1 font-bold rounded border"
            style={{
              borderColor: currentColor,
              color: currentColor,
              backgroundColor: 'var(--brand-primary-light, #fbebee)',
            }}
          >
            Badge Sample
          </span>
        </div>
        <span className="text-[11px] text-slate-500">
          Changes take effect across all pages in real-time.
        </span>
      </div>
    </div>
  );
};
