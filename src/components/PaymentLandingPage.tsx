import React, { useState } from 'react';
import {
  CheckCircle2,
  Copy,
  Check,
  Clock,
  ShieldCheck,
  Phone,
  MessageSquare,
  ArrowRight,
  ExternalLink,
  MapPin,
  AlertTriangle,
  Receipt,
  Send,
} from 'lucide-react';
import { CustomerOrder } from '../types';
import { api } from '../services/api';

interface PaymentLandingPageProps {
  order: CustomerOrder;
  onContinueShopping: () => void;
  onTrackOrder: (orderNumber: string) => void;
  onOrderUpdated?: (updatedOrder: CustomerOrder) => void;
}

export const PaymentLandingPage: React.FC<PaymentLandingPageProps> = ({
  order,
  onContinueShopping,
  onTrackOrder,
  onOrderUpdated,
}) => {
  const [copiedNumber, setCopiedNumber] = useState(false);
  const [copiedOrderId, setCopiedOrderId] = useState(false);

  // Customer payment proof submission
  const [senderPhone, setSenderPhone] = useState(order.billing?.phone || '');
  const [transactionRef, setTransactionRef] = useState(order.payment_details?.transaction_ref || '');
  const [proofNote, setProofNote] = useState('');
  const [isSubmittingProof, setIsSubmittingProof] = useState(false);
  const [proofSubmitted, setProofSubmitted] = useState(Boolean(order.payment_submitted));
  const [currentOrder, setCurrentOrder] = useState<CustomerOrder>(order);

  const paymentNumber = currentOrder.payment_details?.payment_number || '0394 760459';
  const accountName = currentOrder.payment_details?.account_name || 'CYBER DYNAMIC TECH';
  const isCOD = currentOrder.payment_method === 'cod';
  const isConfirmed = currentOrder.status === 'processing' || currentOrder.payment_details?.status === 'completed';

  const cleanPhoneForCall = paymentNumber.replace(/[^0-9]/g, '');
  const whatsappPhone = cleanPhoneForCall.startsWith('0')
    ? '256' + cleanPhoneForCall.slice(1)
    : cleanPhoneForCall;

  const handleCopyNumber = () => {
    navigator.clipboard.writeText(paymentNumber);
    setCopiedNumber(true);
    setTimeout(() => setCopiedNumber(false), 2500);
  };

  const handleCopyOrderId = () => {
    navigator.clipboard.writeText(currentOrder.order_number);
    setCopiedOrderId(true);
    setTimeout(() => setCopiedOrderId(false), 2500);
  };

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingProof(true);
    try {
      const res = await api.submitOrderPayment(currentOrder.order_number, {
        phone: senderPhone,
        transaction_ref: transactionRef,
        note: proofNote,
      });
      if (res.success && res.order) {
        setCurrentOrder(res.order);
        setProofSubmitted(true);
        if (onOrderUpdated) onOrderUpdated(res.order);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to submit payment notification. Please try again or WhatsApp management directly.');
    } finally {
      setIsSubmittingProof(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-10 space-y-6">
      {/* HEADER CARD */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 text-center space-y-4">
        {/* Official Cyber Dynamic Technologies Logo */}
        <div className="flex justify-center pb-1">
          <img
            src="/logo.png"
            alt="Cyber Dynamic Technologies - Technology • Solutions • Growth"
            className="h-12 sm:h-14 w-auto object-contain"
            referrerPolicy="no-referrer"
          />
        </div>

        <div className="w-14 h-14 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center mx-auto border border-cyan-100 shadow-2xs">
          {isCOD ? (
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          ) : isConfirmed ? (
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          ) : (
            <Receipt className="w-8 h-8 text-cyan-600" />
          )}
        </div>

        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border mb-2 uppercase tracking-wide">
            {isCOD ? (
              <span className="text-emerald-700 bg-emerald-50 border-emerald-200">
                Cash on Delivery • Payment upon Inspection
              </span>
            ) : isConfirmed ? (
              <span className="text-emerald-700 bg-emerald-50 border-emerald-200">
                Payment Confirmed • Processing with WooCommerce
              </span>
            ) : proofSubmitted ? (
              <span className="text-amber-700 bg-amber-50 border-amber-200 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 animate-spin text-amber-600" />
                Payment Submitted • Awaiting Manager Approval
              </span>
            ) : (
              <span className="text-orange-700 bg-orange-50 border-orange-200 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-orange-600" />
                Awaiting Payment Transfer
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {isCOD
              ? 'Order Received! Cash on Delivery Confirmed'
              : isConfirmed
              ? 'Payment Confirmed by Store Manager!'
              : 'Complete Your Order Payment'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Order Reference:{' '}
            <strong className="text-slate-900 font-mono font-black">{currentOrder.order_number}</strong>
          </p>
        </div>

        {/* VERBATIM PAYMENT INSTRUCTION CALLOUT FOR MOBILE MONEY & TRANSFERS */}
        {!isCOD && !isConfirmed && (
          <div className="p-5 sm:p-6 bg-gradient-to-br from-amber-50/80 to-orange-50/60 rounded-xl border-2 border-amber-300 text-left space-y-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-amber-400 text-amber-950 shrink-0 mt-0.5">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h2 className="text-xs font-black uppercase tracking-wider text-amber-950">
                  Official Payment Instruction
                </h2>
                <p className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                  "Make the payment to{' '}
                  <span className="text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded font-mono">
                    {paymentNumber}
                  </span>{' '}
                  and put accounts names{' '}
                  <span className="underline decoration-amber-500 decoration-2 font-black text-slate-950">
                    {accountName}
                  </span>
                  , please use order number as id"
                </p>
              </div>
            </div>

            {/* ACTIONABLE COPY BUTTONS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {/* COPY PHONE NUMBER */}
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-amber-200 shadow-2xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Payment Phone Number
                  </span>
                  <span className="text-sm font-black font-mono text-slate-900">
                    {paymentNumber}
                  </span>
                  <span className="text-[10px] text-amber-700 block font-medium">({accountName})</span>
                </div>
                <button
                  type="button"
                  id="copy-payment-number-btn"
                  onClick={handleCopyNumber}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    copiedNumber
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-amber-100 hover:bg-amber-200 text-amber-950'
                  }`}
                >
                  {copiedNumber ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Number</span>
                    </>
                  )}
                </button>
              </div>

              {/* COPY ORDER ID */}
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-amber-200 shadow-2xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Payment Reference / ID
                  </span>
                  <span className="text-sm font-black font-mono text-slate-900">
                    {currentOrder.order_number}
                  </span>
                  <span className="text-[10px] text-slate-500 block font-medium">Amount: UGX {currentOrder.total.toLocaleString()}</span>
                </div>
                <button
                  type="button"
                  id="copy-order-id-btn"
                  onClick={handleCopyOrderId}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    copiedOrderId
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                  }`}
                >
                  {copiedOrderId ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy ID</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="p-3 bg-amber-100/50 rounded-lg text-xs text-amber-900 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <span>
                <strong>Verification Policy:</strong> Our store admin or manager will verify and confirm your payment receipt before the order is packed and dispatched. Once confirmed, your order automatically synchronizes with WooCommerce.
              </span>
            </div>
          </div>
        )}

        {/* CUSTOMER SUBMIT PAYMENT PROOF FORM */}
        {!isCOD && !isConfirmed && (
          <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 text-left space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <Send className="w-3.5 h-3.5 text-cyan-600" />
              <span>Submit Payment Verification Details</span>
            </h3>
            <p className="text-xs text-slate-500">
              Have you sent the funds to {paymentNumber} ({accountName})? Enter your details below so our store manager can instantly verify your transfer:
            </p>

            <form onSubmit={handleSubmitProof} className="space-y-3 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Your Mobile Money Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={senderPhone}
                    onChange={(e) => setSenderPhone(e.target.value)}
                    placeholder="+256 7XX XXX XXX"
                    className="w-full h-8 px-2.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold focus:outline-hidden focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Transaction ID / Reference (Optional)</label>
                  <input
                    type="text"
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    placeholder="e.g. 1928471289"
                    className="w-full h-8 px-2.5 bg-white border border-slate-300 rounded-lg text-xs font-mono focus:outline-hidden focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1 text-xs">Notes for Manager (Optional)</label>
                <input
                  type="text"
                  value={proofNote}
                  onChange={(e) => setProofNote(e.target.value)}
                  placeholder="e.g. Sent from John's phone via Airtel Money"
                  className="w-full h-8 px-2.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-hidden focus:border-cyan-500"
                />
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                <button
                  type="submit"
                  disabled={isSubmittingProof}
                  className="w-full sm:w-auto px-5 py-2.5 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-all"
                >
                  <Check className="w-4 h-4" />
                  <span>
                    {isSubmittingProof
                      ? 'Submitting to Manager...'
                      : proofSubmitted
                      ? 'Update Payment Details'
                      : 'I Have Made This Payment'}
                  </span>
                </button>

                <a
                  href={`https://wa.me/${whatsappPhone}?text=${encodeURIComponent(
                    `Hello Cyber Dynamic Tech Support, I have placed order ${currentOrder.order_number} for UGX ${currentOrder.total.toLocaleString()} and made payment to ${paymentNumber}. Please confirm!`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                  <span>WhatsApp Store Manager</span>
                  <ExternalLink className="w-3 h-3 text-emerald-500" />
                </a>
              </div>
            </form>
          </div>
        )}

        {/* ORDER DETAILS SUMMARY */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-left space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2 text-xs font-bold text-slate-800">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-cyan-600" />
              <span>
                Delivery: {currentOrder.shipping.address_1}, {currentOrder.shipping.district}
              </span>
            </div>
            <span className="text-cyan-700 font-bold bg-cyan-50 px-2 py-0.5 rounded border border-cyan-100">
              {currentOrder.delivery_zone}
            </span>
          </div>

          {currentOrder.coordinates && (
            <div className="p-2 bg-white rounded-lg border border-slate-200 text-[11px] text-slate-600 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                <span>
                  Delivery Coordinates: <strong>{currentOrder.coordinates.latitude.toFixed(4)}, {currentOrder.coordinates.longitude.toFixed(4)}</strong>
                </span>
              </span>
              <a
                href={`https://www.google.com/maps?q=${currentOrder.coordinates.latitude},${currentOrder.coordinates.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-600 hover:underline font-bold flex items-center gap-0.5"
              >
                <span>View on Maps</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

          <div className="divide-y divide-slate-100 text-xs">
            {currentOrder.line_items.map((item) => (
              <div key={item.id} className="py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-slate-900">{item.quantity}x</span>
                  <span className="text-slate-800">{item.name}</span>
                </div>
                <span className="font-bold text-slate-900">UGX {item.total.toLocaleString()}</span>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-xs font-black text-slate-900">
            <span>Total Amount Due:</span>
            <span className="text-cyan-600 text-sm">UGX {currentOrder.total.toLocaleString()}</span>
          </div>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => onTrackOrder(currentOrder.order_number)}
            className="w-full sm:w-auto py-2.5 px-6 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Track Order Progression</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onContinueShopping}
            className="w-full sm:w-auto py-2.5 px-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
};
