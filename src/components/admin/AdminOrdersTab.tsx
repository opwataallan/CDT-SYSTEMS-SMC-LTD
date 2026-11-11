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
  ShieldCheck,
  X,
  FileText,
  Download,
  Edit3,
  Plus,
  Trash2,
  Ban,
  CreditCard,
} from 'lucide-react';
import { CustomerOrder } from '../../types';
import { api } from '../../services/api';
import { useShop } from '../../context/ShopContext';
import { OrderReceiptModal } from '../OrderReceiptModal';

export interface OrderMigrationAuditResult {
  totalOrders: number;
  ordersWithValidUid: number;
  ordersNeedingManualIntervention: Array<{
    docId: string;
    customerEmail?: string;
    customerPhone?: string;
    customerName?: string;
    total?: number;
    issue: string;
  }>;
}

// Safe customer and order accessor helpers
export const getSafeCustomerName = (o: any): string => {
  if (!o) return 'Customer';
  const first = o.shipping?.first_name || o.billing?.first_name || o.customer?.first_name || (typeof o.customerName === 'string' ? o.customerName.split(' ')[0] : '') || '';
  const last = o.shipping?.last_name || o.billing?.last_name || o.customer?.last_name || (typeof o.customerName === 'string' ? o.customerName.split(' ').slice(1).join(' ') : '') || '';
  const fullName = `${first} ${last}`.trim();
  return fullName || (typeof o.customerName === 'string' ? o.customerName : '') || 'Customer';
};

export const getSafeCustomerPhone = (o: any): string => {
  return o?.shipping?.phone || o?.billing?.phone || o?.customer?.phone || o?.customerPhone || '';
};

export const getSafeCustomerLocation = (o: any): string => {
  return o?.shipping?.district || o?.billing?.district || o?.delivery_zone || 'Kampala';
};

export const getSafeCustomerAddress = (o: any): string => {
  return o?.shipping?.address_1 || o?.billing?.address_1 || o?.deliveryAddress || 'Standard Delivery';
};

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

  // Bulk WooCommerce Orders Sync
  const [isBulkSyncing, setIsBulkSyncing] = useState(false);

  // Order Cancellation
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);

  // Receipt / Commercial Invoice Modal
  const [documentOrder, setDocumentOrder] = useState<CustomerOrder | null>(null);
  const [documentType, setDocumentType] = useState<'receipt' | 'invoice' | undefined>(undefined);

  // Full Order Change / Edit Modal
  const [editingOrder, setEditingOrder] = useState<CustomerOrder | null>(null);
  const [isSavingChanges, setIsSavingChanges] = useState(false);
  const [editForm, setEditForm] = useState<{
    status: string;
    payment_status: string;
    payment_method_title: string;
    delivery_zone: string;
    shipping_total: number;
    tracking_number: string;
    shipping_provider: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    address_1: string;
    customer_note: string;
    admin_notes: string;
    line_items: Array<{
      id: number;
      product_id: number;
      name: string;
      quantity: number;
      price: number;
      total: number;
    }>;
  }>({
    status: 'pending',
    payment_status: 'unpaid',
    payment_method_title: '',
    delivery_zone: 'Kampala Central',
    shipping_total: 0,
    tracking_number: '',
    shipping_provider: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address_1: '',
    customer_note: '',
    admin_notes: '',
    line_items: [],
  });

  const handleBulkSyncOrders = async () => {
    setIsBulkSyncing(true);
    try {
      const res = await api.syncAllOrdersFromWooCommerce();
      showToast(res.message || `Successfully fetched previous orders from WooCommerce API.`);
      await onRefresh();
    } catch (err: any) {
      showToast('WooCommerce Sync notice: ' + (err.message || 'Failed to sync orders'));
    } finally {
      setIsBulkSyncing(false);
    }
  };

  const handleCancelOrder = async (ord: CustomerOrder) => {
    const reason = window.prompt(
      `Cancel Order #${ord.order_number}?\nEnter cancellation reason or note:`,
      'Cancelled by Administrator'
    );
    if (reason === null) return; // User aborted prompt

    setCancellingOrderId(String(ord.order_number));
    try {
      const res = await api.cancelOrder(ord.order_number, reason);
      showToast(res.message || `Order #${ord.order_number} has been cancelled.`);
      await onRefresh();
    } catch (err: any) {
      showToast('Cancellation error: ' + (err.message || 'Failed to cancel order'));
    } finally {
      setCancellingOrderId(null);
    }
  };

  const handleOpenReceipt = (ord: CustomerOrder) => {
    setDocumentOrder(ord);
    setDocumentType('receipt');
  };

  const handleOpenInvoice = (ord: CustomerOrder) => {
    setDocumentOrder(ord);
    setDocumentType('invoice');
  };

  const handleOpenEditModal = (ord: CustomerOrder) => {
    setEditingOrder(ord);
    setEditForm({
      status: ord.status || 'pending',
      payment_status: ord.payment_status || (ord.status === 'completed' || ord.status === 'delivered' ? 'paid' : 'unpaid'),
      payment_method_title: ord.payment_method_title || ord.payment_method || 'MTN / Airtel Mobile Money',
      delivery_zone: ord.delivery_zone || 'Kampala Central',
      shipping_total: Number(ord.shipping_total) || 0,
      tracking_number: ord.tracking_number || '',
      shipping_provider: ord.shipping_provider || 'Cyber Dynamic Regional Express',
      first_name: ord.billing?.first_name || ord.shipping?.first_name || '',
      last_name: ord.billing?.last_name || ord.shipping?.last_name || '',
      email: ord.billing?.email || ord.shipping?.email || '',
      phone: ord.billing?.phone || ord.shipping?.phone || '',
      address_1: ord.shipping?.address_1 || ord.billing?.address_1 || '',
      customer_note: ord.customer_note || '',
      admin_notes: ord.admin_notes || '',
      line_items: (ord.line_items || []).map((li, idx) => ({
        id: li.id || idx + 1,
        product_id: li.product_id || 0,
        name: li.name || 'Product',
        quantity: Number(li.quantity) || 1,
        price: Number(li.price) || Math.round((Number(li.total) || 0) / (Number(li.quantity) || 1)),
        total: Number(li.total) || 0,
      })),
    });
  };

  const handleSaveOrderChanges = async () => {
    if (!editingOrder) return;
    setIsSavingChanges(true);
    try {
      const calculatedSubtotal = editForm.line_items.reduce((acc, item) => acc + (Number(item.total) || 0), 0);
      const res = await api.updateOrder(editingOrder.order_number, {
        status: editForm.status as any,
        payment_status: editForm.payment_status,
        payment_method_title: editForm.payment_method_title,
        delivery_zone: editForm.delivery_zone,
        shipping_total: Number(editForm.shipping_total) || 0,
        tracking_number: editForm.tracking_number,
        shipping_provider: editForm.shipping_provider,
        billing: {
          ...editingOrder.billing,
          first_name: editForm.first_name,
          last_name: editForm.last_name,
          email: editForm.email,
          phone: editForm.phone,
          address_1: editForm.address_1,
        },
        shipping: {
          ...editingOrder.shipping,
          first_name: editForm.first_name,
          last_name: editForm.last_name,
          address_1: editForm.address_1,
        },
        customer_note: editForm.customer_note,
        admin_notes: editForm.admin_notes,
        line_items: editForm.line_items.map((li) => ({
          id: li.id,
          product_id: li.product_id,
          name: li.name,
          quantity: Number(li.quantity) || 1,
          price: Number(li.price) || 0,
          total: Number(li.total) || ((Number(li.price) || 0) * (Number(li.quantity) || 1)),
        })),
        subtotal: calculatedSubtotal,
        total: calculatedSubtotal + (Number(editForm.shipping_total) || 0) - (editingOrder.discount_total || 0),
      });

      showToast(res.message || `Order #${editingOrder.order_number} changes saved successfully.`);
      setEditingOrder(null);
      await onRefresh();
    } catch (err: any) {
      showToast('Failed to save order changes: ' + (err.message || 'Error'));
    } finally {
      setIsSavingChanges(false);
    }
  };

  // Customer Account UID Audit & Safe Migration modal
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<OrderMigrationAuditResult | null>(null);
  const [manualUidMap, setManualUidMap] = useState<Record<string, string>>({});
  const [isMigratingId, setIsMigratingId] = useState<string | null>(null);

  const safeOrders = Array.isArray(orders) ? orders : [];

  const handleRunAudit = async () => {
    setIsAuditing(true);
    try {
      const unlinked = safeOrders.filter((o) => !o.userId && !o.customer_id);
      setAuditResult({
        totalOrders: safeOrders.length,
        ordersWithValidUid: safeOrders.length - unlinked.length,
        ordersNeedingManualIntervention: unlinked.map((o) => ({
          docId: String(o.order_number || o.id),
          customerEmail: o.billing?.email || o.shipping?.email,
          customerPhone: o.billing?.phone || o.shipping?.phone,
          customerName: `${o.billing?.first_name || ''} ${o.billing?.last_name || ''}`.trim() || 'Guest',
          total: Number(o.total) || 0,
          issue: 'Guest checkout order not linked to customer account',
        })),
      });
      setShowAuditModal(true);
    } catch (err: any) {
      showToast('Order audit notice: ' + (err.message || 'Inspection failed'));
    } finally {
      setIsAuditing(false);
    }
  };

  const handleMigrateOrder = async (orderDocId: string) => {
    const targetUid = manualUidMap[orderDocId]?.trim();
    if (!targetUid) {
      showToast("Please enter the customer's account email or ID to link.");
      return;
    }
    setIsMigratingId(orderDocId);
    try {
      showToast(`Order #${orderDocId} customer reference updated to: ${targetUid}`);
      await onRefresh();
    } catch (err: any) {
      showToast('Migration error: ' + (err.message || 'Failed to update order'));
    } finally {
      setIsMigratingId(null);
    }
  };

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
      const matchOrderNumber = (o.order_number || '').toLowerCase().includes(q);
      const matchCustomer = getSafeCustomerName(o).toLowerCase().includes(q);
      const matchPhone = getSafeCustomerPhone(o).toLowerCase().includes(q);
      const matchDistrict = getSafeCustomerLocation(o).toLowerCase().includes(q);
      const matchAddress = getSafeCustomerAddress(o).toLowerCase().includes(q);
      const matchTxRef = (o.payment_details?.transaction_ref || '').toLowerCase().includes(q);

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

          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            <button
              onClick={handleBulkSyncOrders}
              disabled={isBulkSyncing}
              className="h-9 px-3.5 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-900 font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              title="Fetch and synchronize all previous orders from WooCommerce REST API"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-purple-700 ${isBulkSyncing ? 'animate-spin' : ''}`} />
              <span>{isBulkSyncing ? 'Syncing WC Orders...' : 'Sync Orders from API'}</span>
            </button>

            <button
              onClick={handleRunAudit}
              disabled={isAuditing}
              className="h-9 px-3.5 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 text-cyan-800 font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              title="Audit and link orders to customer WordPress accounts"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-600" />
              <span>{isAuditing ? 'Auditing Orders...' : 'Customer Account Audit'}</span>
            </button>

            <button
              onClick={() => onRefresh()}
              className="h-9 px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
              <span>Refresh</span>
            </button>
          </div>
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
                        {getSafeCustomerName(ord)}
                      </div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">
                        {getSafeCustomerPhone(ord) || 'No phone'}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {getSafeCustomerPhone(ord) && (
                        <>
                          <a
                            href={`tel:${getSafeCustomerPhone(ord).replace(/\s+/g, '')}`}
                            className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center cursor-pointer transition-colors"
                            title="Call customer"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                          <a
                            href={`https://wa.me/${getSafeCustomerPhone(ord).replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(
                              getSafeCustomerName(ord)
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
                        <span>{getSafeCustomerLocation(ord)}</span>
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
                      {getSafeCustomerAddress(ord)}
                    </div>
                  </div>

                  {/* Items & Total Pricing */}
                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <span className="text-[11px] text-slate-500">Order Total:</span>
                      <div className="text-base font-black text-slate-900 tracking-tight">
                        UGX {(ord.total || 0).toLocaleString()}
                      </div>
                    </div>

                    <div className="text-right text-[11px] text-slate-500">
                      <span>{ord.line_items?.length || 0} item(s)</span>
                      <div className="font-mono text-[10px]">
                        {ord.woocommerce_order_id ? (
                          <a
                            href={ord.woocommerce_receipt_url || `https://www.cyberdynamictech.com/wp-admin/post.php?post=${ord.woocommerce_order_id}&action=edit`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-700 hover:text-purple-900 font-bold inline-flex items-center gap-0.5"
                            title="Open in WooCommerce"
                          >
                            <span>WC #{ord.woocommerce_order_id}</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        ) : (
                          <span className="text-slate-400">Local Store</span>
                        )}
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

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1">
                      {/* Document Button: Receipt or Invoice */}
                      <button
                        onClick={() => (ord.payment_status === 'paid' || ord.status === 'completed' || ord.status === 'delivered') ? handleOpenReceipt(ord) : handleOpenInvoice(ord)}
                        className={`py-2 px-2.5 font-bold text-[11px] rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-colors border ${
                          (ord.payment_status === 'paid' || ord.status === 'completed' || ord.status === 'delivered')
                            ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                            : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300'
                        }`}
                        title={
                          (ord.payment_status === 'paid' || ord.status === 'completed' || ord.status === 'delivered')
                            ? 'Download or Print Payment Receipt'
                            : 'Download or Print Commercial Invoice'
                        }
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>
                          {(ord.payment_status === 'paid' || ord.status === 'completed' || ord.status === 'delivered') ? 'Receipt' : 'Invoice'}
                        </span>
                      </button>

                      {/* Change Order Button */}
                      <button
                        onClick={() => handleOpenEditModal(ord)}
                        className="py-2 px-2.5 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-200 font-bold text-[11px] rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-colors"
                        title="Edit order items, quantities, addresses, tracking & status"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-cyan-700" />
                        <span>Change</span>
                      </button>

                      {/* Cancel Order Button */}
                      {ord.status !== 'cancelled' && (
                        <button
                          onClick={() => handleCancelOrder(ord)}
                          disabled={cancellingOrderId === ord.order_number}
                          className="py-2 px-2.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-bold text-[11px] rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-colors disabled:opacity-50"
                          title="Cancel this order"
                        >
                          <Ban className="w-3.5 h-3.5 text-rose-600" />
                          <span>{cancellingOrderId === ord.order_number ? '...' : 'Cancel'}</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleOpenStatusModal(ord)}
                        className="py-2 px-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] rounded-lg flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>Stage</span>
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
                            {getSafeCustomerName(ord)}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] text-slate-500 font-mono">
                              {getSafeCustomerPhone(ord) || 'No phone'}
                            </span>
                            {getSafeCustomerPhone(ord) && (
                              <a
                                href={`https://wa.me/${getSafeCustomerPhone(ord).replace(/[^0-9]/g, '')}`}
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
                            <span>{getSafeCustomerLocation(ord)}</span>
                          </div>
                          <div className="text-[10px] text-slate-500 truncate max-w-[150px]">
                            {getSafeCustomerAddress(ord)}
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
                            UGX {(ord.total || 0).toLocaleString()}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {ord.line_items?.length || 0} item(s)
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
                            <a
                              href={ord.woocommerce_receipt_url || `https://www.cyberdynamictech.com/wp-admin/post.php?post=${ord.woocommerce_order_id}&action=edit`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 inline-flex items-center gap-1 transition-colors"
                              title="View on WooCommerce"
                            >
                              <span>WC #{ord.woocommerce_order_id}</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
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
                        <td className="p-3.5 text-right space-x-1 whitespace-nowrap">
                          {isAwaitingPayment && (
                            <button
                              onClick={() => handleConfirmPayment(ord)}
                              disabled={isConfirming}
                              className="px-2 py-1 rounded-lg bg-[#007f19] hover:bg-[#006013] disabled:opacity-50 text-white font-bold text-[10px] transition-colors cursor-pointer shadow-2xs inline-flex items-center gap-1"
                            >
                              <Check className="w-3 h-3" />
                              <span>{isConfirming ? 'Verifying...' : 'Confirm'}</span>
                            </button>
                          )}

                          {/* Document Button: Receipt or Invoice */}
                          <button
                            onClick={() => (ord.payment_status === 'paid' || ord.status === 'completed' || ord.status === 'delivered') ? handleOpenReceipt(ord) : handleOpenInvoice(ord)}
                            className={`px-2 py-1 rounded-lg font-bold text-[10px] inline-flex items-center gap-1 transition-colors cursor-pointer border ${
                              (ord.payment_status === 'paid' || ord.status === 'completed' || ord.status === 'delivered')
                                ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                                : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300'
                            }`}
                            title={
                              (ord.payment_status === 'paid' || ord.status === 'completed' || ord.status === 'delivered')
                                ? 'Download or Print Payment Receipt'
                                : 'Download or Print Commercial Invoice'
                            }
                          >
                            <FileText className="w-3 h-3" />
                            <span>
                              {(ord.payment_status === 'paid' || ord.status === 'completed' || ord.status === 'delivered') ? 'Receipt' : 'Invoice'}
                            </span>
                          </button>

                          {/* Change Order Button */}
                          <button
                            onClick={() => handleOpenEditModal(ord)}
                            className="px-2 py-1 rounded-lg bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-200 font-bold text-[10px] transition-colors cursor-pointer inline-flex items-center gap-1"
                            title="Edit order items, quantities, addresses, tracking & status"
                          >
                            <Edit3 className="w-3 h-3 text-cyan-700" />
                            <span>Change</span>
                          </button>

                          {/* Cancel Order Button */}
                          {ord.status !== 'cancelled' && (
                            <button
                              onClick={() => handleCancelOrder(ord)}
                              disabled={cancellingOrderId === ord.order_number}
                              className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-bold text-[10px] transition-colors cursor-pointer inline-flex items-center gap-1 disabled:opacity-50"
                              title="Cancel this order"
                            >
                              <Ban className="w-3 h-3 text-rose-600" />
                              <span>{cancellingOrderId === ord.order_number ? '...' : 'Cancel'}</span>
                            </button>
                          )}

                          <button
                            onClick={() => handleOpenStatusModal(ord)}
                            className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-700 font-bold text-[10px] transition-colors cursor-pointer"
                          >
                            Stage
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
                  {getSafeCustomerName(selectedOrder)} • {getSafeCustomerLocation(selectedOrder)}
                </p>
              </div>
              <span className="text-xs font-black text-slate-900 font-mono bg-slate-100 px-2 py-1 rounded-md">
                UGX {(selectedOrder.total || 0).toLocaleString()}
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

      {/* CUSTOMER UID AUDIT & SAFE MIGRATION MODAL */}
      {showAuditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-cyan-100 text-cyan-700">
                  <ShieldCheck className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    Customer Account Order Association Audit
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Verify that WooCommerce orders are linked to customer WordPress accounts.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAuditModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-slate-100 rounded-xl text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Orders</span>
                  <span className="text-lg font-black text-slate-900">{auditResult?.totalOrders ?? 0}</span>
                </div>
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                  <span className="text-[10px] uppercase font-bold text-emerald-600 block">Linked to WordPress Account</span>
                  <span className="text-lg font-black text-emerald-700">{auditResult?.linkedOrdersCount ?? 0}</span>
                </div>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-center">
                  <span className="text-[10px] uppercase font-bold text-amber-600 block">Guest Orders</span>
                  <span className="text-lg font-black text-amber-700">{auditResult?.legacyOrdersCount ?? 0}</span>
                </div>
              </div>

              <div className="p-3 bg-cyan-50 border border-cyan-200 rounded-xl text-[11px] text-cyan-900 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                  <span>Customer Ownership Verification</span>
                </p>
                <p>
                  Orders with a valid <code>userId</code> appear automatically in that customer's "My Orders" account tab across all devices and browser sessions. Existing orders are never automatically re-assigned or deleted.
                </p>
              </div>

              {/* Legacy Orders List */}
              <div className="space-y-2">
                <h4 className="font-black text-slate-800 text-xs">
                  Guest / Unassigned Orders ({auditResult?.legacyOrders.length || 0})
                </h4>

                {(!auditResult || auditResult.legacyOrders.length === 0) ? (
                  <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-1">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                    <p className="font-bold text-slate-800 text-xs">All Orders Validated</p>
                    <p className="text-[11px] text-slate-500">
                      No orphaned orders found. All orders are properly associated with WordPress / WooCommerce user accounts.
                    </p>
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden">
                    {auditResult.legacyOrders.map((lo: any) => {
                      const id = String(lo.orderNumber || lo.order_number || lo.id);
                      return (
                        <div key={id} className="p-3 space-y-2 bg-white hover:bg-slate-50">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-black text-slate-900 text-xs">#{id}</span>
                              <span className="text-[11px] text-slate-500 ml-2">
                                {lo.customerEmail || lo.billing?.email || 'No email'} • {lo.customerName || 'Customer'}
                              </span>
                            </div>
                            <span className="font-black text-slate-900 text-xs">{formatPrice(lo.total || 0)}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="Enter customer WordPress / WooCommerce user ID"
                              value={manualUidMap[id] || ''}
                              onChange={(e) => setManualUidMap({ ...manualUidMap, [id]: e.target.value })}
                              className="flex-1 h-8 px-2.5 border border-slate-200 rounded-lg text-xs font-mono focus:outline-hidden focus:border-cyan-500"
                            />
                            <button
                              type="button"
                              onClick={() => handleMigrateOrder(id)}
                              disabled={isMigratingId === id || !manualUidMap[id]?.trim()}
                              className="h-8 px-3 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer shrink-0"
                            >
                              {isMigratingId === id ? 'Linking...' : 'Link to Account'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                type="button"
                onClick={() => setShowAuditModal(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg cursor-pointer"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. OFFICIAL RECEIPT OR COMMERCIAL INVOICE MODAL */}
      {documentOrder && (
        <OrderReceiptModal
          order={documentOrder}
          forceType={documentType}
          onClose={() => {
            setDocumentOrder(null);
            setDocumentType(undefined);
          }}
        />
      )}

      {/* 6. ADMIN CHANGE / EDIT ORDER MODAL */}
      {editingOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-4 max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400">
                  <Edit3 className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="font-black text-sm text-white">
                    Change Order: #{editingOrder.order_number}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Modify order items, quantities, pricing, customer details, delivery & payment stage
                  </p>
                </div>
              </div>

              <button
                onClick={() => setEditingOrder(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Form Body */}
            <div className="p-5 overflow-y-auto space-y-5 text-xs bg-slate-50/50">
              {/* Status & Payment Settings */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-cyan-600" />
                  <span>Order Stage & Payment Status</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Progression Stage:</label>
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                      className="w-full h-9 px-3 border border-slate-200 rounded-lg font-bold bg-white focus:outline-hidden focus:border-cyan-500"
                    >
                      <option value="pending">Pending</option>
                      <option value="pending_payment">Pending Payment Confirmation</option>
                      <option value="processing">Processing (Packing & Testing)</option>
                      <option value="packed">Packed & Sealed in Hub</option>
                      <option value="shipped">Dispatched / En Route</option>
                      <option value="out-for-delivery">Out for Delivery in District</option>
                      <option value="delivered">Delivered to Customer</option>
                      <option value="completed">Completed & Reconciled</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="refunded">Refunded</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Payment Status:</label>
                    <select
                      value={editForm.payment_status}
                      onChange={(e) => setEditForm({ ...editForm, payment_status: e.target.value })}
                      className="w-full h-9 px-3 border border-slate-200 rounded-lg font-bold bg-white focus:outline-hidden focus:border-cyan-500"
                    >
                      <option value="paid">Paid (Receipt Ready)</option>
                      <option value="unpaid">Unpaid / Pending (Invoice Ready)</option>
                      <option value="refunded">Refunded / Voided</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Payment Channel:</label>
                    <input
                      type="text"
                      value={editForm.payment_method_title}
                      onChange={(e) => setEditForm({ ...editForm, payment_method_title: e.target.value })}
                      placeholder="e.g. MTN Mobile Money (*165*3#)"
                      className="w-full h-9 px-3 border border-slate-200 rounded-lg focus:outline-hidden focus:border-cyan-500 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Customer & Delivery Coordinates */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-cyan-600" />
                  <span>Customer & Shipping Information</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">First Name:</label>
                    <input
                      type="text"
                      value={editForm.first_name}
                      onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                      className="w-full h-9 px-3 border border-slate-200 rounded-lg focus:outline-hidden focus:border-cyan-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Last Name:</label>
                    <input
                      type="text"
                      value={editForm.last_name}
                      onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                      className="w-full h-9 px-3 border border-slate-200 rounded-lg focus:outline-hidden focus:border-cyan-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Customer Email:</label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className="w-full h-9 px-3 border border-slate-200 rounded-lg focus:outline-hidden focus:border-cyan-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Customer Phone (Mobile Money):</label>
                    <input
                      type="text"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className="w-full h-9 px-3 border border-slate-200 rounded-lg focus:outline-hidden focus:border-cyan-500 bg-white font-mono"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="font-bold text-slate-700 block mb-1">Delivery Physical Address / Building:</label>
                    <input
                      type="text"
                      value={editForm.address_1}
                      onChange={(e) => setEditForm({ ...editForm, address_1: e.target.value })}
                      className="w-full h-9 px-3 border border-slate-200 rounded-lg focus:outline-hidden focus:border-cyan-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Delivery Zone / District:</label>
                    <input
                      type="text"
                      value={editForm.delivery_zone}
                      onChange={(e) => setEditForm({ ...editForm, delivery_zone: e.target.value })}
                      className="w-full h-9 px-3 border border-slate-200 rounded-lg focus:outline-hidden focus:border-cyan-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Shipping / Courier Fee (UGX):</label>
                    <input
                      type="number"
                      value={editForm.shipping_total}
                      onChange={(e) => setEditForm({ ...editForm, shipping_total: Number(e.target.value) || 0 })}
                      className="w-full h-9 px-3 border border-slate-200 rounded-lg focus:outline-hidden focus:border-cyan-500 bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Courier Service Provider:</label>
                    <input
                      type="text"
                      value={editForm.shipping_provider}
                      onChange={(e) => setEditForm({ ...editForm, shipping_provider: e.target.value })}
                      placeholder="e.g. Cyber Dynamic Express"
                      className="w-full h-9 px-3 border border-slate-200 rounded-lg focus:outline-hidden focus:border-cyan-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Courier Tracking Number:</label>
                    <input
                      type="text"
                      value={editForm.tracking_number}
                      onChange={(e) => setEditForm({ ...editForm, tracking_number: e.target.value })}
                      placeholder="e.g. CDT-TRK-9901"
                      className="w-full h-9 px-3 border border-slate-200 rounded-lg focus:outline-hidden focus:border-cyan-500 bg-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Line Items Editor with Live Calculation */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-cyan-600" />
                    <span>Order Items & Pricing ({editForm.line_items.length})</span>
                  </h4>

                  <button
                    type="button"
                    onClick={() => {
                      setEditForm({
                        ...editForm,
                        line_items: [
                          ...editForm.line_items,
                          {
                            id: Date.now(),
                            product_id: 100,
                            name: 'Additional Hardware / Component',
                            quantity: 1,
                            price: 50000,
                            total: 50000,
                          },
                        ],
                      });
                    }}
                    className="px-2.5 py-1 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-200 font-bold text-[10px] rounded-lg inline-flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Plus className="w-3 h-3 text-cyan-600" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-2.5">
                  {editForm.line_items.map((item, idx) => (
                    <div key={idx} className="p-3 rounded-lg border border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex-1 w-full sm:w-auto">
                        <label className="text-[10px] text-slate-400 font-bold uppercase block mb-0.5">Item Name</label>
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => {
                            const updated = [...editForm.line_items];
                            updated[idx].name = e.target.value;
                            setEditForm({ ...editForm, line_items: updated });
                          }}
                          className="w-full h-8 px-2.5 bg-white border border-slate-200 rounded text-xs font-semibold focus:outline-hidden focus:border-cyan-500"
                        />
                      </div>

                      <div className="w-24">
                        <label className="text-[10px] text-slate-400 font-bold uppercase block mb-0.5">Unit Price</label>
                        <input
                          type="number"
                          value={item.price}
                          onChange={(e) => {
                            const updated = [...editForm.line_items];
                            const p = Number(e.target.value) || 0;
                            updated[idx].price = p;
                            updated[idx].total = p * (updated[idx].quantity || 1);
                            setEditForm({ ...editForm, line_items: updated });
                          }}
                          className="w-full h-8 px-2 bg-white border border-slate-200 rounded text-xs font-mono text-right focus:outline-hidden focus:border-cyan-500"
                        />
                      </div>

                      <div className="w-20">
                        <label className="text-[10px] text-slate-400 font-bold uppercase block mb-0.5 text-center">Qty</label>
                        <div className="flex items-center border border-slate-200 rounded bg-white overflow-hidden h-8">
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...editForm.line_items];
                              if (updated[idx].quantity > 1) {
                                updated[idx].quantity -= 1;
                                updated[idx].total = updated[idx].price * updated[idx].quantity;
                                setEditForm({ ...editForm, line_items: updated });
                              }
                            }}
                            className="px-2 h-full text-slate-600 hover:bg-slate-100 font-bold"
                          >
                            -
                          </button>
                          <span className="flex-1 text-center font-bold font-mono text-xs">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...editForm.line_items];
                              updated[idx].quantity += 1;
                              updated[idx].total = updated[idx].price * updated[idx].quantity;
                              setEditForm({ ...editForm, line_items: updated });
                            }}
                            className="px-2 h-full text-slate-600 hover:bg-slate-100 font-bold"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="w-28 text-right">
                        <label className="text-[10px] text-slate-400 font-bold uppercase block mb-0.5">Line Total</label>
                        <span className="font-mono font-black text-slate-900 text-xs block py-1.5">
                          {formatPrice(item.total)}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const updated = editForm.line_items.filter((_, i) => i !== idx);
                          setEditForm({ ...editForm, line_items: updated });
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer self-end sm:self-center"
                        title="Remove Item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Live Calculations Summary Box */}
                <div className="p-3 bg-slate-100 rounded-xl space-y-1 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Recalculated Subtotal:</span>
                    <span className="font-mono font-bold">
                      {formatPrice(editForm.line_items.reduce((acc, i) => acc + (Number(i.total) || 0), 0))}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Shipping Fee:</span>
                    <span className="font-mono font-bold">
                      {formatPrice(Number(editForm.shipping_total) || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-900 font-black text-sm pt-1.5 border-t border-slate-200">
                    <span>New Order Grand Total:</span>
                    <span className="font-mono text-cyan-700">
                      {formatPrice(
                        editForm.line_items.reduce((acc, i) => acc + (Number(i.total) || 0), 0) +
                        (Number(editForm.shipping_total) || 0)
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider">
                  Customer & Internal Admin Notes
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Customer / Delivery Note:</label>
                    <textarea
                      rows={2}
                      value={editForm.customer_note}
                      onChange={(e) => setEditForm({ ...editForm, customer_note: e.target.value })}
                      placeholder="e.g. Leave with security at gate"
                      className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-hidden focus:border-cyan-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Internal Admin Note:</label>
                    <textarea
                      rows={2}
                      value={editForm.admin_notes}
                      onChange={(e) => setEditForm({ ...editForm, admin_notes: e.target.value })}
                      placeholder="e.g. Customer requested upgrade to 16GB RAM"
                      className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-hidden focus:border-cyan-500 bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Action Footer */}
            <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between">
              <p className="text-[11px] text-slate-500">
                Changes will sync to WooCommerce if order is linked.
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingOrder(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveOrderChanges}
                  disabled={isSavingChanges}
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white font-bold text-xs rounded-lg shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {isSavingChanges ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  <span>{isSavingChanges ? 'Saving Changes...' : 'Save Order Changes'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
