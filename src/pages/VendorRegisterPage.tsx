import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import { api } from '../services/api';
import {
  Store as StoreIcon,
  ShieldCheck,
  Building,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  CreditCard,
  Truck,
  Layers,
  ArrowRight,
  CheckCircle2,
  Lock,
} from 'lucide-react';

export const VendorRegisterPage: React.FC = () => {
  const { setCurrentView, showToast, quickLogin } = useShop();

  const [step, setStep] = useState<number>(1);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [registrationSuccess, setRegistrationSuccess] = useState<boolean>(false);
  const [registeredStoreName, setRegisteredStoreName] = useState<string>('');
  const [isInstantApproved, setIsInstantApproved] = useState<boolean>(false);

  // Form State
  const [storeName, setStoreName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+256 ');
  const [password, setPassword] = useState('');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState('Kampala');
  const [district, setDistrict] = useState('Kampala Central');
  const [address, setAddress] = useState('');
  const [tinNumber, setTinNumber] = useState('');
  const [regNumber, setRegNumber] = useState('');
  const [productCategories, setProductCategories] = useState<string[]>(['Laptops', 'Accessories']);
  const [payoutMethod, setPayoutMethod] = useState<'momo' | 'airtel' | 'bank'>('momo');
  const [payoutAccountNumber, setPayoutAccountNumber] = useState('');
  const [payoutAccountName, setPayoutAccountName] = useState('');
  const [deliveryType, setDeliveryType] = useState<'vendor' | 'platform' | 'courier' | 'pickup'>('vendor');
  const [deliveryFee, setDeliveryFee] = useState<number>(10000);
  const [logoUrl, setLogoUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');

  const UGANDA_DISTRICTS = [
    'Kampala Central',
    'Nakawa',
    'Makindye',
    'Rubaga',
    'Kawempe',
    'Wakiso',
    'Entebbe',
    'Mukono',
    'Jinja',
    'Mbarara',
    'Gulu',
    'Mbale',
    'Arua',
    'Kumi',
    'Iganga',
    'Fort Portal',
    'Masaka',
    'Lira',
    'Hoima',
    'Soroti',
  ];

  const AVAILABLE_CATEGORIES = [
    'Laptops',
    'Desktops',
    'Smartphones',
    'Networking',
    'Accessories',
    'Solar & Power',
    'Gaming',
    'Security & CCTV',
    'Audio & Sound',
    'Printers & Inks',
  ];

  const toggleCategory = (cat: string) => {
    if (productCategories.includes(cat)) {
      setProductCategories(productCategories.filter((c) => c !== cat));
    } else {
      setProductCategories([...productCategories, cat]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName.trim() || !ownerName.trim() || !email.trim() || !phone.trim()) {
      showToast('Please complete all required fields.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: storeName.trim(),
        owner_name: ownerName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password: password.trim() || 'Vendor2026!',
        description: description.trim(),
        city: city.trim(),
        district: district.trim(),
        country: 'Uganda',
        address: address.trim() || `${district}, ${city}, Uganda`,
        tin_number: tinNumber.trim(),
        registration_number: regNumber.trim(),
        product_categories: productCategories,
        logo_url: logoUrl.trim() || undefined,
        banner_url: bannerUrl.trim() || undefined,
        payout_method: payoutMethod,
        payout_account_number: payoutAccountNumber.trim() || phone.trim(),
        payout_account_name: payoutAccountName.trim() || ownerName.trim(),
        delivery_type: deliveryType,
        delivery_fee: deliveryFee,
      };

      const res = await api.registerVendorStore(payload);
      if (res.success) {
        setRegistrationSuccess(true);
        setRegisteredStoreName(storeName);
        setIsInstantApproved(res.status === 'active' || res.status === 'approved');
        showToast(res.message || 'Store registration submitted successfully!');
      }
    } catch (err: any) {
      showToast(err.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (registrationSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 py-16 px-4 sm:px-6 flex items-center justify-center">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl max-w-lg w-full p-8 sm:p-10 text-center animate-in zoom-in-95">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2">
            Vendor Application Received!
          </h2>
          <p className="text-slate-600 text-sm leading-relaxed mb-6">
            Congratulations, <strong>{ownerName}</strong>! Your store{' '}
            <span className="text-[#920d35] font-bold">"{registeredStoreName}"</span> has been registered
            with Cyber Dynamic Technologies Marketplace.
          </p>

          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 text-left text-xs space-y-2 mb-8">
            <div className="flex justify-between">
              <span className="text-slate-500">Business Name:</span>
              <span className="font-bold text-slate-800">{registeredStoreName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">District:</span>
              <span className="font-semibold text-slate-800">{district}, Uganda</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Payout Method:</span>
              <span className="font-semibold text-slate-800">
                {payoutMethod === 'momo' ? 'MTN Mobile Money' : payoutMethod === 'airtel' ? 'Airtel Money' : 'Bank Transfer'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Application Status:</span>
              <span className="font-bold text-amber-600 uppercase">
                {isInstantApproved ? 'Active & Approved' : 'Pending Verification'}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => {
                quickLogin('vendor');
                setCurrentView('vendor-dashboard');
              }}
              className="flex-1 bg-[#920d35] hover:bg-[#770929] text-white font-bold py-3 px-4 rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2"
            >
              <span>Open Seller Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentView('stores')}
              className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs transition-all"
            >
              View Stores Directory
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-semibold mb-3 shadow">
            <StoreIcon className="w-3.5 h-3.5 text-amber-400" />
            <span>Uganda Seller Onboarding</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
            Register Your Store on Cyber Dynamic Tech
          </h1>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            Sell computing systems, phones, electronics, solar solutions, and accessories across Uganda with automated MTN MoMo & Airtel Money payouts and seller tools.
          </p>
        </div>

        {/* Multi-Step Indicator */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 mb-8">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            <button
              onClick={() => setStep(1)}
              className={`flex items-center gap-2 text-xs font-bold ${
                step === 1 ? 'text-[#920d35]' : 'text-slate-400'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center ${
                  step === 1 ? 'bg-[#920d35] text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                1
              </div>
              <span className="hidden sm:inline">Business Profile</span>
            </button>
            <div className="h-0.5 w-12 bg-slate-200" />
            <button
              onClick={() => setStep(2)}
              className={`flex items-center gap-2 text-xs font-bold ${
                step === 2 ? 'text-[#920d35]' : 'text-slate-400'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center ${
                  step === 2 ? 'bg-[#920d35] text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                2
              </div>
              <span className="hidden sm:inline">Location & Legal</span>
            </button>
            <div className="h-0.5 w-12 bg-slate-200" />
            <button
              onClick={() => setStep(3)}
              className={`flex items-center gap-2 text-xs font-bold ${
                step === 3 ? 'text-[#920d35]' : 'text-slate-400'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center ${
                  step === 3 ? 'bg-[#920d35] text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                3
              </div>
              <span className="hidden sm:inline">Payout & Logistics</span>
            </button>
          </div>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 sm:p-10 space-y-8">
          {/* STEP 1: Business Profile */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Building className="w-5 h-5 text-[#920d35]" />
                  <span>Step 1: Store & Owner Information</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Tell us about your brand name, owner details, and the product lines you offer.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Store / Business Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    placeholder="e.g. Kampala Tech Hub"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#920d35] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Store Owner / Representative Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="e.g. David Mukasa"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#920d35] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Business Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="david@kampalatech.ug"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#920d35] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Mobile Phone (Uganda +256) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+256 772 123 456"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#920d35] focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Seller Account Password *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create secure seller login password"
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#920d35] focus:outline-none"
                    />
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    You will use this password to sign into your vendor dashboard.
                  </span>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Store Bio & Description *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe what electronics, computing brands, or specialized tech gear your store provides in Uganda..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#920d35] focus:outline-none"
                  />
                </div>

                {/* Product Categories Selector */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    Product Categories You Intend to Sell (Select all that apply)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {AVAILABLE_CATEGORIES.map((cat) => {
                      const selected = productCategories.includes(cat);
                      return (
                        <button
                          type="button"
                          key={cat}
                          onClick={() => toggleCategory(cat)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                            selected
                              ? 'bg-[#920d35] text-white border-[#920d35] shadow-sm'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {selected ? '✓ ' : '+ '}
                          {cat}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="bg-[#920d35] hover:bg-[#770929] text-white font-bold px-6 py-2.5 rounded-xl text-sm flex items-center gap-2 shadow"
                >
                  <span>Continue to Step 2</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Location & Legal */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[#920d35]" />
                  <span>Step 2: Uganda Physical Address & Registration</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Provide your physical shop, dispatch hub, or showroom address in Uganda.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    District *
                  </label>
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:ring-2 focus:ring-[#920d35] focus:outline-none"
                  >
                    {UGANDA_DISTRICTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    City / Town / Division *
                  </label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Kampala Central / Nakawa"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#920d35] focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Street & Physical Building Address *
                  </label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. Plot 18 Kampala Road, Tech Mall Ground Floor"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#920d35] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    URA Tax Identification Number (TIN) (Optional)
                  </label>
                  <input
                    type="text"
                    value={tinNumber}
                    onChange={(e) => setTinNumber(e.target.value)}
                    placeholder="100..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#920d35] focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Business Registration / URSB No. (Optional)
                  </label>
                  <input
                    type="text"
                    value={regNumber}
                    onChange={(e) => setRegNumber(e.target.value)}
                    placeholder="e.g. 800200..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#920d35] focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Store Logo Image URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://... (Leave empty for default)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#920d35] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Store Banner Image URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={bannerUrl}
                    onChange={(e) => setBannerUrl(e.target.value)}
                    placeholder="https://... (Leave empty for default)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#920d35] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="bg-[#920d35] hover:bg-[#770929] text-white font-bold px-6 py-2.5 rounded-xl text-sm flex items-center gap-2 shadow"
                >
                  <span>Continue to Step 3</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Payout & Delivery */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-[#920d35]" />
                  <span>Step 3: Payout Account & Delivery Settings</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Configure how you receive your earnings (MTN MoMo, Airtel Money, or Bank) and how you fulfill orders.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    Preferred Payout Method *
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setPayoutMethod('momo')}
                      className={`p-3.5 rounded-xl border text-center transition-all ${
                        payoutMethod === 'momo'
                          ? 'border-amber-500 bg-amber-50/50 text-amber-900 font-bold shadow-sm'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span className="block text-xs">MTN Mobile Money</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPayoutMethod('airtel')}
                      className={`p-3.5 rounded-xl border text-center transition-all ${
                        payoutMethod === 'airtel'
                          ? 'border-red-500 bg-red-50/50 text-red-900 font-bold shadow-sm'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span className="block text-xs">Airtel Money Pay</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPayoutMethod('bank')}
                      className={`p-3.5 rounded-xl border text-center transition-all ${
                        payoutMethod === 'bank'
                          ? 'border-[#920d35] bg-rose-50 text-[#920d35] font-bold shadow-sm'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span className="block text-xs">Bank Wire Transfer</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Account / Mobile Money Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={payoutAccountNumber}
                    onChange={(e) => setPayoutAccountNumber(e.target.value)}
                    placeholder="e.g. 0772112233"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#920d35] focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Registered Account Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={payoutAccountName}
                    onChange={(e) => setPayoutAccountName(e.target.value)}
                    placeholder="e.g. DAVID MUKASA"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#920d35] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Fulfillment & Delivery Method *
                  </label>
                  <select
                    value={deliveryType}
                    onChange={(e: any) => setDeliveryType(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:ring-2 focus:ring-[#920d35] focus:outline-none"
                  >
                    <option value="vendor">Vendor Direct Delivery (Boda / Courier)</option>
                    <option value="platform">Cyber Dynamic Tech Central Logistics</option>
                    <option value="pickup">Customer Collection / Store Pickup Only</option>
                    <option value="courier">Regional Bus / Courier Service</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Standard Base Delivery Fee (UGX)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={deliveryFee}
                    onChange={(e) => setDeliveryFee(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#920d35] focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Commission notice */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-800 block mb-0.5">
                    Marketplace Transparent Commission Terms
                  </span>
                  Cyber Dynamic Technologies applies a low platform commission rate (standard 8%) deducted automatically only upon successful order delivery. You retain 92% of your sales plus delivery allowances.
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 py-3 rounded-xl text-sm flex items-center gap-2 shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{submitting ? 'Registering Store...' : 'Submit Vendor Application'}</span>
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
