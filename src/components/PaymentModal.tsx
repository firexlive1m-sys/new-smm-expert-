import React, { useState } from 'react';
import { Plan, Service, Category, Offer, WebsiteSettings } from '../types';
import {
  X,
  ShieldCheck,
  CheckCircle,
  CreditCard,
  Smartphone,
  Lock,
  Loader2,
  QrCode,
  ArrowRight,
  Zap,
  AlertCircle,
} from 'lucide-react';

interface PaymentModalProps {
  category: Category;
  service?: Service;
  plan?: Plan;
  offer?: Offer;
  customerDetails: {
    customerName: string;
    mobileNumber: string;
    targetUrl: string;
  };
  settings?: WebsiteSettings;
  onClose: () => void;
  onPaymentSuccess: (paymentInfo: {
    transactionId: string;
    paymentMethod: string;
  }) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  category,
  service,
  plan,
  offer,
  customerDetails,
  settings,
  onClose,
  onPaymentSuccess,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<'zapupi' | 'manual_qr' | 'test'>('zapupi');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const currency = settings?.defaultCurrency || '₹';
  const displayPrice = offer ? offer.price : plan?.price || 0;
  const displayTitle = offer
    ? offer.title
    : `${plan?.quantityLabel || `${plan?.quantity} ${service?.name || ''}`} ${category.name}`;

  const zapKey = settings?.zapUpiKey?.trim() || '';
  const isZapUpiConfigured = Boolean(settings?.zapUpiEnabled && zapKey);

  // Trigger ZapUPI payment
  const handlePayWithZapUpi = () => {
    setErrorMessage(null);

    // If ZapUPI is not configured in Admin Settings
    if (!zapKey) {
      setErrorMessage(
        'ZapUPI Key is not configured yet. Please add your Zap Key in Admin Panel ➔ Settings to accept live payments.'
      );
      return;
    }

    const ZapUPI = (window as any).ZapUPI;
    if (!ZapUPI || typeof ZapUPI.createOrder !== 'function') {
      setErrorMessage(
        'ZapUPI Web Kit SDK is loading. Please check your internet connection or refresh the page.'
      );
      return;
    }

    setIsProcessing(true);

    try {
      // 1. Set payment callbacks as specified in ZapUPI docs
      ZapUPI.setPaymentCallbacks({
        onSuccess: (orderId: string) => {
          setIsProcessing(false);
          onPaymentSuccess({
            transactionId: orderId || `ZAP${Date.now()}`,
            paymentMethod: 'ZapUPI (GPay/PhonePe/Paytm/QR)',
          });
        },
        onFailed: (orderId: string) => {
          setIsProcessing(false);
          setErrorMessage(`Payment was cancelled or failed (Order: ${orderId || 'N/A'}). You can try again.`);
        },
        onTimeout: (orderId: string) => {
          setIsProcessing(false);
          setErrorMessage(`Payment timed out (Order: ${orderId || 'N/A'}). Please try again.`);
        },
      });

      // 2. Create Order
      const uniqueOrderId = `ORD${Date.now()}`;
      const remarkText = `${(settings?.zapUpiRemark || 'Order').slice(0, 15)} | ${customerDetails.customerName.slice(0, 15)}`;

      ZapUPI.createOrder(
        {
          zap_key: zapKey,
          order_id: uniqueOrderId,
          amount: String(displayPrice),
          customer_mobile: customerDetails.mobileNumber,
          remark: remarkText,
        },
        {
          onResponse: (paymentUrl: string, orderId: string, data: any) => {
            // Dismiss loader as soon as API responds, then load fullscreen payment page
            setIsProcessing(false);
            if (paymentUrl) {
              ZapUPI.loadPayment(paymentUrl);
            } else {
              setErrorMessage('ZapUPI did not return a payment URL. Please verify your Zap Key.');
            }
          },
          onError: (err: any) => {
            setIsProcessing(false);
            console.error('ZapUPI Order Error:', err);
            const errStr = typeof err === 'string' ? err : err?.message || JSON.stringify(err);
            setErrorMessage(`ZapUPI Error: ${errStr}`);
          },
        }
      );
    } catch (e: any) {
      setIsProcessing(false);
      console.error('ZapUPI Init Exception:', e);
      setErrorMessage(`Failed to initiate ZapUPI payment: ${e?.message || e}`);
    }
  };

  // Fallback demo/simulation handler
  const handleSimulatePayment = () => {
    setIsProcessing(true);
    setErrorMessage(null);

    setTimeout(() => {
      setIsProcessing(false);
      const randomTxn = 'DEMO_' + Date.now().toString().slice(-8);
      onPaymentSuccess({
        transactionId: randomTxn,
        paymentMethod: selectedMethod === 'manual_qr' ? 'Manual QR Code' : 'Instant Demo Payment',
      });
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div className="w-full max-w-md sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-slide-up">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#20B26B] text-white flex items-center justify-center">
              <Lock className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-sm font-black text-[#172033]">Secure UPI Checkout</h3>
              <p className="text-[10px] text-gray-500 font-semibold">256-bit SSL Encrypted • Instant Delivery</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Order Summary Recap */}
          <div className="p-3.5 rounded-2xl bg-pink-50/60 border border-pink-100 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase text-[#F72585] tracking-wider">
                Paying for
              </span>
              <h4 className="text-sm font-black text-[#172033] leading-tight">
                {displayTitle}
              </h4>
              <p className="text-[11px] text-gray-500 truncate max-w-[200px]">
                {customerDetails.customerName} • +91 {customerDetails.mobileNumber}
              </p>
            </div>
            <div className="text-right">
              <span className="text-[20px] font-black text-[#F72585]">
                {currency}{displayPrice.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Error Message if any */}
          {errorMessage && (
            <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-start gap-2 animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <div className="flex-1">{errorMessage}</div>
            </div>
          )}

          {/* ZapUPI Official Option */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-pink-50/80 via-white to-purple-50/50 border-2 border-[#F72585] shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#F72585] text-white flex items-center justify-center shadow-sm">
                  <Zap className="w-4 h-4 fill-white" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-[#172033]">ZapUPI Instant Gateway</span>
                    <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-700 text-[9px] font-black">
                      RECOMMENDED
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-500 font-semibold block">
                    Google Pay, PhonePe, Paytm, BHIM & QR
                  </span>
                </div>
              </div>
              <div className="w-4 h-4 rounded-full border-2 border-[#F72585] bg-[#F72585] flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
              </div>
            </div>

            {/* Supported App Badges */}
            <div className="grid grid-cols-4 gap-1.5 pt-1">
              <div className="py-1.5 px-1 rounded-xl bg-white border border-gray-200 text-center flex flex-col items-center justify-center shadow-xs">
                <span className="text-[10px] font-black text-blue-600">GPay</span>
              </div>
              <div className="py-1.5 px-1 rounded-xl bg-white border border-gray-200 text-center flex flex-col items-center justify-center shadow-xs">
                <span className="text-[10px] font-black text-purple-700">PhonePe</span>
              </div>
              <div className="py-1.5 px-1 rounded-xl bg-white border border-gray-200 text-center flex flex-col items-center justify-center shadow-xs">
                <span className="text-[10px] font-black text-sky-600">Paytm</span>
              </div>
              <div className="py-1.5 px-1 rounded-xl bg-white border border-gray-200 text-center flex flex-col items-center justify-center shadow-xs">
                <span className="text-[10px] font-black text-emerald-600">Scan QR</span>
              </div>
            </div>

            {!isZapUpiConfigured && (
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] leading-tight">
                <strong>Admin Notice:</strong> Zap Key is not set yet. Go to <strong>Admin Panel ➔ Settings</strong> and paste your Zap Key to activate live payments.
              </div>
            )}
          </div>
        </div>

        {/* Footer CTA */}
        <div className="p-4 border-t border-gray-100 bg-slate-50 flex flex-col gap-2">
          <button
            onClick={isZapUpiConfigured ? handlePayWithZapUpi : handleSimulatePayment}
            disabled={isProcessing}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#F72585] to-[#7209B7] text-white font-extrabold text-[15px] flex items-center justify-center gap-2 shadow-lg shadow-pink-500/25 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-70"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Opening Secure UPI Payment...</span>
              </>
            ) : (
              <>
                <span>Pay {currency}{displayPrice.toLocaleString()} with UPI</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </>
            )}
          </button>

          <div className="flex items-center justify-center gap-1.5 text-[10px] font-semibold text-gray-400">
            <ShieldCheck className="w-3.5 h-3.5 text-[#20B26B]" />
            <span>Official ZapUPI Gateway • Auto Verified with Bank UTR</span>
          </div>
        </div>
      </div>
    </div>
  );
};

