import React from 'react';
import { MapPin, Phone, Mail, Clock, ShieldCheck, Truck, RotateCcw, CheckCircle2, MessageCircle } from 'lucide-react';
import { useShop } from '../context/ShopContext';

export const ContactPage: React.FC = () => {
  const { storeSettings, setCurrentView } = useShop();

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div className="text-center space-y-1">
        <span className="text-[10px] font-black uppercase tracking-wider text-cyan-700 bg-cyan-50 px-2.5 py-0.5 rounded border border-cyan-200">
          Physical Showroom & Repair Center
        </span>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900">
          Visit Cyber Dynamic Technologies in Kampala
        </h1>
        <p className="text-xs text-slate-500 max-w-lg mx-auto">
          Located in the commercial heart of Kampala Central. We welcome personal inspections, corporate purchasing, and walk-in technical support.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Contact Details */}
        <div className="bg-white p-4 sm:p-5 rounded-lg border border-slate-200 shadow-2xs space-y-4 text-xs">
          <h2 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-2">
            Direct Communication Channels
          </h2>

          <div className="space-y-3">
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Physical Store Location</h3>
                <p className="text-slate-600 text-[11px] mt-0.5">{storeSettings.address_line}</p>
                <p className="text-slate-500 text-[11px]">Kampala Central Division, Kampala, Uganda</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0">
                <Phone className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Telephone Hotlines</h3>
                <p className="text-slate-600 text-[11px] mt-0.5">Primary Sales: <strong>{storeSettings.phone}</strong></p>
                <p className="text-slate-600 text-[11px]">Landline / Corporate: <strong>+256 394 760 459</strong></p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center flex-shrink-0">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Official Email</h3>
                <p className="text-slate-600 text-[11px] mt-0.5">{storeSettings.email}</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-700 flex items-center justify-center flex-shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Showroom Working Hours</h3>
                <p className="text-slate-600 text-[11px] mt-0.5">Monday - Saturday: 8:00 AM - 7:30 PM</p>
                <p className="text-slate-600 text-[11px]">Sunday: 10:00 AM - 5:00 PM</p>
              </div>
            </div>
          </div>

          <a
            href="https://wa.me/256779743101?text=Hello%20Cyber%20Dynamic%20Technologies,%20I%20am%20coming%20to%20the%20Kampala%20store"
            target="_blank"
            rel="noreferrer"
            className="block w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-center font-bold rounded-lg shadow-2xs transition-colors text-xs"
          >
            Chat with In-Store Team (WhatsApp)
          </a>
        </div>

        {/* Directions & Landmark Map Card */}
        <div className="bg-white p-4 sm:p-5 rounded-lg border border-slate-200 shadow-2xs space-y-3 text-xs">
          <h2 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-2">
            Directions & Landmark Guidance
          </h2>
          <p className="text-slate-600 leading-relaxed text-[11px]">
            When visiting our showroom in Kampala Central:
          </p>
          <ul className="space-y-1.5 text-slate-700 list-disc pl-4 text-[11px]">
            <li>Located in Kampala Central, easily accessible from all major metropolitan routes.</li>
            <li>Look for the prominent <strong>Cyber Dynamic Technologies</strong> entrance with customer service and test bench.</li>
            <li>Secure dedicated client parking available on premises.</li>
          </ul>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 mt-3 space-y-1 text-[11px]">
            <h4 className="font-bold text-slate-800">Kampala Metropolitan Express Dispatch:</h4>
            <p className="text-slate-500">
              We operate dedicated express motorcycle couriers covering all areas: Nakasero & Kololo (1 hour), Ntinda & Naguru (2 hours), Makindye & Kansanga (2 hours), Rubaga & Mengo (2 hours), and Entebbe/Mukono corridors (Same day).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export const WarrantyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 text-xs">
      <div className="text-center space-y-1">
        <h1 className="text-xl sm:text-2xl font-black text-slate-900">
          Warranty & Authenticity Guarantee
        </h1>
        <p className="text-slate-500 max-w-md mx-auto text-xs">
          Every product sold through Cyber Dynamic Technologies is backed by formal hardware warranty and post-purchase maintenance.
        </p>
      </div>

      <div className="bg-white p-4 sm:p-6 rounded-lg border border-slate-200 shadow-2xs space-y-4">
        <div className="space-y-1">
          <h2 className="font-bold text-xs text-slate-900">1. 100% Genuine Hardware Promise</h2>
          <p className="text-slate-600 leading-relaxed text-[11px]">
            Cyber Dynamic Technologies does not sell counterfeit or imitation items. All laptops (HP, Lenovo, Dell), printers (Epson, HP LaserJet), and networking units (MTN, Airtel, TP-Link) carry verified factory serial numbers eligible for direct warranty service.
          </p>
        </div>

        <div className="space-y-1">
          <h2 className="font-bold text-xs text-slate-900">2. 7-Day Replacement Guarantee</h2>
          <p className="text-slate-600 leading-relaxed text-[11px]">
            If any equipment arrives damaged in transit or exhibits a factory defect within 7 days of delivery, Cyber Dynamic Technologies will immediately replace the unit free of charge or issue a full refund upon return of the original packaging.
          </p>
        </div>

        <div className="space-y-1">
          <h2 className="font-bold text-xs text-slate-900">3. 12-Month Limited Hardware Warranty</h2>
          <p className="text-slate-600 leading-relaxed text-[11px]">
            Laptops and printers come with a 12-month limited warranty covering motherboard circuitry, internal power supply components, and display panels. Accidental physical damage or liquid spills are excluded from warranty coverage.
          </p>
        </div>

        <div className="space-y-1">
          <h2 className="font-bold text-xs text-slate-900">4. How to Claim Warranty Service</h2>
          <p className="text-slate-600 leading-relaxed text-[11px]">
            Simply present your Cyber Dynamic Technologies Order Number (e.g. <code>CDT-10491</code>) or invoice at our showroom in Kampala, or contact our technical support line at <strong>+256 779 743 101</strong> for courier pickup instructions.
          </p>
        </div>
      </div>
    </div>
  );
};
