import React, { useState } from 'react';
import {
  Package,
  Search,
  Filter,
  Clock,
  Check,
  RefreshCw,
  MapPin,
  ExternalLink,
  Phone,
  MessageSquare,
  AlertCircle,
  Truck,
  CheckCircle2,
  ChevronRight,
  Eye,
  Calendar,
  DollarSign,
  ArrowUpDown,
  Smartphone,
} from 'lucide-react';
import { CustomerOrder } from '../../types';
import { api } from '../../services/api';
import { useShop } from '../../context/ShopContext';

interface AdminOrdersTabProps {
  orders: CustomerOrder[];
  onRefresh: () => Promise<void>;
}

export const AdminOrdersTab: React.FC<AdminOrdersTabProps> = ({ orders, onRefresh }) => {
  const { user, showToast, formatPrice } = useShop();

  const [orderFilter, setOrderFilter] = useState<'all' | 'pending' | 'processing' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmingOrderId, setConfirmingOrderId] = useState<string | null>(null);
  const [syncingOrderId, setSyncingOrderId] = useState<string | null>(null);

  // Status modal
  const [selectedOrder, setSelectedOrder] = useState<CustomerOrder | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const safeOrders = Array.isArray(orders) ? orders : [];

  const pendingPaymentCount = safeOrders.filter(
    (o) => o?.payment_details?.status === 'awaiting_confirmation' || o?.status === 'pending_payment'
  ).length;

  const processingCount = safeOrders.filter(
    (o) => o?.status === 'processing' || o?.status === 'packed' || o?.status === 'shipped'
  ).length;

  const completedCount = safeOrders.filter(
    (o) => o?.status === 'delivered' || o?.status === 'completed'
  ).length;

  // Filter orders by tab and search
  const filteredOrders = safeOrders.filter((o) => {
    if (!o) return false;

    // Filter by tab
    if (orderFilter === 'pending') {
      const isPending = o.payment_details?.status === 'awaiting_confirmation' || o.status === 'pending_payment';
      if (!isPending) return false;
    } else if (orderFilter === 'processing') {
      const isProc = o.status === 'processing' || o.status === 'packed' || o.status === 'shipped';
      if (!isProc) return false;
    } else if (orderFilter === 'completed') {
      const isComp = o.status === 'delivered' || o.status === 'completed';
      if (!isComp) return false;
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchOrderNumber = o.order_number?.toLowerCase().includes(q);
      const matchCustomer = `${o.shipping?.first_name || ''} ${o.shipping?.last_name || ''}`.toLowerCase().includes(q);
      const matchPhone = o.shipping?.phone?.toLowerCase().includes(q);
      const matchDistrict = (o.shipping?.district || o.delivery_zone || '').toLowerCase().includes(q);
      const matchAddress = o.shipping?.address_1?.toLowerCase().includes(q);
      const matchTxRef = o.payment_details?.transaction_ref?.toLowerCase().includes(q);

      return matchOrderNumber || matchCustomer || matchPhone || matchDistrict || matchAddress || matchTxRef;
    }

    return true;
  });

  const handleConfirmPayment = async (ord: CustomerOrder) => {
    setConfirmingOrderId(ord.order_number);
    try {
      const note = `Payment verified by store manager (${user?.first_name || 'Admin'}) on ${new Date().toLocaleDateString()}`;
      const res = await api.confirmOrderPayment(ord.order_number, note);
      if (res.success) {
        showToast(
          res.woocommerce_synced
            ? `Payment verified for #${ord.order_number}! Marked as processing and synced with WooCommerce (#${res.order?.woocommerce_order_id || 'WC'}).`
            : `Payment verified for #${ord.order_number}! Marked as processing.`
        );
        await onRefresh();
      }
    } catch (err: any) {
      showToast('Payment confirmation notice: ' + (err.message || 'Verification error'));
    } finally {
      setConfirmingOrderId(null);
    }
  };

  const handleSyncToWooCommerce = async (ord: CustomerOrder) => {
    setSyncingOrderId(ord.order_number);
    try {
      const res = await api.syncOrderToWooCommerce(ord.order_number);
      if (res.success) {
        showToast(res.message || `Order ${ord.order_number} synchronized to WooCommerce!`);
        await onRefresh();
      }
    } catch (err: any) {
      showToast('WooCommerce Sync failed: ' + (err.message || 'Check WooCommerce keys'));
    } finally {
      setSyncingOrderId(null);
    }
  };

  const handleOpenStatusModal = (ord: CustomerOrder) => {
    setSelectedOrder(ord);
    setNewStatus(ord.status);
    setStatusNote('');
  };

  const handleUpdateOrderStatus = async () => {
    if (!selectedOrder || !newStatus) return;
    setIsUpdatingStatus(true);
    try {
      await api.updateOrderStatus(selectedOrder.id, newStatus, statusNote);
      showToast(`Order ${selectedOrder.order_number} stage updated to: ${newStatus.toUpperCase()}`);
      setSelectedOrder(null);
      await onRefresh();
    } catch (err: any) {
      showToast(err.message || 'Failed to update order');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Header Toolbar & Metrics Summary */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-cyan-50 text-cyan-700">
                <Package className="w-4 h-4" />
              </span>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                Orders & Regional Dispatch Management
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Verify Mobile Money payments (MTN/Airtel) to <strong>0394760459</strong>, dispatch hardware from Kampala Central, and sync with WooCommerce.
            </p>
          </div>

          <button
            onClick={() => onRefresh()}
            className="self-start sm:self-auto h-9 px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
            <span>Refresh Orders</span>
          </button>
        </div>

        {/* 2. Search & Filter Bar */}
        <div className="pt-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Order #, customer, phone, district..."
              className="w-full h-10 pl-9 pr-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-cyan-500 focus:bg-white transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
            <button
              onClick={() => setOrderFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                orderFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All ({safeOrders.length})
            </button>

            <button
              onClick={() => setOrderFilter('pending')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                orderFilter === 'pending'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Awaiting Payment</span>
              {pendingPaymentCount > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                  orderFilter === 'pending' ? 'bg-white text-amber-900' : 'bg-amber-600 text-white'
                }`}>
                  {pendingPaymentCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setOrderFilter('processing')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                orderFilter === 'processing'
                  ? 'bg-cyan-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              In Dispatch ({processingCount})
            </button>

            <button
              onClick={() => setOrderFilter('completed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                orderFilter === 'completed'
                  ? 'bg-[#007f19] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Completed ({completedCount})
            </button>
          </div>
        </div>
      </div>

      {/* 3. Orders Display: Responsive Design (Cards on Mobile, Rich Table on Desktop) */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-3">
          <Package className="w-10 h-10 text-slate-300 mx-auto" />
          <div className="text-sm font-bold text-slate-700">No orders found</div>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchQuery
              ? `No orders match your search "${searchQuery}". Try searching with a different term or clear the filter.`
              : 'There are currently no orders under this filter category.'}
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold cursor-pointer"
            >
              Clear Search Query
            </button>
          )}
        </div>
      ) : (
        <>
          {/* MOBILE VIEW (< md): Card List with Touch Targets */}
          <div className="md:hidden space-y-3">
            {filteredOrders.map((ord) => {
              const isAwaitingPayment =
                ord.payment_details?.status === 'awaiting_confirmation' ||
                ord.status === 'pending_payment';
              const isCOD = ord.payment_method === 'cod';
              const isConfirming = confirmingOrderId === ord.order_number;
              const isSyncing = syncingOrderId === ord.order_number;

              return (
                <div
                  key={ord.id}
                  className={`bg-white rounded-xl border p-4 shadow-xs space-y-3 transition-all ${
                    isAwaitingPayment
                      ? 'border-amber-300 bg-amber-50/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Card Header: Order Number & Stage */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div>
                      <span className="font-mono font-black text-sm text-slate-900">
                        {ord.order_number}
                      </span>
                      <div className="text-[11px] text-slate-400">
                        {new Date(ord.created_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-md text-[11px] font-black uppercase tracking-wider border ${
                        ord.status === 'delivered' || ord.status === 'completed'
                          ? 'bg-emerald-50 text-[#007f19] border-emerald-200'
                          : ord.status === 'processing' || ord.status === 'shipped'
                          ? 'bg-cyan-50 text-cyan-800 border-cyan-200'
                          : 'bg-amber-50 text-amber-900 border-amber-300'
                      }`}
                    >
                      {ord.status}
                    </span>
                  </div>

                  {/* Customer Info & Quick Contact Buttons */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-xs text-slate-900">
                        {ord.shipping.first_name} {ord.shipping.last_name}
                      </div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">
                        {ord.shipping.phone}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {ord.shipping.phone && (
                        <>
                          <a
                            href={`tel:${ord.shipping.phone.replace(/\s+/g, '')}`}
                            className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center cursor-pointer transition-colors"
                            title="Call customer"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                          <a
                            href={`https://wa.me/${ord.shipping.phone.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(
                              ord.shipping.first_name
                            )},%20this%20is%20Cyber%20Dynamic%20Technologies%20regarding%20Order%20${ord.order_number}`}
                            target="_blank"
                            rel="noreferrer"
                            className="w-8 h-8 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#007f19] flex items-center justify-center cursor-pointer transition-colors"
                            title="WhatsApp customer"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </a>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Delivery Location */}
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-150 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                        <span>{ord.shipping.district || ord.delivery_zone}</span>
                      </span>

                      {ord.coordinates && (
                        <a
                          href={`https://www.google.com/maps?q=${ord.coordinates.latitude},${ord.coordinates.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-cyan-700 hover:underline font-bold text-[11px] inline-flex items-center gap-1"
                        >
                          <span>GPS Map</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                    <div className="text-slate-600 text-[11px] truncate">
                      {ord.shipping.address_1}
                    </div>
                  </div>

                  {/* Items & Total Pricing */}
                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <span className="text-[11px] text-slate-500">Order Total:</span>
                      <div className="text-base font-black text-slate-900 tracking-tight">
                        UGX {ord.total.toLocaleString()}
                      </div>
                    </div>

                    <div className="text-right text-[11px] text-slate-500">
                      <span>{ord.line_items.length} item(s)</span>
                      <div className="font-mono text-[10px] text-slate-400">
                        {ord.woocommerce_order_id ? `WC #${ord.woocommerce_order_id}` : 'Local Store'}
                      </div>
                    </div>
                  </div>

                  {/* Payment Status Pill */}
                  <div className="pt-1">
                    {isCOD ? (
                      <div className="p-2 rounded-lg bg-slate-100 text-slate-800 text-xs font-bold flex items-center gap-2">
                        <DollarSign className="w-3.5 h-3.5 text-slate-600" />
                        <span>Payment Method: Cash on Delivery (COD)</span>
                      </div>
                    ) : isAwaitingPayment ? (
                      <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-300 text-amber-950 space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="flex items-center gap-1 text-amber-900">
                            <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                            <span>Awaiting Payment Verification</span>
                          </span>
                        </div>
                        <p className="text-[11px] text-amber-900">
                          Target Account: <strong>0394760459 (OPWATA ALLAN SAMUEL)</strong>
                          {ord.payment_details?.transaction_ref && (
                            <span className="block font-mono font-bold mt-0.5">
                              Ref: {ord.payment_details.transaction_ref}
                            </span>
                          )}
                        </p>
                      </div>
                    ) : (
                      <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-[#007f19]" />
                        <span>Payment Verified & Confirmed</span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-slate-100">
                    {isAwaitingPayment && (
                      <button
                        onClick={() => handleConfirmPayment(ord)}
                        disabled={isConfirming}
                        className="w-full py-2.5 bg-[#007f19] hover:bg-[#006013] disabled:opacity-50 text-white font-bold text-xs rounded-lg shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        <span>{isConfirming ? 'Verifying & Syncing...' : 'Confirm Payment & Sync WC'}</span>
                      </button>
                    )}

                    <div className="flex items-center gap-2">
                      {!ord.woocommerce_order_id && (
                        <button
                          onClick={() => handleSyncToWooCommerce(ord)}
                          disabled={isSyncing}
                          className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                          <span>Sync WC</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleOpenStatusModal(ord)}
                        className="flex-1 py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>Update Stage</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* DESKTOP VIEW (>= md): Full Data Table */}
          <div className="hidden md:block bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600 text-[11px]">
                  <tr>
                    <th className="p-3.5">Order Number</th>
                    <th className="p-3.5">Customer & Phone</th>
                    <th className="p-3.5">District & Address</th>
                    <th className="p-3.5">Total (UGX)</th>
                    <th className="p-3.5">Payment Status</th>
                    <th className="p-3.5">WooCommerce</th>
                    <th className="p-3.5">Stage</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px]">
                  {filteredOrders.map((ord) => {
                    const isAwaitingPayment =
                      ord.payment_details?.status === 'awaiting_confirmation' ||
                      ord.status === 'pending_payment';
                    const isCOD = ord.payment_method === 'cod';
                    const isConfirming = confirmingOrderId === ord.order_number;
                    const isSyncing = syncingOrderId === ord.order_number;

                    return (
                      <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Order Number & Date */}
                        <td className="p-3.5 font-mono font-bold text-slate-900">
                          <div>{ord.order_number}</div>
                          <span className="text-[10px] text-slate-400 font-normal font-sans">
                            {new Date(ord.created_at).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </td>

                        {/* Customer */}
                        <td className="p-3.5">
                          <div className="font-bold text-slate-900">
                            {ord.shipping.first_name} {ord.shipping.last_name}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] text-slate-500 font-mono">{ord.shipping.phone}</span>
                            {ord.shipping.phone && (
                              <a
                                href={`https://wa.me/${ord.shipping.phone.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-emerald-600 hover:text-emerald-700"
                                title="Chat on WhatsApp"
                              >
                                <MessageSquare className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </td>

                        {/* District & Location */}
                        <td className="p-3.5">
                          <div className="font-bold text-slate-800 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-cyan-600 shrink-0" />
                            <span>{ord.shipping.district || ord.delivery_zone}</span>
                          </div>
                          <div className="text-[10px] text-slate-500 truncate max-w-[150px]">
                            {ord.shipping.address_1}
                          </div>
                          {ord.coordinates && (
                            <a
                              href={`https://www.google.com/maps?q=${ord.coordinates.latitude},${ord.coordinates.longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-0.5 text-[10px] text-cyan-600 hover:underline font-bold mt-0.5"
                            >
                              <span>GPS: {ord.coordinates.latitude.toFixed(2)}, {ord.coordinates.longitude.toFixed(2)}</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </td>

                        {/* Total */}
                        <td className="p-3.5">
                          <div className="font-black text-slate-900">
                            UGX {ord.total.toLocaleString()}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {ord.line_items.length} item(s)
                          </div>
                        </td>

                        {/* Payment Status */}
                        <td className="p-3.5">
                          {isCOD ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                              Cash on Delivery
                            </span>
                          ) : isAwaitingPayment ? (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-300">
                                <Clock className="w-3 h-3 text-amber-600 animate-pulse" />
                                <span>Awaiting Verification</span>
                              </span>
                              {ord.payment_details?.transaction_ref && (
                                <div className="text-[10px] text-slate-600 font-mono truncate max-w-[130px]">
                                  Ref: {ord.payment_details.transaction_ref}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-[#007f19] border border-emerald-200">
                              <Check className="w-3 h-3 text-[#007f19]" />
                              <span>Confirmed</span>
                            </span>
                          )}
                        </td>

                        {/* WooCommerce */}
                        <td className="p-3.5">
                          {ord.woocommerce_order_id ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-800 border border-purple-200">
                              WC #{ord.woocommerce_order_id}
                            </span>
                          ) : (
                            <button
                              onClick={() => handleSyncToWooCommerce(ord)}
                              disabled={isSyncing}
                              className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <RefreshCw className={`w-2.5 h-2.5 ${isSyncing ? 'animate-spin' : ''}`} />
                              <span>Sync to WC</span>
                            </button>
                          )}
                        </td>

                        {/* Order Stage */}
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${
                              ord.status === 'delivered' || ord.status === 'completed'
                                ? 'bg-emerald-50 text-[#007f19] border-emerald-200'
                                : ord.status === 'processing' || ord.status === 'shipped'
                                ? 'bg-cyan-50 text-cyan-800 border-cyan-200'
                                : 'bg-amber-50 text-amber-800 border-amber-200'
                            }`}
                          >
                            {ord.status}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                          {isAwaitingPayment && (
                            <button
                              onClick={() => handleConfirmPayment(ord)}
                              disabled={isConfirming}
                              className="px-2.5 py-1 rounded-lg bg-[#007f19] hover:bg-[#006013] disabled:opacity-50 text-white font-bold text-[10px] transition-colors cursor-pointer shadow-2xs inline-flex items-center gap-1"
                            >
                              <Check className="w-3 h-3" />
                              <span>{isConfirming ? 'Verifying...' : 'Confirm Payment'}</span>
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenStatusModal(ord)}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-700 font-bold text-[10px] transition-colors cursor-pointer"
                          >
                            Update Stage
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* 4. UPDATE STAGE / MODAL SHEET */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl p-5 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-sm text-slate-900">
                  Update Stage: {selectedOrder.order_number}
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedOrder.shipping.first_name} {selectedOrder.shipping.last_name} • {selectedOrder.shipping.district || selectedOrder.delivery_zone}
                </p>
              </div>
              <span className="text-xs font-black text-slate-900 font-mono bg-slate-100 px-2 py-1 rounded-md">
                UGX {selectedOrder.total.toLocaleString()}
              </span>
            </div>

            {/* If awaiting payment, allow quick verification here too */}
            {(selectedOrder.payment_details?.status === 'awaiting_confirmation' ||
              selectedOrder.status === 'pending_payment') && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-950 flex items-center gap-1.5 text-[11px]">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>Payment Pending</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      handleConfirmPayment(selectedOrder);
                      setSelectedOrder(null);
                    }}
                    className="px-3 py-1 bg-[#007f19] hover:bg-[#006013] text-white rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer shadow-xs"
                  >
                    <Check className="w-3 h-3" />
                    <span>Confirm & Sync WC</span>
                  </button>
                </div>
                <p className="text-[11px] text-amber-900">
                  Customer payment sent to: <strong>0394760459 (OPWATA ALLAN SAMUEL)</strong>
                  {selectedOrder.payment_details?.transaction_ref && (
                    <span> • Ref: {selectedOrder.payment_details.transaction_ref}</span>
                  )}
                </p>
              </div>
            )}

            {/* Coordinates Link */}
            {selectedOrder.coordinates && (
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs flex items-center justify-between">
                <span className="flex items-center gap-1 text-slate-700 text-[11px]">
                  <MapPin className="w-3.5 h-3.5 text-cyan-600" />
                  <span>GPS: {selectedOrder.coordinates.latitude.toFixed(4)}, {selectedOrder.coordinates.longitude.toFixed(4)}</span>
                </span>
                <a
                  href={`https://www.google.com/maps?q=${selectedOrder.coordinates.latitude},${selectedOrder.coordinates.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-600 hover:underline font-bold text-[11px] flex items-center gap-0.5"
                >
                  <span>Open Google Maps</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1 text-xs">Order Progression Stage:</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full h-9 px-3 border border-slate-200 rounded-lg text-xs font-bold bg-white focus:outline-hidden focus:border-cyan-500"
                >
                  <option value="pending_payment">Pending Payment Confirmation</option>
                  <option value="processing">Processing (Inspection & Packing)</option>
                  <option value="packed">Packed & Sealed in Kampala Central Hub</option>
                  <option value="shipped">Dispatched / En Route with Regional Courier</option>
                  <option value="out-for-delivery">Out for Delivery in District</option>
                  <option value="delivered">Delivered & Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1 text-xs">Courier Dispatch / Customer Note:</label>
                <input
                  type="text"
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="e.g. Courier dispatched to Kololo, ETA 4:30 PM"
                  className="w-full h-9 px-3 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="flex-1 h-9 rounded-lg border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdateOrderStatus}
                disabled={isUpdatingStatus}
                className="flex-1 h-9 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
              >
                {isUpdatingStatus ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Save Stage</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
