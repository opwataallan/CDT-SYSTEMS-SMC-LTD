import React, { useState, useEffect } from 'react';
import {
  Truck,
  Search,
  CheckCircle2,
  Clock,
  Package,
  MapPin,
  Phone,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Download,
} from 'lucide-react';
import { api } from '../services/api';
import { CustomerOrder } from '../types';
import { useShop } from '../context/ShopContext';

interface TrackOrderPageProps {
  initialOrderNumber?: string;
}

export const TrackOrderPage: React.FC<TrackOrderPageProps> = ({ initialOrderNumber = '' }) => {
  const { setCurrentView } = useShop();

  const [orderQuery, setOrderQuery] = useState(initialOrderNumber || 'CDT-10491');
  const [verifyContact, setVerifyContact] = useState('');
  const [needsVerification, setNeedsVerification] = useState(false);
  const [order, setOrder] = useState<CustomerOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrder = async (query: string, contact?: string) => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const verifyParam = contact?.trim() || verifyContact.trim();
      const verifyPayload = verifyParam
        ? verifyParam.includes('@')
          ? { email: verifyParam }
          : { phone: verifyParam }
        : undefined;

      const res = await api.getOrder(query.trim(), verifyPayload);
      setOrder(res);
      setNeedsVerification(false);
    } catch (err: any) {
      if (err.message && (err.message.includes('verification') || err.message.includes('401') || err.message.includes('Forbidden'))) {
        setNeedsVerification(true);
        setError('To protect customer privacy, please provide the billing email address or phone number used when placing this order.');
      } else {
        setError(err.message || 'Order not found. Please check your order number.');
      }
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialOrderNumber) {
      fetchOrder(initialOrderNumber);
    } else {
      fetchOrder('CDT-10491');
    }
  }, [initialOrderNumber]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrder(orderQuery, verifyContact);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
      case 'completed':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'shipped':
      case 'out-for-delivery':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'processing':
      case 'packed':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
      {/* Page Title & Search Bar */}
      <div className="bg-white p-5 sm:p-6 rounded-lg border border-slate-200 shadow-2xs text-center space-y-3">
        <div className="w-10 h-10 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center mx-auto">
          <Truck className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
            Track Your Tech Order
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 max-w-md mx-auto">
            Enter your Cyber Dynamic Tech Order Number (e.g. <strong>CDT-10491</strong>) to view real-time testing, packaging, and regional dispatch updates.
          </p>
        </div>

        <form onSubmit={handleSearch} className="max-w-md mx-auto space-y-2 pt-1">
          <div className="flex gap-2">
            <input
              type="text"
              value={orderQuery}
              onChange={(e) => setOrderQuery(e.target.value.toUpperCase())}
              placeholder="Enter Order Number (e.g. CDT-10491)"
              className="flex-1 h-9 px-3 text-xs font-bold uppercase rounded-lg border border-slate-200 focus:outline-hidden focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="h-9 px-4 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <Search className="w-3.5 h-3.5" />
              <span>{loading ? 'Searching...' : 'Track'}</span>
            </button>
          </div>

          {(needsVerification || verifyContact) && (
            <div className="pt-1 text-left">
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Order Verification (Billing Email or Phone)
              </label>
              <input
                type="text"
                value={verifyContact}
                onChange={(e) => setVerifyContact(e.target.value)}
                placeholder="e.g. customer@gmail.com or +256779743101"
                className="w-full h-8 px-3 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              />
            </div>
          )}
        </form>
      </div>

      {/* Order Not Found Alert */}
      {error && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-center gap-2.5 text-xs text-rose-800">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
          <div>
            <strong>Unable to locate order:</strong> {error}
            <div className="mt-0.5 text-slate-500 text-[11px]">
              Need assistance? Call Cyber Dynamic Tech Support on <strong>+256 779 743 101</strong>
            </div>
          </div>
        </div>
      )}

      {/* Order Result Card */}
      {order && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-2xs p-5 sm:p-6 space-y-6">
          {/* Header Info */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Order Tracking Overview
              </span>
              <h2 className="text-lg font-black text-slate-900 mt-0.5">
                {order.order_number}
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Placed on {new Date(order.date_created).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`px-2.5 py-0.5 rounded text-[11px] font-black uppercase tracking-wider border ${getStatusColor(
                  order.status
                )}`}
              >
                Status: {order.status}
              </span>
              <button
                onClick={() => window.print()}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs flex items-center gap-1 cursor-pointer"
                title="Print Order Receipt"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[11px]">Print Receipt</span>
              </button>
            </div>
          </div>

          {/* Timeline Stages */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
              Live Order Progression
            </h3>

            <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {order.timeline.map((step, idx) => (
                <div key={idx} className="relative">
                  {/* Step icon dot */}
                  <div
                    className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center border-2 ${
                      step.completed
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : step.current
                        ? 'bg-white border-cyan-500 text-cyan-600 animate-pulse'
                        : 'bg-white border-slate-300 text-slate-400'
                    }`}
                  >
                    {step.completed ? (
                      <CheckCircle2 className="w-3 h-3" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    )}
                  </div>

                  {/* Step Details */}
                  <div className="bg-slate-50/70 p-2.5 rounded-lg border border-slate-200">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className={`text-xs font-extrabold ${step.completed ? 'text-slate-900' : 'text-slate-600'}`}>
                        {step.title}
                      </h4>
                      <span className="text-[10px] font-semibold text-slate-400">{step.timestamp}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recipient & Items Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-200">
            {/* Delivery Details */}
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1.5">
              <div className="font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
                <MapPin className="w-3.5 h-3.5 text-cyan-600" />
                <span>Delivery Address & Recipient</span>
              </div>
              <div className="text-[11px] space-y-0.5">
                <p className="font-bold text-slate-900">{order.shipping.first_name} {order.shipping.last_name}</p>
                <p className="text-slate-600">{order.shipping.phone}</p>
                <p className="text-slate-600">{order.shipping.address_1}</p>
                <p className="text-slate-600">{order.shipping.district} District, Uganda</p>
                {order.shipping.landmark && (
                  <p className="text-slate-500 italic mt-0.5">Landmark: {order.shipping.landmark}</p>
                )}
              </div>
              <div className="pt-1.5 border-t border-slate-200 flex justify-between text-[10px]">
                <span className="text-slate-500">Payment:</span>
                <span className="font-bold text-slate-800">{order.payment_method_title}</span>
              </div>
            </div>

            {/* Line items & Total */}
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1.5">
              <div className="font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
                <Package className="w-3.5 h-3.5 text-cyan-600" />
                <span>Items in this Order ({order.line_items.length})</span>
              </div>
              <div className="divide-y divide-slate-200/70 max-h-36 overflow-y-auto pr-1">
                {order.line_items.map((item) => (
                  <div key={item.id} className="py-1.5 flex items-center justify-between gap-2 text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-slate-900">{item.quantity}x</span>
                      <span className="text-slate-700 line-clamp-1">{item.name}</span>
                    </div>
                    <span className="font-bold text-slate-900 whitespace-nowrap">
                      UGX {item.total.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-1.5 border-t border-slate-200 space-y-1 text-slate-600 text-[11px]">
                <div className="flex justify-between">
                  <span>Shipping Fee:</span>
                  <span>{order.shipping_total === 0 ? <span className="text-emerald-600 font-bold">FREE</span> : `UGX ${order.shipping_total.toLocaleString()}`}</span>
                </div>
                <div className="flex justify-between text-xs font-black text-slate-900 pt-1 border-t border-slate-200">
                  <span>Grand Total:</span>
                  <span className="text-cyan-600">UGX {order.total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Hotline Box */}
          <div className="p-3 rounded-lg bg-cyan-50 border border-cyan-100 text-xs text-cyan-950 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-cyan-700 flex-shrink-0" />
              <div>
                <strong className="text-slate-900">Need express courier coordinate updates?</strong>
                <p className="text-cyan-800 text-[11px]">Call Cyber Dynamic Tech central dispatch in Kampala: +256 779 743 101</p>
              </div>
            </div>
            <a
              href={`https://wa.me/256779743101?text=Hello%20Cyber%20Dynamic%20Tech,%20inquiring%20about%20Order%20${order.order_number}`}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs whitespace-nowrap cursor-pointer shadow-2xs"
            >
              WhatsApp Dispatcher
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
