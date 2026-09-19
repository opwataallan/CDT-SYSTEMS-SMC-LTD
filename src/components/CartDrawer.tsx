import React, { useState } from 'react';
import { X, Trash2, Plus, Minus, ArrowRight, ShoppingBag, ShieldCheck, Tag, Sparkles } from 'lucide-react';
import { useShop } from '../context/ShopContext';

export const CartDrawer: React.FC = () => {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateQuantity,
    cartSubtotal,
    appliedCoupon,
    discountAmount,
    applyCoupon,
    removeCoupon,
    selectedZone,
    setCurrentView,
  } = useShop();

  const [couponCode, setCouponCode] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  if (!isCartOpen) return null;

  const freeShippingThreshold = selectedZone.free_threshold || 500000;
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - cartSubtotal);
  const freeShippingProgress = Math.min(100, (cartSubtotal / freeShippingThreshold) * 100);

  const shippingFee = cartSubtotal >= freeShippingThreshold ? 0 : selectedZone.fee;
  const finalTotal = Math.max(0, cartSubtotal - discountAmount + shippingFee);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    setIsApplyingCoupon(true);
    await applyCoupon(couponCode);
    setIsApplyingCoupon(false);
    setCouponCode('');
  };

  const handleCheckout = () => {
    setIsCartOpen(false);
    setCurrentView('checkout');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-full sm:w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Drawer Header (High Density Dark Slate) */}
          <div className="px-4 py-3.5 bg-[#0F172A] text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-cyan-400" />
              <h2 className="font-extrabold text-sm tracking-tight">
                Shopping Cart ({cart.reduce((t, i) => t + i.quantity, 0)})
              </h2>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Free Shipping Progress Indicator (High Density) */}
          <div className="px-4 py-2.5 bg-slate-100 border-b border-slate-200 text-xs">
            <div className="flex items-center justify-between font-bold text-slate-700 mb-1">
              <span className="text-[11px]">{remainingForFreeShipping === 0 ? '🎉 You unlocked FREE delivery in Uganda!' : `Add UGX ${remainingForFreeShipping.toLocaleString()} for FREE Delivery`}</span>
            </div>
            <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-cyan-500 rounded-full transition-all duration-300"
                style={{ width: `${freeShippingProgress}%` }}
              />
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                  <ShoppingBag className="w-8 h-8 stroke-1" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">Your cart is empty</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mb-5">
                  Explore Cyber Dynamic Technologies' laptops, printers, routers, and accessories with nationwide Uganda delivery.
                </p>
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    setCurrentView('shop');
                  }}
                  className="px-5 py-2 bg-cyan-500 hover:bg-cyan-600 text-white text-xs font-bold rounded-lg transition-colors shadow-2xs cursor-pointer"
                >
                  Start Shopping Now
                </button>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-2.5 p-2.5 rounded-lg border border-slate-200 bg-white hover:border-cyan-300 transition-colors shadow-2xs"
                >
                  {/* Thumbnail */}
                  <img
                    src={item.product.images[0]?.src}
                    alt={item.product.name}
                    className="w-16 h-16 rounded object-cover border border-slate-100 flex-shrink-0"
                  />

                  {/* Info */}
                  <div className="flex-1 min-w-0 flex flex-col">
                    <div className="flex items-start justify-between gap-1">
                      <h4 className="text-xs font-bold text-slate-900 line-clamp-2 leading-tight">
                        {item.product.name}
                      </h4>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-slate-400 hover:text-red-500 p-0.5 transition-colors"
                        title="Remove item"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Variation Attributes */}
                    {item.selectedAttributes && Object.keys(item.selectedAttributes).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {Object.entries(item.selectedAttributes).map(([k, v]) => (
                          <span
                            key={k}
                            className="text-[9px] px-1 py-0.5 rounded bg-slate-100 text-slate-600"
                          >
                            {k}: {v}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="mt-auto pt-1.5 flex items-center justify-between">
                      <div className="text-xs font-black text-cyan-600 whitespace-nowrap">
                        UGX {(item.unitPrice * item.quantity).toLocaleString()}
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center border border-slate-200 rounded bg-slate-50 overflow-hidden shadow-2xs">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="px-1.5 py-0.5 text-slate-600 hover:bg-slate-200 transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-2.5 h-2.5" />
                        </button>
                        <span className="px-2 text-xs font-bold text-slate-800">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="px-1.5 py-0.5 text-slate-600 hover:bg-slate-200 transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Drawer Footer with Totals and Checkout */}
          {cart.length > 0 && (
            <div className="p-4 bg-white border-t border-slate-200 shadow-lg space-y-2.5">
              {/* Coupon Form */}
              <form onSubmit={handleApplyCoupon} className="flex gap-1.5">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Coupon (e.g. CYBER10)"
                    className="w-full h-8 px-2.5 text-xs uppercase font-semibold border border-slate-200 rounded focus:outline-hidden focus:border-cyan-500"
                  />
                  <Tag className="w-3 h-3 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
                </div>
                <button
                  type="submit"
                  disabled={isApplyingCoupon || !couponCode.trim()}
                  className="h-8 px-3 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white rounded text-xs font-bold transition-colors cursor-pointer"
                >
                  {isApplyingCoupon ? '...' : 'Apply'}
                </button>
              </form>

              {appliedCoupon && (
                <div className="flex items-center justify-between p-1.5 rounded bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium">
                  <span className="flex items-center gap-1 text-[11px]">
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    <span>Coupon <strong>{appliedCoupon.code}</strong> (-UGX {discountAmount.toLocaleString()})</span>
                  </span>
                  <button
                    onClick={removeCoupon}
                    className="text-red-600 font-bold hover:underline text-[10px]"
                  >
                    Remove
                  </button>
                </div>
              )}

              {/* Price Breakdown */}
              <div className="space-y-1 text-xs text-slate-600 pt-0.5">
                <div className="flex justify-between items-center gap-2 text-[11px]">
                  <span>Subtotal</span>
                  <span className="font-bold text-slate-800 whitespace-nowrap">UGX {cartSubtotal.toLocaleString()}</span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between items-center gap-2 text-emerald-700 font-semibold text-[11px]">
                    <span>Discount</span>
                    <span className="whitespace-nowrap">-UGX {discountAmount.toLocaleString()}</span>
                  </div>
                )}

                <div className="flex justify-between items-center gap-2 text-[11px]">
                  <span>Estimated Delivery</span>
                  <span className="font-bold text-slate-800 whitespace-nowrap">
                    {shippingFee === 0 ? <span className="text-emerald-600">FREE</span> : `UGX ${shippingFee.toLocaleString()}`}
                  </span>
                </div>

                <div className="flex justify-between items-center gap-2 text-sm font-black text-slate-900 pt-1.5 border-t border-slate-200">
                  <span>Total</span>
                  <span className="text-cyan-600 whitespace-nowrap">UGX {finalTotal.toLocaleString()}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <button
                id="cart-drawer-checkout-btn"
                onClick={handleCheckout}
                className="w-full py-2.5 px-4 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-500 pt-0.5">
                <ShieldCheck className="w-3 h-3 text-cyan-600" />
                <span>MTN/Airtel MoMo & Cash on Delivery Accepted</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
