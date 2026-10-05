import React, { useState, useEffect } from 'react';
import {
  Category,
  Service,
  Plan,
  Offer,
  Banner,
  Order,
  WebsiteSettings,
} from './types';
import { dbService } from './lib/db';
import { isAuthenticated, subscribeAuth } from './lib/adminAuth';
import { dispatchOrderToProvider } from './lib/providerService';
import {
  trackMetaPageView,
  trackMetaViewContent,
  trackMetaPurchase,
} from './lib/metaPixel';
import { Sparkles } from 'lucide-react';

// Customer Components
import { Header } from './components/Header';
import { HeroSlider } from './components/HeroSlider';
import { QuickActions } from './components/QuickActions';
import { ServicesSection } from './components/ServicesSection';
import { CategoryPage } from './components/CategoryPage';
import { OrderPage } from './components/OrderPage';
import { OrderSuccessPage } from './components/OrderSuccessPage';
import { TrackOrdersPage } from './components/TrackOrdersPage';
import { HelpCenterPage } from './components/HelpCenterPage';
import { HowToOrderModal } from './components/HowToOrderModal';
import { ExplorePlatformsModal } from './components/ExplorePlatformsModal';
import { BottomNavigation } from './components/BottomNavigation';
import { Footer } from './components/Footer';

// Admin Components
import { AdminLogin } from './components/admin/AdminLogin';
import { AdminLayout } from './components/admin/AdminLayout';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AdminOrders } from './components/admin/AdminOrders';
import { AdminCategories } from './components/admin/AdminCategories';
import { AdminServices } from './components/admin/AdminServices';
import { AdminPlans } from './components/admin/AdminPlans';
import { AdminOffers } from './components/admin/AdminOffers';
import { AdminBanners } from './components/admin/AdminBanners';
import { AdminTickets } from './components/admin/AdminTickets';
import { AdminSettings } from './components/admin/AdminSettings';

export function App() {
  const checkIsAdminRoute = () => {
    if (typeof window === 'undefined') return false;
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    return (
      path === '/admin' ||
      path.startsWith('/admin/') ||
      hash === '#admin' ||
      hash.startsWith('#admin')
    );
  };

  // Navigation State: directly check /admin or #admin
  const [currentView, setCurrentView] = useState<'home' | 'category' | 'order' | 'success' | 'orders' | 'services' | 'support' | 'admin'>(() => {
    return checkIsAdminRoute() ? 'admin' : 'home';
  });

  const [adminTab, setAdminTab] = useState('dashboard');
  const [isAdminAuthed, setIsAdminAuthed] = useState(isAuthenticated());

  // Database Data States
  const [settings, setSettings] = useState<WebsiteSettings | undefined>();
  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);

  // Selection States for Flow
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  // Modals & Tracking
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [pendingCustomerDetails, setPendingCustomerDetails] = useState<{
    customerName: string;
    mobileNumber: string;
    targetUrl: string;
  } | null>(null);
  const [isHowToOrderOpen, setIsHowToOrderOpen] = useState(false);
  const [isExplorePlatformsOpen, setIsExplorePlatformsOpen] = useState(false);
  const [lastCustomerInfo, setLastCustomerInfo] = useState<{ name: string; mobile: string } | null>(() => {
    try {
      const saved = localStorage.getItem('skyrocket_last_customer');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Load live data from Firestore / DB Service
  const loadDatabaseData = async () => {
    try {
      const [s, c, srv, p, o, b] = await Promise.all([
        dbService.getSettings(),
        dbService.getCategories(true),
        dbService.getServices(undefined, true),
        dbService.getPlans(undefined, true),
        dbService.getOffers(undefined, true),
        dbService.getBanners(true),
      ]);
      setSettings(s);
      setCategories(c);
      setServices(srv);
      setPlans(p);
      setOffers(o);
      setBanners(b);
    } catch (err) {
      console.error('Error loading database data:', err);
    }
  };

  useEffect(() => {
    loadDatabaseData();
    const unsubDb = dbService.subscribe(() => {
      loadDatabaseData();
    });
    const unsubAuth = subscribeAuth((auth) => {
      setIsAdminAuthed(auth);
    });

    // Check location changes for /admin or #admin
    const handleRouteChange = () => {
      if (checkIsAdminRoute()) {
        setCurrentView('admin');
      }
    };
    window.addEventListener('hashchange', handleRouteChange);
    window.addEventListener('popstate', handleRouteChange);

    return () => {
      unsubDb();
      unsubAuth();
      window.removeEventListener('hashchange', handleRouteChange);
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);

  // Check for payment redirect callback (e.g. returning from UPI app redirect)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const isSuccess =
        urlParams.get('payment') === 'success' ||
        urlParams.get('status')?.toUpperCase() === 'SUCCESS' ||
        urlParams.get('status')?.toUpperCase() === 'COMPLETED';

      const rawPending = sessionStorage.getItem('skyrocket_pending_checkout');
      if (isSuccess && rawPending) {
        const pending = JSON.parse(rawPending);
        // Valid within last 15 minutes
        if (Date.now() - (pending.timestamp || 0) < 15 * 60 * 1000) {
          sessionStorage.removeItem('skyrocket_pending_checkout');
          dbService
            .createOrder({
              customerName: pending.customerName,
              mobileNumber: pending.mobileNumber,
              categoryId: pending.categoryId,
              categoryName: pending.categoryName,
              serviceId: pending.serviceId,
              serviceName: pending.serviceName,
              planId: pending.planId,
              quantity: pending.planQuantity || 1,
              targetUrl: pending.targetUrl,
              amount: pending.amount,
              currency: settings?.defaultCurrency || '₹',
              paymentStatus: 'Paid',
              orderStatus: 'Processing',
              paymentMethod: 'ZapUPI (UPI Redirect)',
              paymentId: urlParams.get('order_id') || pending.uniqueOrderId || `ZAP${Date.now()}`,
              isCustomOffer: pending.isCustomOffer,
              offerTitle: pending.offerTitle || '',
              itemsSummary: pending.itemsSummary || '',
            })
            .then((order) => {
              setConfirmedOrder(order);
              const cust = {
                name: pending.customerName,
                mobile: pending.mobileNumber,
              };
              setLastCustomerInfo(cust);
              try {
                localStorage.setItem('skyrocket_last_customer', JSON.stringify(cust));
              } catch {}

              // Auto-fulfill order via SMM Provider if configured
              if (settings?.providerAutoOrder && settings?.providerApiKey) {
                const matchedPlan = plans.find((p) => p.id === pending.planId);
                dispatchOrderToProvider(order, matchedPlan, settings).catch((err) =>
                  console.warn('Auto-fulfill redirect order failed:', err)
                );
              }

              setCurrentView('success');
              trackMetaPurchase({
                order_id: order.orderId,
                content_name: `${order.categoryName} - ${order.serviceName}`,
                value: order.amount,
                currency: 'INR',
                customer: {
                  name: pending.customerName,
                  phone: pending.mobileNumber,
                },
              });
              window.history.replaceState(null, '', window.location.pathname);
            })
            .catch((err) => console.error('Failed to restore redirect order:', err));
        }
      }
    } catch (err) {
      console.warn('Redirect check error:', err);
    }
  }, [settings?.defaultCurrency]);

  // Track Meta PageView on route/view change
  useEffect(() => {
    trackMetaPageView();
  }, [currentView]);

  const handleExitAdmin = () => {
    if (typeof window !== 'undefined') {
      try {
        window.history.pushState(null, '', '/');
      } catch {
        window.location.hash = '';
      }
    }
    setCurrentView('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Customer navigation handlers
  const handleSelectCategory = (category: Category) => {
    setSelectedCategory(category);
    setSelectedOffer(null);
    setCurrentView('category');
    trackMetaViewContent({
      content_name: category.name,
      content_category: 'Social Platform',
      content_ids: [category.id],
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectPlan = (plan: Plan, service: Service) => {
    setSelectedPlan(plan);
    setSelectedService(service);
    setSelectedOffer(null);
    setCurrentView('order');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectOffer = (offer: Offer) => {
    setSelectedOffer(offer);
    const cat = categories.find((c) => c.id === offer.categoryId);
    setSelectedCategory(
      cat || {
        id: offer.categoryId,
        name: offer.categoryName || 'Social Media',
        slug: 'social',
        active: true,
        sortOrder: 1,
      }
    );
    setSelectedService(null);
    setSelectedPlan(null);
    setCurrentView('order');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBannerClick = (b: Banner) => {
    if (b.redirectType === 'category' && b.targetCategoryId) {
      const cat = categories.find((c) => c.id === b.targetCategoryId);
      if (cat) {
        handleSelectCategory(cat);
        return;
      }
    } else if (b.redirectType === 'offer' && b.targetOfferId) {
      const off = offers.find((o) => o.id === b.targetOfferId);
      if (off) {
        handleSelectOffer(off);
        return;
      }
    } else if (b.redirectType === 'external' && b.targetUrl) {
      window.open(b.targetUrl, '_blank');
      return;
    }

    if (categories.length > 0) {
      handleSelectCategory(categories[0]);
    }
  };

  const handleProceedToPayment = (details: {
    customerName: string;
    mobileNumber: string;
    targetUrl: string;
  }) => {
    setPendingCustomerDetails(details);
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSuccess = async (
    paymentInfo: {
      transactionId: string;
      paymentMethod: string;
    },
    customerDetails?: {
      customerName: string;
      mobileNumber: string;
      targetUrl: string;
    }
  ) => {
    const details = customerDetails || pendingCustomerDetails;
    if (!selectedCategory || (!selectedPlan && !selectedOffer) || !details) {
      return;
    }

    try {
      const cleanPhone = details.mobileNumber.replace(/[^0-9]/g, '').slice(-10);
      const cleanCustomerName = details.customerName.trim();

      const order = await dbService.createOrder({
        customerName: cleanCustomerName,
        mobileNumber: cleanPhone,
        categoryId: selectedCategory.id,
        categoryName: selectedCategory.name,
        serviceId: selectedService?.id || (selectedOffer ? 'combo' : 'general'),
        serviceName: selectedOffer
          ? selectedOffer.title || 'Combo Offer'
          : selectedService?.name || 'Service',
        planId: selectedPlan?.id || selectedOffer?.id || 'combo-plan',
        quantity: selectedPlan?.quantity || 1,
        targetUrl: details.targetUrl.trim(),
        amount: selectedOffer ? selectedOffer.price : selectedPlan?.price || 0,
        currency: settings?.defaultCurrency || '₹',
        paymentStatus: 'Paid',
        orderStatus: 'Processing',
        paymentMethod: paymentInfo.paymentMethod,
        paymentId: paymentInfo.transactionId,
        isCustomOffer: Boolean(selectedOffer),
        offerTitle: selectedOffer?.title || '',
        itemsSummary: selectedOffer?.itemsIncluded || '',
      });

      setConfirmedOrder(order);
      const customerInfo = {
        name: cleanCustomerName,
        mobile: cleanPhone,
      };
      setLastCustomerInfo(customerInfo);
      try {
        localStorage.setItem('skyrocket_last_customer', JSON.stringify(customerInfo));
      } catch {}

      // Auto-fulfill order via SMM Provider if configured
      if (settings?.providerAutoOrder && settings?.providerApiKey) {
        dispatchOrderToProvider(order, selectedPlan, settings).catch((err) =>
          console.warn('Auto-fulfill in-app order failed:', err)
        );
      }

      // Track Meta Purchase with Advanced Matching and Deduplication ID
      trackMetaPurchase({
        order_id: order.orderId,
        content_name: `${order.categoryName} - ${order.serviceName}`,
        value: order.amount,
        currency: 'INR',
        customer: {
          name: details.customerName,
          phone: details.mobileNumber,
        },
      });

      setIsPaymentModalOpen(false);
      setCurrentView('success');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Failed to create order:', err);
      alert('Payment succeeded but order creation encountered an issue. Please contact support.');
    }
  };

  const handleBottomNavigate = (view: string) => {
    if (view === 'services') {
      setIsExplorePlatformsOpen(true);
      return;
    }
    setCurrentView(view as any);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ----------------------------------------------------
  // ADMIN PANEL ROUTING
  // ----------------------------------------------------
  if (currentView === 'admin') {
    if (!isAdminAuthed) {
      return (
        <AdminLogin
          onLoginSuccess={() => setIsAdminAuthed(true)}
          onBackToSite={handleExitAdmin}
        />
      );
    }

    return (
      <AdminLayout
        currentTab={adminTab}
        onTabChange={setAdminTab}
        onViewSite={handleExitAdmin}
      >
        {adminTab === 'dashboard' && (
          <AdminDashboard onNavigateTab={setAdminTab} settings={settings} />
        )}
        {adminTab === 'orders' && <AdminOrders settings={settings} />}
        {adminTab === 'categories' && <AdminCategories />}
        {adminTab === 'services' && <AdminServices />}
        {adminTab === 'plans' && <AdminPlans settings={settings} />}
        {adminTab === 'offers' && <AdminOffers settings={settings} />}
        {adminTab === 'banners' && <AdminBanners />}
        {adminTab === 'tickets' && <AdminTickets />}
        {adminTab === 'settings' && (
          <AdminSettings onSettingsUpdated={() => loadDatabaseData()} />
        )}
      </AdminLayout>
    );
  }

  // ----------------------------------------------------
  // CUSTOMER WEBSITE VIEWS (NO LOGIN REQUIRED)
  // ----------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-50 text-[#172033] flex flex-col justify-between">
      {/* Maintenance Mode Alert if enabled by Admin */}
      {settings?.maintenanceMode && (
        <div className="bg-amber-500 text-white text-xs font-black text-center py-2 px-4 sticky top-0 z-50 shadow-md">
          ⚠️ Website Maintenance Mode is currently active. Catalog browsing only.
        </div>
      )}

      {/* Main View Container */}
      <div className="flex-1">
        {/* VIEW 1: HOME PAGE */}
        {currentView === 'home' && (
          <div className="pb-24">
            <Header
              settings={settings}
              currentView={currentView}
              onNavigate={(v) => handleBottomNavigate(v)}
              onOpenHowToOrder={() => setIsHowToOrderOpen(true)}
              onOpenSupport={() => {
                setCurrentView('support');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />

            {/* Dynamic Hero Carousel */}
            <HeroSlider
              banners={banners}
              autoSlideInterval={settings?.bannerAutoSlideInterval || 4}
              onBannerClick={handleBannerClick}
            />

            {/* Help Ticket Card & How to Buy guide */}
            <QuickActions
              settings={settings}
              onOpenHowToOrder={() => setIsHowToOrderOpen(true)}
              onOpenSupport={() => {
                setCurrentView('support');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />

            {/* Dynamic Platform Categories Section */}
            <ServicesSection
              categories={categories}
              onSelectCategory={handleSelectCategory}
            />
          </div>
        )}

        {/* VIEW 2: CATEGORY SERVICES PAGE */}
        {currentView === 'category' && selectedCategory && (
          <CategoryPage
            category={selectedCategory}
            categories={categories}
            services={services}
            plans={plans}
            offers={offers}
            settings={settings}
            onBack={() => setCurrentView('home')}
            onSelectPlan={handleSelectPlan}
            onSelectOffer={handleSelectOffer}
            onSelectCategory={handleSelectCategory}
          />
        )}

        {/* VIEW 3: ORDER FORM ("Complete Your Order") */}
        {currentView === 'order' && selectedCategory && (selectedPlan || selectedOffer) && (
          <OrderPage
            category={selectedCategory}
            service={selectedService || undefined}
            plan={selectedPlan || undefined}
            offer={selectedOffer || undefined}
            settings={settings}
            onBack={() => {
              if (selectedOffer) setCurrentView('home');
              else setCurrentView('category');
            }}
            onPaymentSuccess={handlePaymentSuccess}
          />
        )}

        {/* VIEW 4: ORDER SUCCESS PAGE */}
        {currentView === 'success' && confirmedOrder && (
          <OrderSuccessPage
            order={confirmedOrder}
            settings={settings}
            onViewOrders={() => setCurrentView('orders')}
          />
        )}

        {/* VIEW 5: TRACK ORDERS PAGE (NO LOGIN - Name + Mobile only) */}
        {currentView === 'orders' && (
          <TrackOrdersPage
            settings={settings}
            initialCustomer={lastCustomerInfo}
            onBack={() => setCurrentView('home')}
            onSelectPlatform={(catName) => {
              const cat = categories.find((c) => c.name.toLowerCase() === catName.toLowerCase());
              if (cat) handleSelectCategory(cat);
            }}
          />
        )}

        {/* VIEW 6: HELP & SUPPORT CENTER (Ticket Form + FAQs + Guide - No WhatsApp) */}
        {currentView === 'support' && (
          <HelpCenterPage
            settings={settings}
            onBack={() => setCurrentView('home')}
            onOpenHowToOrder={() => setIsHowToOrderOpen(true)}
          />
        )}
      </div>

      {/* Responsive Desktop & Tablet Footer */}
      {currentView !== 'success' && (
        <Footer
          settings={settings}
          onNavigate={(v) => handleBottomNavigate(v)}
          onOpenHowToOrder={() => setIsHowToOrderOpen(true)}
          onOpenSupport={() => {
            setCurrentView('support');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}

      {/* Global Modals */}
      {/* 1. How to Order 4-Step Guide Modal */}
      <HowToOrderModal
        isOpen={isHowToOrderOpen}
        onClose={() => setIsHowToOrderOpen(false)}
      />

      {/* 3. Explore All Platforms Grid Modal */}
      <ExplorePlatformsModal
        isOpen={isExplorePlatformsOpen}
        categories={categories}
        onClose={() => setIsExplorePlatformsOpen(false)}
        onSelectCategory={handleSelectCategory}
      />

      {/* Mobile-first Bottom Navigation (Always sticky on mobile) */}
      <BottomNavigation
        currentView={currentView}
        onNavigate={handleBottomNavigate}
      />
    </div>
  );
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: any) {
    console.error('ErrorBoundary caught error:', error);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6 text-center">
          <div className="max-w-sm bg-slate-800 border border-slate-700 p-6 rounded-3xl space-y-3">
            <h2 className="text-base font-black text-[#F72585]">Screen Restored</h2>
            <p className="text-xs text-slate-300">
              Corrupted cache detected. Click below to refresh your view smoothly.
            </p>
            <button
              onClick={() => {
                try {
                  localStorage.removeItem('skyrocket_orders');
                } catch {}
                window.location.reload();
              }}
              className="px-5 py-2.5 rounded-xl bg-[#F72585] text-white font-bold text-xs shadow-md cursor-pointer"
            >
              Refresh App
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function SafeApp() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}
