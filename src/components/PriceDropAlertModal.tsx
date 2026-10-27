import React, { useState, useEffect } from 'react';
import {
  Bell,
  X,
  CheckCircle2,
  AlertCircle,
  Mail,
  Phone,
  ArrowDownRight,
  Loader2,
  Trash2,
  Info,
} from 'lucide-react';
import { Product, PriceDropAlert } from '../types';
import { api } from '../services/api';

interface PriceDropAlertModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  userPhone?: string;
  onAlertUpdated?: (alert: PriceDropAlert | null) => void;
}

export const PriceDropAlertModal: React.FC<PriceDropAlertModalProps> = ({
  product,
  isOpen,
  onClose,
  userEmail,
  userPhone,
  onAlertUpdated,
}) => {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notifyType, setNotifyType] = useState<'both' | 'email' | 'phone'>('both');
  const [targetType, setTargetType] = useState<'any' | 'custom'>('any');
  const [targetPrice, setTargetPrice] = useState<string>('');
  
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [existingAlert, setExistingAlert] = useState<PriceDropAlert | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize form with user's prefilled email/phone if provided
  useEffect(() => {
    if (isOpen) {
      setSuccessMessage(null);
      setErrorMessage(null);
      const initialEmail = userEmail || '';
      const initialPhone = userPhone || '';
      setEmail(initialEmail);
      setPhone(initialPhone);

      if (initialEmail && initialPhone) {
        setNotifyType('both');
      } else if (initialPhone) {
        setNotifyType('phone');
      } else {
        setNotifyType('email');
      }

      // Check existing subscription status
      if (initialEmail || initialPhone) {
        setCheckingStatus(true);
        api
          .getPriceDropAlertStatus(product.id, { email: initialEmail, phone: initialPhone })
          .then((res) => {
            if (res.subscribed && res.alert) {
              setExistingAlert(res.alert);
              if (res.alert.email) setEmail(res.alert.email);
              if (res.alert.phone) setPhone(res.alert.phone);
              if (res.alert.notify_type) setNotifyType(res.alert.notify_type);
              if (res.alert.target_price) {
                setTargetType('custom');
                setTargetPrice(String(res.alert.target_price));
              }
            } else {
              setExistingAlert(null);
            }
          })
          .catch(() => {})
          .finally(() => setCheckingStatus(false));
      } else {
        setExistingAlert(null);
      }
    }
  }, [isOpen, product.id, userEmail, userPhone]);

  if (!isOpen) return null;

  // Preset percentage discounts for quick target price calculation
  const setQuickDiscount = (percentage: number) => {
    const discounted = Math.round(product.price * (1 - percentage / 100));
    setTargetType('custom');
    setTargetPrice(String(discounted));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim();
    const cleanPhone = phone.trim();

    if (!cleanEmail && !cleanPhone) {
      setErrorMessage('Please provide either an email address or a phone number.');
      return;
    }

    if (notifyType === 'email' && !cleanEmail) {
      setErrorMessage('Please enter an email address for email notifications.');
      return;
    }

    if (notifyType === 'phone' && !cleanPhone) {
      setErrorMessage('Please enter a phone number for SMS notifications.');
      return;
    }

    let parsedTargetPrice: number | undefined = undefined;
    if (targetType === 'custom' && targetPrice) {
      parsedTargetPrice = Number(targetPrice);
      if (isNaN(parsedTargetPrice) || parsedTargetPrice <= 0) {
        setErrorMessage('Please enter a valid target price.');
        return;
      }
      if (parsedTargetPrice >= product.price) {
        setErrorMessage(`Target price must be lower than the current price of UGX ${product.price.toLocaleString()}.`);
        return;
      }
    }

    setLoading(true);
    try {
      const res = await api.subscribePriceDropAlert(product.id, {
        email: cleanEmail || undefined,
        phone: cleanPhone || undefined,
        notify_type: notifyType,
        target_price: parsedTargetPrice,
      });

      if (res.success) {
        setExistingAlert(res.alert);
        setSuccessMessage(res.message);
        if (onAlertUpdated) {
          onAlertUpdated(res.alert);
        }
      } else {
        setErrorMessage(res.message || 'Could not save alert. Please check your details.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Network error while registering price drop alert.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAlert = async () => {
    if (!existingAlert) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await api.cancelPriceDropAlert(product.id, {
        alert_id: existingAlert.id,
        email: existingAlert.email,
        phone: existingAlert.phone,
      });

      if (res.success) {
        setExistingAlert(null);
        setSuccessMessage('Your price drop alert has been deactivated.');
        if (onAlertUpdated) {
          onAlertUpdated(null);
        }
      } else {
        setErrorMessage(res.message || 'Failed to cancel alert.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Network error while cancelling alert.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      id="price-drop-alert-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="price-drop-alert-modal-card"
        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-600 via-cyan-700 to-slate-900 text-white p-4 sm:p-5 flex items-start justify-between relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 text-white shadow-inner flex-shrink-0">
              <Bell className="w-5 h-5 text-amber-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base sm:text-lg tracking-tight">Price Drop Alert</h3>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-400 text-amber-950 uppercase tracking-wider">
                  WooCommerce Sync
                </span>
              </div>
              <p className="text-xs text-cyan-100 font-medium mt-0.5">
                Get notified immediately when this product price is reduced in the backend.
              </p>
            </div>
          </div>
          <button
            id="close-price-alert-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {/* Product Mini Banner */}
          <div className="flex items-center gap-3.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
            <img
              src={product.images?.[0]?.src || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800'}
              alt={product.name}
              className="w-14 h-14 object-cover rounded-lg border border-slate-200 bg-white flex-shrink-0"
            />
            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-xs sm:text-sm text-slate-800 line-clamp-1">{product.name}</h4>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-xs text-slate-500 font-medium">Current Price:</span>
                <span className="text-sm font-black text-cyan-700">UGX {product.price.toLocaleString()}</span>
                {product.regular_price > product.price && (
                  <span className="text-xs text-slate-400 line-through">
                    UGX {product.regular_price.toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Existing Alert Notice */}
          {existingAlert && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs space-y-0.5">
                  <p className="font-bold">You have an active alert on this product</p>
                  <p className="text-emerald-700">
                    Channel: <span className="font-semibold uppercase">{existingAlert.notify_type}</span>{' '}
                    {existingAlert.target_price ? (
                      <>| Below: <span className="font-semibold">UGX {existingAlert.target_price.toLocaleString()}</span></>
                    ) : (
                      '| On any price drop'
                    )}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCancelAlert}
                disabled={loading}
                className="text-[11px] font-bold text-red-600 hover:text-red-700 flex items-center gap-1 hover:underline cursor-pointer flex-shrink-0"
                title="Remove alert subscription"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove</span>
              </button>
            </div>
          )}

          {/* Success Message Banner */}
          {successMessage && (
            <div className="p-3 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-900 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-600 flex-shrink-0" />
              <span className="font-medium">{successMessage}</span>
            </div>
          )}

          {/* Error Message Banner */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span className="font-medium">{errorMessage}</span>
            </div>
          )}

          {/* Subscription Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Preferred Delivery Channel */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                How should we notify you?
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setNotifyType('both')}
                  className={`py-2 px-2.5 rounded-lg border text-xs font-bold transition-all cursor-pointer text-center ${
                    notifyType === 'both'
                      ? 'border-cyan-600 bg-cyan-50 text-cyan-800 ring-2 ring-cyan-500/20 shadow-2xs'
                      : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                  }`}
                >
                  SMS & Email
                </button>
                <button
                  type="button"
                  onClick={() => setNotifyType('phone')}
                  className={`py-2 px-2.5 rounded-lg border text-xs font-bold transition-all cursor-pointer text-center ${
                    notifyType === 'phone'
                      ? 'border-cyan-600 bg-cyan-50 text-cyan-800 ring-2 ring-cyan-500/20 shadow-2xs'
                      : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                  }`}
                >
                  SMS Only
                </button>
                <button
                  type="button"
                  onClick={() => setNotifyType('email')}
                  className={`py-2 px-2.5 rounded-lg border text-xs font-bold transition-all cursor-pointer text-center ${
                    notifyType === 'email'
                      ? 'border-cyan-600 bg-cyan-50 text-cyan-800 ring-2 ring-cyan-500/20 shadow-2xs'
                      : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                  }`}
                >
                  Email Only
                </button>
              </div>
            </div>

            {/* Phone Number Field */}
            {(notifyType === 'phone' || notifyType === 'both') && (
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  Phone Number (Uganda SMS Alert)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    id="price-alert-phone-input"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 0779743101 or +256779743101"
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 text-slate-800"
                    required={notifyType === 'phone'}
                  />
                </div>
                <p className="text-[10px] text-slate-500">
                  Instant SMS dispatch via Africa's Talking / Twilio gateway upon backend WooCommerce update.
                </p>
              </div>
            )}

            {/* Email Address Field */}
            {(notifyType === 'email' || notifyType === 'both') && (
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="price-alert-email-input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. customer@gmail.com"
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 text-slate-800"
                    required={notifyType === 'email'}
                  />
                </div>
              </div>
            )}

            {/* Target Price Configuration */}
            <div className="space-y-2 pt-1 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Price Trigger Condition
              </label>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer font-medium">
                  <input
                    type="radio"
                    name="targetPriceType"
                    checked={targetType === 'any'}
                    onChange={() => {
                      setTargetType('any');
                      setTargetPrice('');
                    }}
                    className="text-cyan-600 focus:ring-cyan-500"
                  />
                  <span>Alert me on <strong>any price drop</strong> (recommended)</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer font-medium">
                  <input
                    type="radio"
                    name="targetPriceType"
                    checked={targetType === 'custom'}
                    onChange={() => setTargetType('custom')}
                    className="text-cyan-600 focus:ring-cyan-500"
                  />
                  <span>Only alert if price drops below a specific target:</span>
                </label>

                {targetType === 'custom' && (
                  <div className="pl-6 space-y-2 animate-in fade-in duration-150">
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-xs font-bold text-slate-500">
                        UGX
                      </span>
                      <input
                        id="price-alert-target-price-input"
                        type="number"
                        min="1"
                        max={product.price - 1}
                        value={targetPrice}
                        onChange={(e) => setTargetPrice(e.target.value)}
                        placeholder={`Less than ${product.price.toLocaleString()}`}
                        className="w-full pl-12 pr-3 py-1.5 text-xs sm:text-sm rounded-lg border border-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 text-slate-800"
                      />
                    </div>

                    {/* Quick discount buttons */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Quick Sets:</span>
                      {[5, 10, 15, 20].map((pct) => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => setQuickDiscount(pct)}
                          className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-100 hover:bg-cyan-100 text-slate-700 hover:text-cyan-800 transition-colors cursor-pointer"
                        >
                          -{pct}% (UGX {Math.round(product.price * (1 - pct / 100)).toLocaleString()})
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Trust note */}
            <div className="p-2.5 rounded-lg bg-slate-50 text-[11px] text-slate-500 flex items-start gap-2">
              <Info className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
              <span>
                Alerts are triggered in real-time when the WooCommerce store updates this item's price or sale price.
                You can unsubscribe at any time.
              </span>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="submit-price-alert-btn"
                type="submit"
                disabled={loading}
                className="px-5 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving Alert...</span>
                  </>
                ) : (
                  <>
                    <Bell className="w-3.5 h-3.5" />
                    <span>{existingAlert ? 'Update Alert Preferences' : 'Activate Price Alert'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
