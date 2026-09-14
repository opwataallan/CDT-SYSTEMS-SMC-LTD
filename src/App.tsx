import React from 'react';
import { ShopProvider, useShop } from './context/ShopContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { WhatsAppButton } from './components/WhatsAppButton';
import { BottomNav } from './components/BottomNav';
import { HomePage } from './pages/HomePage';
import { ShopPage } from './pages/ShopPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { TrackOrderPage } from './pages/TrackOrderPage';
import { AccountPage } from './pages/AccountPage';
import { AdminPage } from './pages/AdminPage';
import { PosPage } from './pages/PosPage';
import { ContactPage, WarrantyPage } from './pages/StaticInfoPages';
import { CdtPageLoader } from './components/CdtPageLoader';
import { TopFlashingAdsBar } from './components/TopFlashingAdsBar';
import { CheckCircle2 } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { currentView, viewData, toastMessage, isPageLoading, pageLoadingMessage } = useShop();

  const renderCurrentView = () => {
    switch (currentView) {
      case 'home':
        return <HomePage />;
      case 'shop':
        return (
          <ShopPage
            initialCategory={viewData?.category}
            initialSearch={viewData?.search}
            initialFlashSale={viewData?.flash_sale}
          />
        );
      case 'category':
        return <ShopPage initialCategory={viewData?.slug} />;
      case 'product':
        return <ProductDetailPage slugOrId={viewData?.slug || viewData?.id} />;
      case 'checkout':
        return <CheckoutPage />;
      case 'track-order':
        return <TrackOrderPage initialOrderNumber={viewData?.orderNumber} />;
      case 'account':
      case 'login':
      case 'register':
        return <AccountPage initialTab={viewData?.tab || 'orders'} />;
      case 'admin':
        return <AdminPage />;
      case 'pos':
        return <PosPage />;
      case 'contact':
        return <ContactPage />;
      case 'warranty':
      case 'delivery-info':
        return <WarrantyPage />;
      default:
        return <HomePage />;
    }
  };

  if (currentView === 'pos') {
    return (
      <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900 font-sans selection:bg-cyan-500 selection:text-white">
        {/* CDT Page Loader */}
        {isPageLoading && <CdtPageLoader message={pageLoadingMessage} />}

        {toastMessage && (
          <div className="fixed top-12 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 backdrop-blur-md text-white px-3.5 py-2 rounded-lg shadow-xl border border-slate-700 flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-top-4 duration-200 max-w-md w-11/12">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="flex-1">{toastMessage}</span>
          </div>
        )}
        <PosPage />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col app-page-bg text-slate-800 font-sans selection:bg-cyan-500 selection:text-white">
      {/* CDT Page Loader */}
      {isPageLoading && <CdtPageLoader message={pageLoadingMessage} />}

      {/* Toast Notification Alert */}
      {toastMessage && (
        <div className="fixed top-12 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 backdrop-blur-md text-white px-3.5 py-2 rounded-lg shadow-xl border border-slate-700 flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-top-4 duration-200 max-w-md w-11/12">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span className="flex-1">{toastMessage}</span>
        </div>
      )}

      {/* Top Transitioning Animated GIF Banner with Flashing Ads (Display only in PC, hidden on mobile) */}
      <TopFlashingAdsBar />

      {/* Main Top Header */}
      <Header />

      {/* Main Content Area */}
      <main className="flex-1 pb-20 md:pb-0">
        {renderCurrentView()}
      </main>

      {/* Main Footer */}
      <Footer />

      {/* Slide-over Cart Drawer */}
      <CartDrawer />

      {/* Floating WhatsApp Action Widget */}
      <WhatsAppButton />

      {/* Mobile Sticky Bottom Navigation Bar */}
      <BottomNav />
    </div>
  );
};

export default function App() {
  return (
    <ShopProvider>
      <MainLayout />
    </ShopProvider>
  );
}
