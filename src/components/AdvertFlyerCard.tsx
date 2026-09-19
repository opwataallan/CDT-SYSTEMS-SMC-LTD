import React from 'react';
import { Sparkles, ArrowRight, ShieldCheck, Tag } from 'lucide-react';
import { AdvertFlyer } from '../types';
import { useShop } from '../context/ShopContext';

interface AdvertFlyerCardProps {
  flyer: AdvertFlyer;
  isDraggingRef?: React.MutableRefObject<boolean>;
}

export const AdvertFlyerCard: React.FC<AdvertFlyerCardProps> = ({
  flyer,
  isDraggingRef,
}) => {
  const { setCurrentView } = useShop();

  const handleCardClick = (e: React.MouseEvent) => {
    if (isDraggingRef?.current) {
      e.preventDefault();
      return;
    }
    handleClickAction();
  };

  const handleClickAction = () => {
    if (flyer.link_type === 'category' || !flyer.link_type) {
      setCurrentView('category', { slug: flyer.link_target, name: flyer.title });
    } else if (flyer.link_type === 'product') {
      setCurrentView('product', { slug: flyer.link_target, id: flyer.link_target });
    } else if (flyer.link_type === 'whatsapp') {
      const waUrl = `https://wa.me/256779743101?text=${encodeURIComponent(`Hello Cyber Dynamic Technologies, I am inquiring about your flyer promotion: ${flyer.title}`)}`;
      window.open(waUrl, '_blank', 'noopener,noreferrer');
    } else if (flyer.link_type === 'url' && flyer.link_target) {
      window.open(flyer.link_target, '_blank', 'noopener,noreferrer');
    } else {
      setCurrentView('shop');
    }
  };

  return (
    <div
      id={`advert-flyer-card-${flyer.id}`}
      onClick={handleCardClick}
      className="group relative flex-shrink-0 w-[calc(100vw-48px)] sm:w-[calc((100vw-72px)/2)] md:w-[320px] lg:w-[370px] min-w-[260px] max-w-[400px] bg-white rounded-xl sm:rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-lg hover:border-cyan-500/60 transition-all duration-300 flex flex-col select-none cursor-pointer"
    >
      {/* Visual Flyer Banner Image Stage */}
      <div className="relative w-full h-44 sm:h-48 md:h-52 bg-slate-900 overflow-hidden">
        <img
          src={flyer.image_url}
          alt={flyer.title}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
          referrerPolicy="no-referrer"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src =
              'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=700&auto=format&fit=crop&q=80';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent" />

        {/* Floating Top Badge */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-10">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-cyan-600 text-white font-extrabold text-[10px] sm:text-[11px] uppercase tracking-wider shadow-md">
            <Sparkles className="w-3 h-3 text-cyan-200" />
            {flyer.badge || 'PROMO FLYER'}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900/80 backdrop-blur-xs text-emerald-400 font-bold text-[10px] border border-slate-700">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            CDT Verified
          </span>
        </div>

        {/* Overlay Title on Image */}
        <div className="absolute bottom-2.5 left-3 right-3 z-10">
          <h3 className="text-sm sm:text-base font-black text-white leading-tight drop-shadow-md line-clamp-1">
            {flyer.title}
          </h3>
        </div>
      </div>

      {/* Card Body & Call To Action */}
      <div className="p-3 sm:p-3.5 flex flex-col justify-between flex-1 bg-white">
        <p className="text-xs text-slate-600 font-medium line-clamp-2 leading-relaxed mb-3">
          {flyer.subtitle}
        </p>

        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 mt-auto">
          <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500">
            <Tag className="w-3 h-3 text-cyan-600" />
            <span>Official Advert</span>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (isDraggingRef?.current) return;
              handleClickAction();
            }}
            className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs active:scale-95"
          >
            <span>{flyer.button_text || 'View Deals'}</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
