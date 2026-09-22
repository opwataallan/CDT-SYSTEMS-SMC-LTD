import React, { useState } from 'react';
import { Building2, Phone, MessageSquare, Mail, MapPin, Save, CheckCircle2, RefreshCw } from 'lucide-react';
import { StoreSettings } from '../../types';
import { api } from '../../services/api';
import { useShop } from '../../context/ShopContext';

interface AdminStoreHeadquartersTabProps {
  initialSettings: StoreSettings;
}

export const AdminStoreHeadquartersTab: React.FC<AdminStoreHeadquartersTabProps> = ({ initialSettings }) => {
  const { refreshSettings, showToast } = useShop();
  const [storeForm, setStoreForm] = useState<StoreSettings>({ ...initialSettings });
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.saveAdminSettings({ settings: storeForm });
      await refreshSettings();
      showToast('Kampala Headquarters & Showroom contact details successfully saved!');
    } catch (err: any) {
      showToast(err.message || 'Failed to update store settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-cyan-50 text-cyan-700">
              <Building2 className="w-4 h-4" />
            </span>
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              Physical Showroom & Kampala Headquarters
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage customer-facing service contacts, official WhatsApp order desk, and walk-in technical bench address.
          </p>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="self-start sm:self-auto h-9 px-4 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
        >
          {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <div>
          <label className="font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-cyan-600" />
            <span>Store Voice Hotline:</span>
          </label>
          <input
            type="text"
            value={storeForm.phone}
            onChange={(e) => setStoreForm({ ...storeForm, phone: e.target.value })}
            placeholder="+256 779 743 101"
            className="w-full h-10 px-3 border border-slate-200 rounded-lg text-xs font-mono focus:outline-hidden focus:border-cyan-500 bg-slate-50 focus:bg-white transition-colors"
          />
        </div>

        <div>
          <label className="font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-[#007f19]" />
            <span>WhatsApp Dispatch Line:</span>
          </label>
          <input
            type="text"
            value={storeForm.whatsapp_number}
            onChange={(e) => setStoreForm({ ...storeForm, whatsapp_number: e.target.value })}
            placeholder="+256 779 743 101"
            className="w-full h-10 px-3 border border-slate-200 rounded-lg text-xs font-mono focus:outline-hidden focus:border-cyan-500 bg-slate-50 focus:bg-white transition-colors"
          />
        </div>

        <div>
          <label className="font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-blue-600" />
            <span>Official Support Email:</span>
          </label>
          <input
            type="email"
            value={storeForm.email}
            onChange={(e) => setStoreForm({ ...storeForm, email: e.target.value })}
            placeholder="sales@cyberdynamictech.com"
            className="w-full h-10 px-3 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:border-cyan-500 bg-slate-50 focus:bg-white transition-colors"
          />
        </div>

        <div>
          <label className="font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-rose-600" />
            <span>Showroom Address Line:</span>
          </label>
          <input
            type="text"
            value={storeForm.address_line}
            onChange={(e) => setStoreForm({ ...storeForm, address_line: e.target.value })}
            placeholder="Kampala, Uganda"
            className="w-full h-10 px-3 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:border-cyan-500 bg-slate-50 focus:bg-white transition-colors"
          />
        </div>
      </div>

      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
        <span className="font-bold text-slate-800 block">Kampala Hub Operating Hours:</span>
        <p>Monday - Saturday: 8:00 AM – 7:00 PM • Sunday: 10:00 AM – 4:00 PM EAT</p>
      </div>
    </form>
  );
};
