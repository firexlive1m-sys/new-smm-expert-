import React, { useState, useMemo } from 'react';
import { Category, Service, Plan, Offer, WebsiteSettings } from '../types';
import { PlatformIcon } from './PlatformIcon';
import {
  ArrowLeft,
  ShieldCheck,
  Star,
  Zap,
  Lock,
  Users,
  Heart,
  Eye,
  MessageCircle,
  Share2,
  Clock,
  Compass,
  Search,
  ShoppingCart,
  Rocket,
  Sparkles,
  Flame,
} from 'lucide-react';

interface CategoryPageProps {
  category: Category;
  categories?: Category[];
  services: Service[];
  plans: Plan[];
  offers: Offer[];
  settings?: WebsiteSettings;
  onBack: () => void;
  onSelectPlan: (plan: Plan, service: Service) => void;
  onSelectOffer?: (offer: Offer) => void;
  onSelectCategory?: (category: Category) => void;
}

export const CategoryPage: React.FC<CategoryPageProps> = ({
  category,
  categories = [],
  services,
  plans,
  offers,
  settings,
  onBack,
  onSelectPlan,
  onSelectOffer,
  onSelectCategory,
}) => {
  // Filter services belonging to this category (match by id or category name)
  const activeServices = useMemo(() => {
    return services
      .filter((s) => {
        if (!s.active) return false;
        if (s.categoryId === category.id) return true;
        if (s.categoryName && category.name && s.categoryName.toLowerCase() === category.name.toLowerCase()) return true;
        return false;
      })
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [services, category.id, category.name]);

  // Selected Service Type tab (defaults to the first active service)
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');

  // Keep selectedServiceId in sync when category or services change
  React.useEffect(() => {
    if (activeServices.length > 0) {
      const match = activeServices.find((s) => s.id === selectedServiceId);
      if (!match) {
        setSelectedServiceId(activeServices[0].id);
      }
    } else {
      setSelectedServiceId('');
    }
  }, [activeServices, category.id]);

  // Current active service object (or fallback synthetic service if none)
  const currentService = useMemo(() => {
    const found = activeServices.find((s) => s.id === selectedServiceId);
    if (found) return found;
    if (activeServices.length > 0) return activeServices[0];
    // If category has no services defined yet, synthesize a fallback service
    return {
      id: `fallback-${category.id}`,
      categoryId: category.id,
      categoryName: category.name,
      name: category.name,
      slug: category.slug,
      active: true,
      sortOrder: 1,
    } as Service;
  }, [activeServices, selectedServiceId, category]);

  // Filter plans belonging to the current service / category
  const servicePlans = useMemo(() => {
    return plans
      .filter((p) => {
        if (!p.active) return false;
        // Direct service match
        if (currentService && p.serviceId === currentService.id) return true;
        // Match by category
        const catMatches =
          p.categoryId === category.id ||
          (p.categoryName && category.name && p.categoryName.toLowerCase() === category.name.toLowerCase());
        if (!catMatches) return false;
        // If activeServices exist, also verify service name matches current selected tab
        if (activeServices.length > 0 && currentService) {
          return p.serviceName?.toLowerCase() === currentService.name?.toLowerCase();
        }
        return true;
      })
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0) || (Number(a.price) || 0) - (Number(b.price) || 0));
  }, [plans, currentService, category, activeServices]);

  // Active promotional offers for this category (if any)
  const categoryOffers = useMemo(() => {
    return offers.filter(
      (o) =>
        (o.categoryId === category.id ||
          o.categoryName?.toLowerCase() === category.name.toLowerCase()) &&
        o.active
    );
  }, [offers, category.id, category.name]);

  const currency = settings?.defaultCurrency || '₹';

  // Helper to format quantities like 1000 -> 1K, 5000 -> 5K
  const formatQuantity = (qty: number): string => {
    if (qty >= 1000000) return `${qty / 1000000}M`;
    if (qty >= 1000) {
      const k = qty / 1000;
      return `${Number.isInteger(k) ? k : k.toFixed(1)}K`;
    }
    return `${qty}`;
  };

  // Helper to pick icons for service tabs (Followers, Likes, Views, Comments, etc.)
  const getServiceTabIcon = (serviceName: string) => {
    const name = serviceName.toLowerCase();
    if (name.includes('follower') || name.includes('member') || name.includes('subscri')) {
      return <Users className="w-4 h-4 stroke-[2.2]" />;
    }
    if (name.includes('like') || name.includes('react') || name.includes('heart')) {
      return <Heart className="w-4 h-4 fill-current stroke-[2]" />;
    }
    if (name.includes('view') || name.includes('watch') || name.includes('impression')) {
      return <Eye className="w-4 h-4 stroke-[2.2]" />;
    }
    if (name.includes('comment')) {
      return <MessageCircle className="w-4 h-4 stroke-[2.2]" />;
    }
    if (name.includes('share') || name.includes('retweet')) {
      return <Share2 className="w-4 h-4 stroke-[2.2]" />;
    }
    return <Sparkles className="w-4 h-4 stroke-[2.2]" />;
  };

  return (
    <div className="min-h-screen bg-slate-50/70 pb-28 md:pb-20">
      {/* Top Header */}
      <div className="bg-white border-b border-pink-100/90 px-4 sm:px-6 lg:px-8 py-3.5 shadow-[0_2px_12px_rgba(247,37,133,0.04)] sticky top-0 z-30 backdrop-blur-md bg-white/95">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              aria-label="Go back"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-pink-50 hover:bg-pink-100 text-[#F72585] flex items-center justify-center transition-colors active:scale-95 cursor-pointer shrink-0"
            >
              <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
            </button>
            <div className="flex items-center gap-2.5 min-w-0">
              <PlatformIcon
                nameOrSlug={category.name}
                imageUrl={category.imageUrl}
                className="w-7 h-7 sm:w-8 sm:h-8"
              />
              <div className="min-w-0">
                <h1 className="font-black text-base sm:text-lg md:text-xl text-[#172033] leading-none truncate">
                  {category.name} Services
                </h1>
                <p className="text-[10px] sm:text-xs font-semibold text-gray-400 mt-0.5 hidden sm:block truncate">
                  High Retention • Instant Activation • Non-Drop
                </p>
              </div>
            </div>
          </div>
          <span className="text-[10px] sm:text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full shrink-0 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>INSTANT DISPATCH</span>
          </span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-3.5 sm:pt-6 flex flex-col gap-3.5 sm:gap-5">
        {/* 1. TOP PROMOTIONAL COMBO OFFER CARD (Exact Match to Screenshot) */}
        {categoryOffers.length > 0 && (
          <div className="flex flex-col gap-3.5">
            {categoryOffers.map((offer) => (
              <div
                key={offer.id}
                onClick={() => {
                  if (onSelectOffer) onSelectOffer(offer);
                }}
                className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-pink-50/75 via-white to-pink-50/40 border border-pink-200/90 p-4 sm:p-6 shadow-[0_4px_24px_rgba(247,37,133,0.06)] cursor-pointer group hover:border-[#F72585] hover:shadow-md transition-all active:scale-[0.99]"
              >
                {/* Top Row: Limited Time Offer (left) + Discount Badge (right) */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-black tracking-wider uppercase text-[#E11D48]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#E11D48] animate-pulse" />
                    <span>{offer.badgeText || 'LIMITED TIME OFFER'}</span>
                  </div>

                  {offer.discountBadge && (
                    <span className="text-[11px] font-black uppercase bg-[#F59E0B] text-white px-2.5 py-0.5 rounded-full shadow-2xs">
                      🔥 {offer.discountBadge}
                    </span>
                  )}
                </div>

                {/* Main Title */}
                <h2 className="text-2xl sm:text-3xl font-black text-[#172033] leading-tight tracking-tight">
                  {offer.title}
                </h2>

                {/* Subtitle / Included Items Breakdown */}
                <p className="text-xs sm:text-sm font-semibold text-gray-500 mt-1">
                  {offer.itemsIncluded ||
                    offer.subtitle ||
                    'Real Indian · Non-Drop · Instant Delivery 🇮🇳'}
                </p>

                {/* Bottom Row: Crossed Price + Current Price (Left) & Buy Now Button (Right) */}
                <div className="flex items-end justify-between mt-3.5 pt-1">
                  <div>
                    {offer.comparePrice && offer.comparePrice > offer.price && (
                      <span className="text-xs sm:text-sm text-gray-400 line-through font-bold block leading-none">
                        {currency}
                        {offer.comparePrice.toLocaleString()}
                      </span>
                    )}
                    <div className="text-2xl sm:text-3xl font-black text-[#172033] leading-none mt-1">
                      <span className="text-lg font-bold text-[#F72585] mr-0.5">{currency}</span>
                      <span>{offer.price.toLocaleString()}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="px-5 py-2.5 sm:px-6 sm:py-3 rounded-2xl bg-gradient-to-r from-[#F72585] to-[#FF4FA0] text-white text-xs sm:text-sm font-black shadow-md shadow-pink-300 group-hover:shadow-lg group-hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Zap className="w-4 h-4 fill-white text-white" />
                    <span>{offer.buttonText || 'Buy Now'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 2. SERVICE TYPE TABS (Exact Match to Screenshot 1) */}
        {activeServices.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 -mx-4 px-4 sm:mx-0 sm:px-0">
            {activeServices.map((service) => {
              const isSelected = service.id === currentService?.id;
              return (
                <button
                  key={service.id}
                  onClick={() => setSelectedServiceId(service.id)}
                  className={`px-4 sm:px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition-all shrink-0 cursor-pointer flex items-center gap-2 active:scale-95 ${
                    isSelected
                      ? 'bg-pink-50/90 text-[#F72585] border-2 border-[#F72585] shadow-xs'
                      : 'bg-white text-gray-700 border border-gray-200 hover:border-pink-300'
                  }`}
                >
                  <span className={isSelected ? 'text-[#F72585]' : 'text-gray-500'}>
                    {getServiceTabIcon(service.name)}
                  </span>
                  <span>{service.name}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* 4. SECTION HEADER (Exact Match to Screenshot 1 & 2) */}
        <div className="flex items-center gap-2 pt-1">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
          <h2 className="text-sm sm:text-base font-black text-[#172033]">
            Premium Non-Drop Plans · Lifetime Guaranteed
          </h2>
        </div>

        {/* 5. THE PLAN CARDS LIST (Exact Match to Screenshots 1, 2, 3) */}
        {currentService && (
          <div className="space-y-3 sm:space-y-3.5">
            {servicePlans.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-gray-100 shadow-xs max-w-md mx-auto">
                <Clock className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-600 font-bold text-base">No packages found for this service</p>
                <p className="text-xs text-gray-400 mt-1">Please select another service tab above.</p>
              </div>
            ) : (
              servicePlans.map((plan) => {
                const isPopular =
                  Boolean(plan.badge && plan.badge.toLowerCase().includes('popular')) ||
                  Boolean(plan.featured) ||
                  plan.quantity === 5000;
                const formattedQty = formatQuantity(plan.quantity);
                const displayPlanTitle =
                  plan.quantityLabel || `${formattedQty} ${currentService.name}`;
                const displayPlanSubtitle =
                  plan.guaranteeText || plan.description || 'Real Non-Drop Guarantee';
                const safePrice = Number(plan.price) || 0;

                const badgeText = plan.badge
                  ? plan.badge.startsWith('🔥') || plan.badge.startsWith('⭐') || plan.badge.startsWith('⚡')
                    ? plan.badge
                    : `🔥 ${plan.badge}`
                  : isPopular
                  ? '🔥 Most Popular'
                  : null;

                return (
                  <div
                    key={plan.id}
                    onClick={() => onSelectPlan(plan, currentService)}
                    className="relative flex items-center justify-between p-3.5 sm:p-4 rounded-3xl bg-white border border-gray-150 shadow-[0_2px_14px_rgba(0,0,0,0.03)] hover:border-pink-300 hover:shadow-[0_4px_20px_rgba(247,37,133,0.08)] transition-all cursor-pointer group active:scale-[0.99] overflow-hidden"
                  >
                    {/* Left vertical rounded accent pill */}
                    <div
                      className={`absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-12 rounded-r-full ${
                        isPopular ? 'bg-emerald-500' : 'bg-[#F72585]'
                      }`}
                    />

                    {/* Left: Platform squircle icon + Plan name + Subtitle */}
                    <div className="flex items-center gap-3.5 sm:gap-4 pl-2 min-w-0">
                      <div className="w-13 h-13 sm:w-15 sm:h-15 rounded-2xl bg-gradient-to-tr from-pink-50 via-rose-50 to-pink-100/60 border border-pink-200/50 flex items-center justify-center p-2.5 shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                        <PlatformIcon
                          nameOrSlug={category.name}
                          imageUrl={category.imageUrl}
                          className="w-8 h-8 sm:w-9 sm:h-9"
                        />
                      </div>

                      <div className="min-w-0">
                        <h3 className="text-base sm:text-lg font-black text-[#172033] leading-tight truncate group-hover:text-[#F72585] transition-colors">
                          {displayPlanTitle}
                        </h3>
                        <p className="text-xs font-semibold text-gray-500 mt-0.5 truncate">
                          {displayPlanSubtitle}
                        </p>
                      </div>
                    </div>

                    {/* Right: Badge (if set or popular) + Price Pill Button */}
                    <div className="flex flex-col items-end shrink-0 ml-3">
                      {badgeText && (
                        <span
                          className="text-[10px] font-black uppercase text-amber-900 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full mb-1 flex items-center gap-0.5 shadow-2xs"
                          style={plan.badgeColor ? { backgroundColor: `${plan.badgeColor}20`, borderColor: plan.badgeColor, color: plan.badgeColor } : undefined}
                        >
                          {badgeText}
                        </span>
                      )}

                      {/* Cut Price and Discount Badge (Shown ONLY if comparePrice is set) */}
                      {plan.comparePrice && Number(plan.comparePrice) > safePrice && (
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-[11px] text-gray-400 line-through font-bold">
                            {currency}{Number(plan.comparePrice).toLocaleString()}
                          </span>
                          {plan.discountPercent && Number(plan.discountPercent) > 0 && (
                            <span className="text-[10px] font-black text-[#20B26B] bg-emerald-50 border border-emerald-200/80 px-1.5 py-0.5 rounded-md">
                              {plan.discountPercent}% OFF
                            </span>
                          )}
                        </div>
                      )}

                      <div className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-2xl bg-pink-50/90 group-hover:bg-[#F72585] text-[#F72585] group-hover:text-white border border-pink-200/80 transition-all font-black text-sm sm:text-base flex items-center gap-1.5 shadow-2xs">
                        <span>
                          {currency}
                          {safePrice.toLocaleString()}
                        </span>
                        <span className="text-xs transition-transform group-hover:translate-x-0.5">
                          →
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* 6. HOW TO ORDER (Exact Match to Screenshot 3) */}
        <div className="mt-4 pt-2">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base">🚀</span>
            <h3 className="text-sm sm:text-base font-black text-[#172033]">
              How to Order
            </h3>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div className="bg-white rounded-2xl p-3 sm:p-4 border border-gray-150 shadow-2xs text-center flex flex-col items-center justify-center">
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-1.5">
                <Search className="w-4 h-4" />
              </div>
              <span className="text-[11px] sm:text-xs font-black text-[#172033] leading-tight">
                1. Choose Service
              </span>
            </div>

            <div className="bg-white rounded-2xl p-3 sm:p-4 border border-gray-150 shadow-2xs text-center flex flex-col items-center justify-center">
              <div className="w-8 h-8 rounded-xl bg-pink-50 text-[#F72585] flex items-center justify-center mb-1.5">
                <ShoppingCart className="w-4 h-4" />
              </div>
              <span className="text-[11px] sm:text-xs font-black text-[#172033] leading-tight">
                2. Add to Cart
              </span>
            </div>

            <div className="bg-white rounded-2xl p-3 sm:p-4 border border-gray-150 shadow-2xs text-center flex flex-col items-center justify-center">
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-1.5">
                <Rocket className="w-4 h-4" />
              </div>
              <span className="text-[11px] sm:text-xs font-black text-[#172033] leading-tight">
                3. Get Instant Delivery
              </span>
            </div>
          </div>
        </div>

        {/* 7. EXPLORE MORE PLATFORMS CAROUSEL (Exact Match to Screenshot 3) */}
        {categories.length > 1 && (
          <div className="mt-2 bg-gradient-to-br from-pink-50/60 to-white rounded-3xl p-4 sm:p-5 border border-pink-100 shadow-2xs">
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-pink-100 text-[#F72585] flex items-center justify-center">
                  <Compass className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-[#172033]">
                    Explore More Platforms
                  </h4>
                  <p className="text-[10px] sm:text-xs font-semibold text-gray-400">
                    Tap any platform to explore
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1">
                ☞ Swipe
              </span>
            </div>

            {/* Horizontal Platforms Row */}
            <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-1">
              {categories
                .filter((c) => c.active && c.id !== category.id)
                .map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      if (onSelectCategory) {
                        onSelectCategory(cat);
                      }
                    }}
                    className="p-3 sm:p-3.5 rounded-2xl bg-white border border-pink-100 hover:border-pink-300 shadow-2xs hover:shadow-xs transition-all flex flex-col items-center justify-center gap-1.5 min-w-[76px] sm:min-w-[84px] cursor-pointer group active:scale-95 shrink-0"
                  >
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-50 flex items-center justify-center p-1.5 group-hover:scale-105 transition-transform">
                      <PlatformIcon
                        nameOrSlug={cat.name}
                        imageUrl={cat.imageUrl}
                        className="w-6 h-6 sm:w-7 sm:h-7"
                      />
                    </div>
                    <span className="text-[10px] sm:text-xs font-black text-[#172033] truncate max-w-[70px]">
                      {cat.name}
                    </span>
                  </button>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
