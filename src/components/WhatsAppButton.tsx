import React, { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { useShop } from '../context/ShopContext';

export const WhatsAppButton: React.FC = () => {
  const { storeSettings } = useShop();
  const [isOpen, setIsOpen] = useState(false);

  const phoneFormatted = storeSettings.whatsapp_number.replace(/[^0-9]/g, '');
  const chatUrl = `https://wa.me/${phoneFormatted}?text=Hello%20Cyber%20Dynamic%20Tech,%20I%20am%20inquiring%20about%20products%20on%20your%20marketplace.`;

  return (
    <div className="fixed bottom-16 md:bottom-4 right-3 sm:right-4 z-40 flex flex-col items-end">
      {/* Popover Card */}
      {isOpen && (
        <div className="mb-2.5 w-68 bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden text-slate-800 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div className="bg-slate-900 text-white p-3 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-emerald-600 flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-white" />
              </div>
              <div>
                <h4 className="text-xs font-bold leading-tight text-white">Cyber Dynamic Tech</h4>
                <p className="text-[10px] text-cyan-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Online | Kampala Sales Desk
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-3 bg-slate-50 text-[11px] text-slate-600 space-y-2">
            <p>
              Need instant assistance with specs, warranty, or MoMo payment? Chat with our hardware specialists directly on WhatsApp!
            </p>
            <a
              href={chatUrl}
              target="_blank"
              rel="noreferrer"
              className="block w-full py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-center font-bold text-xs rounded-lg shadow-2xs transition-colors"
            >
              Start WhatsApp Chat
            </a>
          </div>
        </div>
      )}

      {/* Main Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-11 h-11 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer"
        aria-label="Chat with us on WhatsApp"
        title="Chat with Cyber Dynamic Tech on WhatsApp"
      >
        <MessageCircle className="w-5 h-5" />
        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white">
          1
        </span>
      </button>
    </div>
  );
};
