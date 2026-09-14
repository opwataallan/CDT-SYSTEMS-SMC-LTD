import React, { useState, useMemo } from 'react';
import { MapPin, Search, Check, ChevronDown, Building2, Phone, Clock, Sparkles } from 'lucide-react';
import { UGANDA_DISTRICTS, UgandaDistrict, getDistrictPickupLocation, DistrictPickupLocation } from '../data/ugandaDistricts';

interface DistrictSelectorProps {
  selectedDistrict: string;
  onSelectDistrict: (districtName: string, districtObj?: UgandaDistrict) => void;
  showPickupDetails?: boolean;
  compact?: boolean;
  className?: string;
}

export const DistrictSelector: React.FC<DistrictSelectorProps> = ({
  selectedDistrict,
  onSelectDistrict,
  showPickupDetails = true,
  compact = false,
  className = '',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeRegionTab, setActiveRegionTab] = useState<'All' | 'Central' | 'Eastern' | 'Northern' | 'Western'>('All');

  // Find active district object
  const currentDistrictObj = useMemo(() => {
    const q = (selectedDistrict || 'Kampala').toLowerCase().trim();
    return (
      UGANDA_DISTRICTS.find(
        (d) => d.name.toLowerCase() === q || d.id === q || d.name.toLowerCase().includes(q)
      ) || UGANDA_DISTRICTS[0]
    );
  }, [selectedDistrict]);

  // Current pickup station location
  const pickupHub: DistrictPickupLocation = useMemo(() => {
    return getDistrictPickupLocation(currentDistrictObj.id);
  }, [currentDistrictObj]);

  // Filter districts by search query and region tab
  const filteredDistricts = useMemo(() => {
    let list = UGANDA_DISTRICTS;
    if (activeRegionTab !== 'All') {
      list = list.filter((d) => d.region === activeRegionTab);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (d) => d.name.toLowerCase().includes(q) || d.region.toLowerCase().includes(q)
      );
    }
    return list;
  }, [searchQuery, activeRegionTab]);

  const popularDistricts = useMemo(() => {
    return UGANDA_DISTRICTS.filter((d) => d.popular);
  }, []);

  const handleSelect = (dist: UgandaDistrict) => {
    onSelectDistrict(dist.name, dist);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className={`space-y-2.5 ${className}`}>
      {/* TRIGGER BUTTON / SELECTOR BOX */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full text-left rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 bg-white ${
            isOpen
              ? 'border-cyan-500 ring-2 ring-cyan-500/20 shadow-md'
              : 'border-slate-200 hover:border-slate-300 shadow-2xs'
          } ${compact ? 'p-2 text-xs' : 'p-3 text-xs sm:text-sm'}`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-600 border border-cyan-200/80 flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4 text-cyan-600" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Selected District:
              </div>
              <div className="font-black text-slate-900 truncate flex items-center gap-1.5">
                <span>{currentDistrictObj.name}</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                  {currentDistrictObj.region} Region
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 text-slate-400">
            <span className="text-[11px] font-bold text-cyan-600 hidden sm:inline">Change</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </button>

        {/* QUICK PICK DISTRICT CHIPS */}
        {!isOpen && !compact && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-0.5">
              Quick Pick:
            </span>
            {popularDistricts.slice(0, 7).map((dist) => {
              const isSelected = currentDistrictObj.id === dist.id;
              return (
                <button
                  key={dist.id}
                  type="button"
                  onClick={() => handleSelect(dist)}
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-600 text-white shadow-2xs font-extrabold'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {dist.name}
                </button>
              );
            })}
          </div>
        )}

        {/* DROPDOWN DRAWER MODAL */}
        {isOpen && (
          <div className="absolute left-0 right-0 z-40 mt-1.5 bg-white rounded-xl border border-slate-200 shadow-xl p-3 space-y-2.5 animate-in fade-in duration-150 max-h-[380px] flex flex-col">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search any district in Uganda (e.g. Jinja, Mbarara, Gulu...)"
                className="w-full h-8 pl-8 pr-3 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 bg-slate-50"
              />
            </div>

            {/* Region Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-slate-100 text-xs no-scrollbar">
              {(['All', 'Central', 'Eastern', 'Northern', 'Western'] as const).map((reg) => (
                <button
                  key={reg}
                  type="button"
                  onClick={() => setActiveRegionTab(reg)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold whitespace-nowrap transition-colors cursor-pointer ${
                    activeRegionTab === reg
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  {reg}
                </button>
              ))}
            </div>

            {/* Districts List */}
            <div className="flex-1 overflow-y-auto space-y-1 max-h-[220px] pr-1">
              {filteredDistricts.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  No districts found matching "{searchQuery}"
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                  {filteredDistricts.map((dist) => {
                    const isSelected = currentDistrictObj.id === dist.id;
                    return (
                      <button
                        key={dist.id}
                        type="button"
                        onClick={() => handleSelect(dist)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between gap-1 transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-cyan-50 text-cyan-900 font-extrabold border border-cyan-200'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="truncate">
                          <span className="font-medium">{dist.name}</span>
                          <span className="text-[10px] text-slate-400 ml-1">({dist.region})</span>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-cyan-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* PICKUP HUB DETAILS CARD FOR THE CHOSEN DISTRICT */}
      {showPickupDetails && (
        <div className="p-3 rounded-xl bg-cyan-50/50 border border-cyan-100 text-xs space-y-1.5">
          <div className="flex items-center justify-between font-bold text-slate-900">
            <span className="flex items-center gap-1.5 text-cyan-800">
              <Building2 className="w-3.5 h-3.5 text-cyan-600" />
              <span>{pickupHub.hubName}</span>
            </span>
            <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
              FREE PICKUP
            </span>
          </div>

          <p className="text-[11px] text-slate-600">
            <strong>Address:</strong> {pickupHub.stationAddress} ({pickupHub.landmark})
          </p>

          <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-500 pt-1 border-t border-cyan-100/60">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-cyan-600" />
              <span>{pickupHub.operatingHours}</span>
            </span>
            <span className="flex items-center gap-1 font-mono font-semibold text-slate-700">
              <Phone className="w-3 h-3 text-cyan-600" />
              <span>{pickupHub.contactPhone}</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
