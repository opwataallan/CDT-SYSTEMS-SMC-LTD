import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Truck,
  CreditCard,
  CheckCircle2,
  Lock,
  ArrowRight,
  Clock,
  MapPin,
  AlertCircle,
  Locate,
  ExternalLink,
  X,
  Compass,
} from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { api } from '../services/api';
import { CustomerOrder } from '../types';
import { UGANDA_DISTRICTS } from '../data/ugandaDistricts';
import { PaymentLandingPage } from '../components/PaymentLandingPage';

export const CheckoutPage: React.FC = () => {
  const {
    cart,
    cartSubtotal,
    clearCart,
    appliedCoupon,
    discountAmount,
    deliveryZones,
    selectedZone,
    setSelectedZone,
    user,
    setCurrentView,
    showToast,
  } = useShop();

  // Step state: 1. Address & Coordinates, 2. Delivery Zone, 3. Payment Method
  const [activeStep, setActiveStep] = useState<number>(1);

  // Form states
  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [district, setDistrict] = useState(user?.addresses?.[0]?.district || 'Kampala');
  const [city, setCity] = useState(user?.addresses?.[0]?.city || '');
  const [addressLine, setAddressLine] = useState(user?.addresses?.[0]?.address_1 || '');
  const [landmark, setLandmark] = useState('');
  const [customerNote, setCustomerNote] = useState('');

  // GPS Coordinates state
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [showManualCoords, setShowManualCoords] = useState(false);
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');

  // Payment Selection
  const [paymentMethod, setPaymentMethod] = useState<'momo' | 'airtel' | 'card' | 'cod'>('momo');
  const [momoPhone, setMomoPhone] = useState(user?.phone || '');
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);

  // Created Order Details (Switches to Payment Landing Page)
  const [createdOrder, setCreatedOrder] = useState<CustomerOrder | null>(null);

  // Sync if user logs in during checkout session
  useEffect(() => {
    if (user) {
      if (!firstName && user.first_name) setFirstName(user.first_name);
      if (!lastName && user.last_name) setLastName(user.last_name);
      if (!email && user.email) setEmail(user.email);
      if (!phone && user.phone) {
        setPhone(user.phone);
        if (!momoPhone) setMomoPhone(user.phone);
      }
      if (user.addresses?.[0]?.address_1 && !addressLine) {
        setAddressLine(user.addresses[0].address_1);
      }
      if (user.addresses?.[0]?.district) {
        setDistrict(user.addresses[0].district);
      }
      if (user.addresses?.[0]?.city && !city) {
        setCity(user.addresses[0].city);
      }
      if (user.addresses?.[0]?.coordinates && !coordinates) {
        setCoordinates(user.addresses[0].coordinates);
      }
    }
  }, [user]);

  // When district changes, recommend matching zone
  const handleDistrictChange = (selectedDistrictName: string) => {
    setDistrict(selectedDistrictName);
    const matched = UGANDA_DISTRICTS.find((d) => d.name === selectedDistrictName || d.id === selectedDistrictName.toLowerCase());
    if (matched && matched.deliveryZone) {
      const zoneMatch = deliveryZones.find((z) =>
        z.name.toLowerCase().includes(matched.deliveryZone.toLowerCase()) ||
        matched.deliveryZone.toLowerCase().includes(z.name.toLowerCase())
      );
      if (zoneMatch) {
        setSelectedZone(zoneMatch);
      }
    }
  };

  // Get current device location
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          latitude: Number(pos.coords.latitude.toFixed(6)),
          longitude: Number(pos.coords.longitude.toFixed(6)),
        };
        setCoordinates(coords);
        setManualLat(String(coords.latitude));
        setManualLng(String(coords.longitude));
        setIsLocating(false);
        showToast('📍 Delivery coordinates detected accurately!');
      },
      (err) => {
        setIsLocating(false);
        setLocationError(err.message || 'Location access denied or unavailable. Enter coordinates manually.');
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
    );
  };

  const handleApplyManualCoords = () => {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    if (isNaN(lat) || isNaN(lng) || lat < -4 || lat > 5 || lng < 28 || lng > 36) {
      setLocationError('Please enter valid Uganda coordinates (Lat: approx -1.5 to 4.5, Lng: approx 29.5 to 35.5).');
      return;
    }
    setCoordinates({ latitude: lat, longitude: lng });
    setLocationError(null);
    setShowManualCoords(false);
    showToast('📍 Delivery coordinates updated!');
  };

  // Shipping cost calculation
  const freeThreshold = selectedZone.free_threshold || 500000;
  const shippingFee = cartSubtotal >= freeThreshold ? 0 : selectedZone.fee;
  const totalAmount = Math.max(0, cartSubtotal - discountAmount + shippingFee);

  // If order is placed, render the Payment Landing Page
  if (createdOrder) {
    return (
      <PaymentLandingPage
        order={createdOrder}
        onContinueShopping={() => setCurrentView('home')}
        onTrackOrder={(orderNum) => setCurrentView('track-order', { orderNumber: orderNum })}
        onOrderUpdated={(updated) => setCreatedOrder(updated)}
      />
    );
  }

  if (cart.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-3">
        <h2 className="text-lg font-black text-slate-800">Your Cart is Empty</h2>
        <p className="text-xs text-slate-500">
          Please add items to your cart before proceeding to checkout.
        </p>
        <button
          onClick={() => setCurrentView('shop')}
          className="px-5 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-bold text-xs rounded-lg cursor-pointer"
        >
          Explore Shop
        </button>
      </div>
    );
  }

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName || !phone || !addressLine) {
      showToast('Please fill in all required delivery details.');
      return;
    }

    setIsProcessingOrder(true);

    try {
      const activeCoordinates =
        coordinates ||
        (manualLat && manualLng && !isNaN(parseFloat(manualLat)) && !isNaN(parseFloat(manualLng))
          ? { latitude: parseFloat(manualLat), longitude: parseFloat(manualLng) }
          : undefined);

      // Build Order Payload for server-side WooCommerce proxy
      const orderPayload = {
        payment_method: paymentMethod,
        payment_method_title:
          paymentMethod === 'momo'
            ? 'MTN Mobile Money'
            : paymentMethod === 'airtel'
            ? 'Airtel Money'
            : paymentMethod === 'card'
            ? 'Visa / Mastercard'
            : 'Cash on Delivery',
        payment_details: {
          method: paymentMethod,
          phone_number: momoPhone || phone,
          status: paymentMethod === 'cod' ? 'pending' : 'awaiting_confirmation',
        },
        shipping_total: shippingFee,
        discount_total: discountAmount,
        delivery_zone: selectedZone.name,
        customer_note: customerNote,
        coordinates: activeCoordinates,
        billing: {
          first_name: firstName,
          last_name: lastName,
          email,
          phone,
          district,
          city: city || district,
          address_1: addressLine,
          coordinates: activeCoordinates,
        },
        shipping: {
          first_name: firstName,
          last_name: lastName,
          email,
          phone,
          district,
          city: city || district,
          address_1: addressLine,
          landmark,
          coordinates: activeCoordinates,
        },
        line_items: cart,
      };

      const res = await api.createOrder(orderPayload);

      if (res.success && res.order) {
        clearCart();
        setCreatedOrder(res.order);
        showToast(
          paymentMethod === 'cod'
            ? 'Order placed successfully (Cash on Delivery)!'
            : 'Order created! Please complete payment as instructed.'
        );
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to place order. Please try again.');
    } finally {
      setIsProcessingOrder(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6">
      {/* Checkout Steps Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between max-w-lg mx-auto text-xs font-bold">
          <button
            onClick={() => setActiveStep(1)}
            className={`flex items-center gap-1.5 cursor-pointer ${
              activeStep >= 1 ? 'text-cyan-600' : 'text-slate-400'
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                activeStep >= 1 ? 'bg-cyan-500 text-white shadow-2xs' : 'bg-slate-200 text-slate-600'
              }`}
            >
              1
            </span>
            <span>Delivery & Coordinates</span>
          </button>
          <div className="flex-1 max-w-[60px] h-0.5 bg-slate-200 mx-2" />
          <button
            onClick={() => setActiveStep(2)}
            className={`flex items-center gap-1.5 cursor-pointer ${
              activeStep >= 2 ? 'text-cyan-600' : 'text-slate-400'
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                activeStep >= 2 ? 'bg-cyan-500 text-white shadow-2xs' : 'bg-slate-200 text-slate-600'
              }`}
            >
              2
            </span>
            <span>Shipping Zone</span>
          </button>
          <div className="flex-1 max-w-[60px] h-0.5 bg-slate-200 mx-2" />
          <button
            onClick={() => setActiveStep(3)}
            className={`flex items-center gap-1.5 cursor-pointer ${
              activeStep >= 3 ? 'text-cyan-600' : 'text-slate-400'
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                activeStep >= 3 ? 'bg-cyan-500 text-white shadow-2xs' : 'bg-slate-200 text-slate-600'
              }`}
            >
              3
            </span>
            <span>Payment Method</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Checkout Forms (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* STEP 1: CUSTOMER & DELIVERY ADDRESS */}
          <div className="bg-white p-4 sm:p-5 rounded-lg border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-cyan-600" />
                <span>1. Customer & Delivery Address (All Uganda Districts)</span>
              </h2>
              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                Nationwide Coverage
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">First Name *</label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full h-8 px-2.5 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Last Name *</label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full h-8 px-2.5 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-8 px-2.5 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Phone Number (MTN / Airtel) *</label>
                <input
                  type="tel"
                  inputMode="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+256 7XX XXX XXX"
                  className="w-full h-8 px-2.5 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 font-mono"
                />
              </div>

              {/* UGANDA DISTRICT SELECTOR */}
              <div>
                <label className="font-bold text-slate-700 block mb-1 flex items-center justify-between">
                  <span>District of Delivery *</span>
                  <span className="text-[10px] text-cyan-600 font-bold">146 Uganda Districts</span>
                </label>
                <select
                  value={district}
                  onChange={(e) => handleDistrictChange(e.target.value)}
                  className="w-full h-8 px-2.5 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 bg-white cursor-pointer font-bold text-slate-800"
                >
                  <optgroup label="Popular Delivery Hubs">
                    {UGANDA_DISTRICTS.filter((d) => d.popular).map((dist) => (
                      <option key={dist.id} value={dist.name}>
                        {dist.name} ({dist.region})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="All Uganda Districts">
                    {UGANDA_DISTRICTS.filter((d) => !d.popular).map((dist) => (
                      <option key={dist.id} value={dist.name}>
                        {dist.name} ({dist.region})
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">City / Town / Sub-county *</label>
                <input
                  type="text"
                  required
                  value={city || district}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Nakasero, Kira, Entebbe, or Jinja"
                  className="w-full h-8 px-2.5 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="font-bold text-slate-700 block mb-1">Street Address / Building / Plot *</label>
                <input
                  type="text"
                  required
                  value={addressLine}
                  onChange={(e) => setAddressLine(e.target.value)}
                  placeholder="e.g. Acacia Mall, Kololo, or Plot 14 Kampala Road"
                  className="w-full h-8 px-2.5 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="font-bold text-slate-700 block mb-1">Prominent Landmark (Optional for Courier)</label>
                <input
                  type="text"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  placeholder="e.g. Near French Embassy, Opposite Posta Uganda, or Total Energies"
                  className="w-full h-8 px-2.5 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              {/* GPS COORDINATES PICKER / INPUT SECTION */}
              <div className="sm:col-span-2 p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs">
                    <Compass className="w-3.5 h-3.5 text-cyan-600" />
                    <span>GPS Delivery Coordinates (Optional • Pinpoint Courier Delivery)</span>
                  </div>
                  {!coordinates ? (
                    <button
                      type="button"
                      onClick={() => setShowManualCoords(!showManualCoords)}
                      className="text-[11px] text-cyan-600 hover:underline font-bold cursor-pointer"
                    >
                      {showManualCoords ? 'Hide Manual Input' : '+ Enter Manually'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setCoordinates(null);
                        setManualLat('');
                        setManualLng('');
                      }}
                      className="text-[11px] text-rose-600 hover:underline font-bold flex items-center gap-0.5 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>

                {coordinates ? (
                  <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-xs text-emerald-900 font-medium">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        Coordinates pinned:{' '}
                        <strong className="font-mono font-black">
                          {coordinates.latitude.toFixed(5)}, {coordinates.longitude.toFixed(5)}
                        </strong>
                      </span>
                    </div>
                    <a
                      href={`https://www.google.com/maps?q=${coordinates.latitude},${coordinates.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-700 hover:underline font-bold flex items-center gap-1 text-[11px]"
                    >
                      <span>Preview Map</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={handleGetCurrentLocation}
                        disabled={isLocating}
                        className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <Locate className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
                        <span>{isLocating ? 'Detecting GPS...' : '📍 Use My Current Location'}</span>
                      </button>
                      <span className="text-[10px] text-slate-500">
                        Ensures driver navigates straight to your gate or building
                      </span>
                    </div>

                    {locationError && (
                      <p className="text-[11px] text-rose-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        <span>{locationError}</span>
                      </p>
                    )}

                    {showManualCoords && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Latitude</label>
                          <input
                            type="text"
                            value={manualLat}
                            onChange={(e) => setManualLat(e.target.value)}
                            placeholder="e.g. 0.3476"
                            className="w-full h-7 px-2 bg-white border border-slate-300 rounded text-xs font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Longitude</label>
                          <input
                            type="text"
                            value={manualLng}
                            onChange={(e) => setManualLng(e.target.value)}
                            placeholder="e.g. 32.5825"
                            className="w-full h-7 px-2 bg-white border border-slate-300 rounded text-xs font-mono"
                          />
                        </div>
                        <div className="flex items-end">
                          <button
                            type="button"
                            onClick={handleApplyManualCoords}
                            className="w-full h-7 px-2 rounded bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition-colors cursor-pointer"
                          >
                            Apply Coordinates
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="font-bold text-slate-700 block mb-1">Order Notes / Delivery Instructions</label>
                <textarea
                  rows={2}
                  value={customerNote}
                  onChange={(e) => setCustomerNote(e.target.value)}
                  placeholder="e.g. Call before delivery, please ensure package is sealed."
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* STEP 2: SHIPPING ZONE SELECTION */}
          <div className="bg-white p-4 sm:p-5 rounded-lg border border-slate-200 shadow-2xs space-y-3">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2.5">
              <Truck className="w-3.5 h-3.5 text-cyan-600" />
              <span>2. Delivery Zone & Shipping Rates</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {deliveryZones.map((zone) => {
                const isSelected = selectedZone.id === zone.id;
                const isFree = cartSubtotal >= (zone.free_threshold || 500000);
                const fee = isFree ? 0 : zone.fee;

                return (
                  <div
                    key={zone.id}
                    onClick={() => setSelectedZone(zone)}
                    className={`p-2.5 rounded-lg border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-cyan-500 bg-cyan-50/50 shadow-2xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between font-bold text-slate-900 mb-0.5">
                        <span>{zone.name}</span>
                        {isSelected && <span className="text-cyan-600 font-black text-[10px]">✓ Selected</span>}
                      </div>
                      <p className="text-[10px] text-slate-500">{zone.estimated_delivery || zone.estimated_days}</p>
                    </div>

                    <div className="mt-1.5 pt-1.5 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] text-slate-600">Shipping:</span>
                      <span className="font-black text-slate-900 text-[11px]">
                        {fee === 0 ? <span className="text-emerald-600">FREE</span> : `UGX ${fee.toLocaleString()}`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* STEP 3: PAYMENT METHOD */}
          <div className="bg-white p-4 sm:p-5 rounded-lg border border-slate-200 shadow-2xs space-y-3">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2.5">
              <CreditCard className="w-3.5 h-3.5 text-orange-500" />
              <span>3. Payment Method</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {/* MTN MoMo */}
              <div
                onClick={() => setPaymentMethod('momo')}
                className={`p-2.5 rounded-lg border transition-all cursor-pointer ${
                  paymentMethod === 'momo'
                    ? 'border-amber-400 bg-amber-50/50 shadow-2xs'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between font-bold text-slate-900">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
                    <span>MTN Mobile Money</span>
                  </span>
                  <span className="text-[9px] font-black text-amber-950 bg-amber-300 px-1 py-0.2 rounded">
                    Direct Transfer
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Send to 0394 760459 (ALLAN). Manager confirms before dispatch.
                </p>
              </div>

              {/* Airtel Money */}
              <div
                onClick={() => setPaymentMethod('airtel')}
                className={`p-2.5 rounded-lg border transition-all cursor-pointer ${
                  paymentMethod === 'airtel'
                    ? 'border-rose-500 bg-rose-50/50 shadow-2xs'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between font-bold text-slate-900">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block" />
                    <span>Airtel Money</span>
                  </span>
                  <span className="text-[9px] font-black text-rose-900 bg-rose-200 px-1 py-0.2 rounded">
                    Direct Transfer
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Send to 0394 760459 (ALLAN). Manager confirms before dispatch.
                </p>
              </div>

              {/* Card Payment */}
              <div
                onClick={() => setPaymentMethod('card')}
                className={`p-2.5 rounded-lg border transition-all cursor-pointer ${
                  paymentMethod === 'card'
                    ? 'border-cyan-500 bg-cyan-50/50 shadow-2xs'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between font-bold text-slate-900">
                  <span>Visa / Mastercard</span>
                  <span className="text-[9px] text-slate-400">Card</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Direct merchant transfer & manual management confirmation
                </p>
              </div>

              {/* Cash On Delivery */}
              <div
                onClick={() => setPaymentMethod('cod')}
                className={`p-2.5 rounded-lg border transition-all cursor-pointer ${
                  paymentMethod === 'cod'
                    ? 'border-emerald-500 bg-emerald-50/50 shadow-2xs'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between font-bold text-slate-900">
                  <span>Cash on Delivery (COD)</span>
                  <span className="text-[9px] text-emerald-800 bg-emerald-100 px-1 py-0.2 rounded font-bold">
                    Inspect First
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Pay cash upon doorstep physical delivery and inspection
                </p>
              </div>
            </div>

            {/* Payment instructions note */}
            {paymentMethod !== 'cod' ? (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                  <span>Payment Landing Page will be presented upon clicking Place Order</span>
                </p>
                <p className="text-[11px] text-amber-800">
                  You will be shown our official payment number with a 1-click copy button. Store manager ALLAN verifies your payment before dispatch.
                </p>
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
                <p className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Cash on Delivery is automatically confirmed</span>
                </p>
                <p className="text-[11px] text-emerald-800">
                  Your order is dispatched immediately. You inspect your goods and pay our courier upon receipt.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Order Summary & Place Order (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-2">
              Order Summary ({cart.reduce((t, i) => t + i.quantity, 0)} items)
            </h3>

            {/* Items list */}
            <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto pr-1">
              {cart.map((item) => (
                <div key={item.id} className="py-2 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <img
                      src={item.product.images[0]?.src}
                      alt={item.product.name}
                      className="w-8 h-8 rounded-md object-cover border border-slate-200 flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 line-clamp-1 text-[11px]">{item.product.name}</p>
                      <p className="text-[10px] text-slate-400">Qty: {item.quantity}</p>
                    </div>
                  </div>
                  <span className="font-extrabold text-slate-900 whitespace-nowrap text-xs">
                    UGX {(item.unitPrice * item.quantity).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            {/* Calculations */}
            <div className="space-y-1 text-xs text-slate-600 pt-2 border-t border-slate-200">
              <div className="flex justify-between items-center gap-2 text-[11px]">
                <span>Subtotal</span>
                <span className="font-bold text-slate-800 whitespace-nowrap">UGX {cartSubtotal.toLocaleString()}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between items-center gap-2 text-emerald-700 font-bold text-[11px]">
                  <span>Coupon Discount</span>
                  <span className="whitespace-nowrap">-UGX {discountAmount.toLocaleString()}</span>
                </div>
              )}

              <div className="flex justify-between items-center gap-2 text-[11px]">
                <span>Delivery: {district}</span>
                <span className="font-bold text-slate-800 whitespace-nowrap">
                  {shippingFee === 0 ? <span className="text-emerald-600">FREE</span> : `UGX ${shippingFee.toLocaleString()}`}
                </span>
              </div>

              <div className="flex justify-between items-center gap-2 text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
                <span>Total Due:</span>
                <span className="text-cyan-600 whitespace-nowrap">UGX {totalAmount.toLocaleString()}</span>
              </div>
            </div>

            {/* Complete Purchase Button */}
            <button
              id="checkout-confirm-button"
              onClick={handlePlaceOrder}
              disabled={isProcessingOrder}
              className="w-full py-2.5 px-4 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-lg font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-2xs transition-all cursor-pointer"
            >
              {isProcessingOrder ? (
                <span>Registering Order with System...</span>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Place Order (UGX {totalAmount.toLocaleString()})</span>
                </>
              )}
            </button>

            <div className="pt-1 text-[10px] text-slate-400 text-center space-y-0.5">
              <p className="flex items-center justify-center gap-1">
                <ShieldCheck className="w-3 h-3 text-cyan-600" />
                <span>Cyber Dynamic Tech Warranty Guarantee (Uganda)</span>
              </p>
              <p>Store hotline: 0394 760459</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

