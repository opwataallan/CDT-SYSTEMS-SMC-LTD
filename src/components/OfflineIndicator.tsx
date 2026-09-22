import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      id="pwa-offline-indicator"
      className="fixed bottom-16 sm:bottom-4 left-4 right-4 sm:right-auto sm:max-w-sm z-50 flex items-center gap-2.5 rounded-xl bg-slate-900/95 text-white px-3.5 py-2 text-xs font-semibold shadow-2xl border border-amber-500/50 backdrop-blur-md animate-in slide-in-from-bottom-2 duration-300"
    >
      <div className="p-1 rounded-md bg-amber-500/20 text-amber-400">
        <WifiOff className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-bold text-amber-300">Offline Mode Active</p>
        <p className="text-[10px] text-slate-300 truncate">
          Browsing cached catalog. Orders sync when connection returns.
        </p>
      </div>
    </div>
  );
};
