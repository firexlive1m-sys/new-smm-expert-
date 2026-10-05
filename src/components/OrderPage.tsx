import React, { useState, useEffect } from 'react';
import { Category, Service, Plan, Offer, WebsiteSettings } from '../types';
import { PlatformIcon } from './PlatformIcon';
import { ZAP_UPI_KEY } from '../config/zapupi';
import {
  trackMetaInitiateCheckout,
  trackMetaAddPaymentInfo,
} from '../lib/metaPixel';
import {
  ArrowLeft,
  ArrowRight,
  User,
  Phone,
  Link as LinkIcon,
  AlertCircle,
  Lock,
  Check,
  Loader2,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface OrderPageProps {
  category: Category;
  service?: Service;
  plan?: Plan;
  offer?: Offer;
  settings?: WebsiteSettings;
  onBack: () => void;
  onPaymentSuccess: (
    paymentInfo: { transactionId: string; paymentMethod: string },
    customerDetails: { customerName: string; mobileNumber: string; targetUrl: string }
  ) => void;
}

export const OrderPage: React.FC<OrderPageProps> = ({
  category,
  service,
  plan,
  offer,
  settings,
  onBack,
  onPaymentSuccess,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isPreparing, setIsPreparing] = useState(false);
  const [preparingStatus, setPreparingStatus] = useState('Preparing your secure payment...');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const currency = settings?.defaultCurrency || '₹';
  const isCombo = Boolean(offer);

  const displayPrice = offer ? offer.price : plan?.price || 0;
  const displayComparePrice = offer ? offer.comparePrice : plan?.comparePrice;
  const displayTitle = offer
    ? offer.title
    : `${category.name} ${service?.name || ''}`.trim();
  const displaySubtitle = offer
    ? offer.subtitle || 'Custom Growth Combo Pack'
    : plan?.quantityLabel || `${plan?.quantity} ${service?.name || ''}`.trim();

  // Track Meta InitiateCheckout on mount
  useEffect(() => {
    trackMetaInitiateCheckout({
      content_name: displayTitle,
      content_category: category.name,
      content_ids: [plan?.id || offer?.id || category.id],
      value: displayPrice,
      currency: 'INR',
      num_items: 1,
    });
  }, [displayTitle, category.name, displayPrice, plan?.id, offer?.id, category.id]);

  // Dynamic label & placeholder based on platform and service
  const getDynamicUrlConfig = () => {
    if (service?.urlLabel && service?.urlPlaceholder) {
      return { label: service.urlLabel, placeholder: service.urlPlaceholder };
    }

    const catName = category.name.toLowerCase();

    if (isCombo) {
      if (catName.includes('instagram')) {
        return {
          label: 'Instagram Profile or Post Link',
          placeholder: 'https://www.instagram.com/yourusername',
        };
      }
      if (catName.includes('youtube')) {
        return {
          label: 'YouTube Channel or Video Link',
          placeholder: 'https://www.youtube.com/@channel or video link',
        };
      }
      return {
        label: `${category.name} Link`,
        placeholder: 'https://...',
      };
    }

    const srvName = service?.name.toLowerCase() || '';

    if (catName.includes('instagram')) {
      if (srvName.includes('follower')) {
        return {
          label: 'Instagram Profile Link',
          placeholder: 'https://www.instagram.com/username',
        };
      }
      return {
        label: 'Instagram Post/Reel Link',
        placeholder: 'https://www.instagram.com/p/Cxyz123abc/',
      };
    }

    if (catName.includes('youtube')) {
      if (srvName.includes('sub')) {
        return {
          label: 'YouTube Channel Link',
          placeholder: 'https://www.youtube.com/@channelname',
        };
      }
      return {
        label: 'YouTube Video Link',
        placeholder: 'https://www.youtube.com/watch?v=xxxxxx',
      };
    }

    if (catName.includes('facebook')) {
      return {
        label: 'Facebook Page or Post Link',
        placeholder: 'https://www.facebook.com/yourpage',
      };
    }

    if (catName.includes('telegram')) {
      return {
        label: 'Telegram Channel/Group Link',
        placeholder: 'https://t.me/yourchannel',
      };
    }

    return {
      label: 'Target Profile or Post Link',
      placeholder: 'https://...',
    };
  };

  const urlConfig = getDynamicUrlConfig();

  const handleValidate = () => {
    const errs: { [key: string]: string } = {};

    if (!customerName.trim()) {
      errs.customerName = 'Please enter your full name';
    } else if (customerName.trim().length < 2) {
      errs.customerName = 'Name must be at least 2 characters';
    }

    const cleanPhone = mobileNumber.replace(/[^0-9]/g, '');
    if (!cleanPhone) {
      errs.mobileNumber = 'Please enter your 10-digit mobile number';
    } else if (cleanPhone.length !== 10) {
      errs.mobileNumber = 'Please enter a valid 10-digit mobile number';
    }

    if (!targetUrl.trim()) {
      errs.targetUrl = 'Please enter the link';
    } else if (targetUrl.trim().length < 5) {
      errs.targetUrl = 'Please provide a valid link';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!handleValidate()) return;

    setErrorMessage(null);
    setIsPreparing(true);
    setPreparingStatus('Connecting to 256-bit Encrypted UPI Gateway...');

    // Fire Meta AddPaymentInfo event with Advanced Matching details
    trackMetaAddPaymentInfo({
      content_name: displayTitle,
      value: displayPrice,
      currency: 'INR',
      customer: {
        name: customerName.trim(),
        phone: mobileNumber.replace(/[^0-9]/g, ''),
      },
    });

    const ZapUPI = (window as any).ZapUPI;
    if (!ZapUPI || typeof ZapUPI.createOrder !== 'function') {
      setIsPreparing(false);
      setErrorMessage('ZapUPI Payment SDK is loading, please try again in a few seconds.');
      return;
    }

    try {
      // 1. Set payment callbacks according to ZapUPI documentation
      ZapUPI.setPaymentCallbacks({
        onSuccess: (orderId: string) => {
          setIsPreparing(false);
          onPaymentSuccess(
            {
              transactionId: orderId || `ZAP${Date.now()}`,
              paymentMethod: 'ZapUPI (GPay/PhonePe/Paytm/QR)',
            },
            {
              customerName: customerName.trim(),
              mobileNumber: mobileNumber.replace(/[^0-9]/g, ''),
              targetUrl: targetUrl.trim(),
            }
          );
        },
        onFailed: (orderId: string) => {
          setIsPreparing(false);
          setErrorMessage(`Payment was cancelled or failed (Order: ${orderId || 'N/A'}). You can try again.`);
        },
        onTimeout: (orderId: string) => {
          setIsPreparing(false);
          setErrorMessage(`Payment timed out (Order: ${orderId || 'N/A'}). Please try again.`);
        },
      });

      // 2. Create Order with the user's hardcoded Zap key
      const uniqueOrderId = `ORD${Date.now()}`;
      const remarkText = `${displayTitle.slice(0, 16)} | ${customerName.trim().slice(0, 12)}`;

      // Save pending state so mobile redirect can restore seamlessly
      try {
        sessionStorage.setItem(
          'skyrocket_pending_checkout',
          JSON.stringify({
            uniqueOrderId,
            customerName: customerName.trim(),
            mobileNumber: mobileNumber.replace(/[^0-9]/g, '').slice(-10),
            targetUrl: targetUrl.trim(),
            categoryId: category.id,
            categoryName: category.name,
            serviceId: service?.id || (offer ? 'combo' : 'general'),
            serviceName: offer ? offer.title || 'Combo Offer' : service?.name || 'Service',
            planId: plan?.id || offer?.id || 'combo-plan',
            planQuantity: plan?.quantity || 1,
            amount: displayPrice,
            isCustomOffer: Boolean(offer),
            offerTitle: offer?.title || '',
            itemsSummary: offer?.itemsIncluded || [],
            timestamp: Date.now(),
          })
        );
      } catch {}

      ZapUPI.createOrder(
        {
          zap_key: ZAP_UPI_KEY,
          order_id: uniqueOrderId,
          amount: String(displayPrice),
          customer_mobile: mobileNumber.replace(/[^0-9]/g, ''),
          remark: remarkText,
        },
        {
          onResponse: (paymentUrl: string, orderId: string) => {
            // Dismiss the preparing overlay and immediately open ZapUPI payment sheet
            setIsPreparing(false);
            if (paymentUrl) {
              ZapUPI.loadPayment(paymentUrl);
            } else {
              setErrorMessage('ZapUPI did not return a payment URL. Please try again.');
            }
          },
          onError: (err: any) => {
            setIsPreparing(false);
            console.error('ZapUPI createOrder error:', err);
            const msg = typeof err === 'string' ? err : err?.message || JSON.stringify(err);
            setErrorMessage(`Payment Gateway Error: ${msg}`);
          },
        }
      );
    } catch (e: any) {
      setIsPreparing(false);
      console.error('ZapUPI Exception:', e);
      setErrorMessage(`Failed to initiate payment: ${e?.message || e}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24 md:pb-16 flex flex-col justify-start relative">
      {/* Preparing Security Screen Overlay */}
      {isPreparing && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-pink-100 flex flex-col items-center text-center space-y-4 animate-scale-in">
            {/* Animated Shield / Lock */}
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-pink-500/20 to-purple-500/20 flex items-center justify-center animate-pulse">
                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#F72585] to-[#7209B7] flex items-center justify-center text-white shadow-lg shadow-pink-500/30">
                  <ShieldCheck className="w-8 h-8 stroke-[2.5]" />
                </div>
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                <Lock className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
            </div>

            {/* Text details */}
            <div className="space-y-1">
              <h3 className="text-base font-black text-[#172033]">
                Preparing Your Secure Payment...
              </h3>
              <p className="text-xs text-gray-500 font-semibold leading-relaxed">
                {preparingStatus}
              </p>
            </div>

            {/* Supported payment badges */}
            <div className="w-full py-2 px-3 rounded-2xl bg-slate-50 border border-gray-150 flex items-center justify-around text-[10px] font-black">
              <span className="text-blue-600">Google Pay</span>
              <span className="text-gray-300">•</span>
              <span className="text-purple-700">PhonePe</span>
              <span className="text-gray-300">•</span>
              <span className="text-sky-600">Paytm</span>
              <span className="text-gray-300">•</span>
              <span className="text-emerald-600">UPI QR</span>
            </div>

            {/* Spinner and notice */}
            <div className="flex items-center gap-2 text-[11px] font-bold text-gray-400">
              <Loader2 className="w-4 h-4 animate-spin text-[#F72585]" />
              <span>Opening payment gateway, please wait...</span>
            </div>
          </div>
        </div>
      )}

      {/* Top Header */}
      <div className="bg-white border-b border-pink-100 px-4 sm:px-6 py-2.5 sm:py-3 shadow-[0_2px_12px_rgba(247,37,133,0.04)] sticky top-0 z-30">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <button
              onClick={onBack}
              aria-label="Go back"
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-pink-50 hover:bg-pink-100 text-[#F72585] flex items-center justify-center transition-colors active:scale-95 cursor-pointer shrink-0"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
            </button>
            <div className="min-w-0">
              <h1 className="font-black text-sm sm:text-base text-[#172033] leading-none truncate">
                Quick Checkout
              </h1>
              <p className="text-[10px] sm:text-[11px] font-semibold text-gray-400 mt-0.5 truncate">
                {displayTitle}
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full shrink-0 flex items-center gap-1">
            <Lock className="w-2.5 h-2.5 text-emerald-600" />
            <span>100% Safe</span>
          </span>
        </div>
      </div>

      {/* Main Single Card Content: Fits comfortably on screen */}
      <div className="max-w-md mx-auto w-full px-3.5 sm:px-4 py-3 sm:py-4 space-y-3.5">
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-3xl p-4 sm:p-5 border border-pink-100 shadow-[0_4px_24px_rgba(247,37,133,0.06)] space-y-3 sm:space-y-3.5"
        >
          {/* 1. COMPACT ORDER SUMMARY AT THE TOP: Name + Quantity + Price ONLY */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-pink-50/90 via-pink-50/40 to-white border border-pink-100/90">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-white border border-pink-100 flex items-center justify-center shrink-0 p-1.5 shadow-2xs">
                <PlatformIcon
                  nameOrSlug={category.name}
                  imageUrl={category.imageUrl}
                  className="w-6 h-6"
                />
              </div>
              <div className="min-w-0">
                <h2 className="text-xs sm:text-sm font-black text-[#172033] truncate leading-tight">
                  {displayTitle}
                </h2>
                <span className="text-[11px] font-bold text-[#F72585] block truncate mt-0.5">
                  {displaySubtitle}
                </span>
              </div>
            </div>

            <div className="text-right shrink-0 ml-2">
              {displayComparePrice && displayComparePrice > displayPrice && (
                <span className="text-[10px] text-gray-400 line-through font-bold block leading-none">
                  {currency}{displayComparePrice}
                </span>
              )}
              <span className="text-lg sm:text-xl font-black text-[#F72585] leading-none">
                {currency}{displayPrice.toLocaleString()}
              </span>
            </div>
          </div>

          {/* 2. NAME INPUT */}
          <div>
            <label className="block text-[11px] sm:text-xs font-black text-[#172033] mb-1">
              Your Full Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className={`w-full pl-9 pr-3 py-2.5 rounded-xl bg-white border text-sm font-semibold text-[#172033] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F72585] transition-all ${
                  errors.customerName ? 'border-red-400 bg-red-50/20' : 'border-gray-200'
                }`}
              />
            </div>
            {errors.customerName && (
              <p className="text-[10px] font-bold text-red-500 mt-0.5 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.customerName}
              </p>
            )}
          </div>

          {/* 3. MOBILE NUMBER INPUT */}
          <div>
            <label className="block text-[11px] sm:text-xs font-black text-[#172033] mb-1">
              Mobile Number <span className="text-red-500">*</span>
            </label>
            <div className="relative flex">
              <div className="flex items-center gap-1 px-3 bg-gray-50 border border-r-0 border-gray-200 rounded-l-xl text-xs font-bold text-gray-700">
                <Phone className="w-3.5 h-3.5 text-gray-500" />
                +91
              </div>
              <input
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                required
                value={mobileNumber}
                onChange={(e) =>
                  setMobileNumber(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))
                }
                placeholder="10-digit mobile number"
                className={`w-full px-3 py-2.5 rounded-r-xl bg-white border text-sm font-semibold text-[#172033] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F72585] transition-all tracking-wider ${
                  errors.mobileNumber ? 'border-red-400 bg-red-50/20' : 'border-gray-200'
                }`}
              />
            </div>
            {errors.mobileNumber && (
              <p className="text-[10px] font-bold text-red-500 mt-0.5 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.mobileNumber}
              </p>
            )}
          </div>

          {/* 4. TARGET LINK INPUT */}
          <div>
            <label className="block text-[11px] sm:text-xs font-black text-[#172033] mb-1">
              {urlConfig.label} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <LinkIcon className="w-4 h-4" />
              </div>
              <input
                type="url"
                required
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder={urlConfig.placeholder}
                className={`w-full pl-9 pr-3 py-2.5 rounded-xl bg-white border text-sm font-semibold text-[#172033] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F72585] transition-all ${
                  errors.targetUrl ? 'border-red-400 bg-red-50/20' : 'border-gray-200'
                }`}
              />
            </div>
            {errors.targetUrl && (
              <p className="text-[10px] font-bold text-red-500 mt-0.5 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.targetUrl}
              </p>
            )}
          </div>

          {/* Error Message if any */}
          {errorMessage && (
            <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-start gap-2 animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <div className="flex-1">{errorMessage}</div>
            </div>
          )}

          {/* 5. BUY / PROCEED TO PAY BUTTON */}
          <div className="pt-1 space-y-2">
            <button
              type="submit"
              disabled={isPreparing}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#F72585] to-[#7209B7] text-white font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-pink-500/25 hover:shadow-xl active:scale-[0.98] transition-all cursor-pointer disabled:opacity-75"
            >
              {isPreparing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Preparing Secure Payment...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-white" />
                  <span>Pay {currency}{displayPrice.toLocaleString()} with UPI</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[10px] font-semibold text-gray-400">
              <Lock className="w-3 h-3 text-[#20B26B]" />
              <span>Instant Dispatch • UPI (Google Pay, PhonePe, Paytm), QR Code</span>
            </div>
          </div>
        </form>

        {/* 6. TRUST GUARANTEES BADGES (Exact Match to Screenshot 2) */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white border border-gray-150 shadow-[0_2px_14px_rgba(0,0,0,0.02)]">
          <div className="grid grid-cols-2 gap-x-3.5 sm:gap-x-4 gap-y-3.5">
            {/* Item 1 */}
            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-[#10B981] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                <Check className="w-3 h-3 text-white stroke-[3.2]" />
              </div>
              <span className="text-xs sm:text-[13px] font-black text-[#172033] leading-snug">
                High-Quality Real Services
              </span>
            </div>

            {/* Item 2 */}
            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-[#10B981] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                <Check className="w-3 h-3 text-white stroke-[3.2]" />
              </div>
              <span className="text-xs sm:text-[13px] font-black text-[#172033] leading-snug">
                Fast Delivery Guaranteed
              </span>
            </div>

            {/* Item 3 */}
            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-[#10B981] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                <Check className="w-3 h-3 text-white stroke-[3.2]" />
              </div>
              <span className="text-xs sm:text-[13px] font-black text-[#172033] leading-snug">
                100% Safe & Secure
              </span>
            </div>

            {/* Item 4 */}
            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-[#10B981] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                <Check className="w-3 h-3 text-white stroke-[3.2]" />
              </div>
              <span className="text-xs sm:text-[13px] font-black text-[#172033] leading-snug">
                24/7 Customer Support
              </span>
            </div>

            {/* Item 5 */}
            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-[#10B981] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                <Check className="w-3 h-3 text-white stroke-[3.2]" />
              </div>
              <span className="text-xs sm:text-[13px] font-black text-[#172033] leading-snug">
                No Password Required
              </span>
            </div>

            {/* Item 6 */}
            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-[#10B981] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                <Check className="w-3 h-3 text-white stroke-[3.2]" />
              </div>
              <span className="text-xs sm:text-[13px] font-black text-[#172033] leading-snug">
                100% Satisfaction
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
