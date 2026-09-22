import React from 'react';
import { Truck, MapPin, Clock, DollarSign, CheckCircle2 } from 'lucide-react';
import { DeliveryZone } from '../../types';

interface AdminDeliveryTabProps {
  deliveryZones: DeliveryZone[];
}

export const AdminDeliveryTab: React.FC<AdminDeliveryTabProps> = ({ deliveryZones }) => {
  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-cyan-50 text-cyan-700">
              <Truck className="w-4 h-4" />
            </span>
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              Uganda Regional Delivery Zones & Courier Timelines
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Configured delivery tariffs, free shipping thresholds, and transit times for Kampala Central, Greater Metropolitan, and Upcountry districts.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {deliveryZones.map((zone) => (
          <div
            key={zone.id}
            className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-cyan-300 hover:shadow-xs transition-all space-y-2 text-xs"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-cyan-600" />
                <span>{zone.name}</span>
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-200 text-slate-700">
                {zone.id}
              </span>
            </div>

            <div className="space-y-1 pt-1 text-[11px]">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Shipping Fee:</span>
                <span className="font-bold text-slate-900">
                  {zone.fee === 0 ? (
                    <span className="text-[#007f19] font-black">FREE SHIPPING</span>
                  ) : (
                    `UGX ${zone.fee.toLocaleString()}`
                  )}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500">Transit Duration:</span>
                <span className="font-bold text-slate-800 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>{zone.estimated_delivery || zone.estimated_days}</span>
                </span>
              </div>

              {zone.free_threshold && (
                <div className="flex justify-between items-center text-emerald-800 bg-emerald-50/80 px-2 py-1 rounded-md mt-1 font-medium">
                  <span>Free Threshold:</span>
                  <span className="font-bold">Over UGX {zone.free_threshold.toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
