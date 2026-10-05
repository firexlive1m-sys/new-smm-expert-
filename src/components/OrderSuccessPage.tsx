import React, { useEffect, useState } from 'react';
import { Order, WebsiteSettings } from '../types';
import confetti from 'canvas-confetti';
import {
  Check,
  Copy,
  CheckCheck,
  ArrowRight,
  Clock,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

interface OrderSuccessPageProps {
  order: Order;
  settings?: WebsiteSettings;
  onViewOrders: () => void;
}

export const OrderSuccessPage: React.FC<OrderSuccessPageProps> = ({
  order,
  settings,
  onViewOrders,
}) => {
  const [copied, setCopied] = useState(false);
  const [showNotificationPopup, setShowNotificationPopup] = useState(true);

  const completionTimeText = settings?.orderCompletionTimeText || 'within 24 hours';
  const currency = order.currency || settings?.defaultCurrency || '₹';

  // Trigger celebratory confetti on mount
  useEffect(() => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.4 },
        colors: ['#F72585', '#FF4FA0', '#20B26B', '#FFD166'],
      });
    } catch {
      // safe fallback if canvas not available
    }
  }, []);

  const handleCopyId = () => {
    navigator.clipboard.writeText(order.orderId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 sm:px-6 py-8 sm:py-12 max-w-xl mx-auto flex flex-col justify-between">
      <div className="flex flex-col items-center text-center">
        {/* Animated Pink Checkmark with festive burst dots */}
        <div className="relative mb-5 mt-2">
          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-[#F72585] to-[#FF4FA0] text-white flex items-center justify-center shadow-xl shadow-pink-300/50 animate-bounce-short">
            <Check className="w-12 h-12 stroke-[3]" />
          </div>

          {/* Burst dots around circle */}
          <span className="absolute -top-2 -left-2 w-3.5 h-3.5 rounded-full bg-amber-400 animate-ping opacity-75" />
          <span className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-[#20B26B]" />
          <span className="absolute top-2 -right-3 w-2.5 h-2.5 rounded-full bg-[#FF4FA0]" />
          <span className="absolute -bottom-2 -left-2 w-2.5 h-2.5 rounded-full bg-purple-500" />
        </div>

        <h1 className="text-[22px] font-black text-[#F72585] tracking-tight">
          Order Placed Successfully!
        </h1>
        <p className="text-xs font-semibold text-gray-600 mt-1 max-w-[280px]">
          Your order is now being processed. You will start receiving the services soon.
        </p>

        {/* Order Details Card */}
        <div className="w-full mt-6 p-4 rounded-3xl bg-white border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.04)] text-left">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <span className="text-[12px] font-black uppercase tracking-wider text-[#172033]">
              Order Details
            </span>
            <div className="flex items-center gap-1">
              <span className="text-xs font-black text-[#F72585]">{order.orderId}</span>
              <button
                onClick={handleCopyId}
                title="Copy Order ID"
                className="p-1 rounded-md hover:bg-pink-50 text-gray-400 hover:text-[#F72585] transition-colors cursor-pointer"
              >
                {copied ? (
                  <CheckCheck className="w-3.5 h-3.5 text-[#20B26B]" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          <div className="mt-3.5 space-y-2.5 text-xs font-semibold">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Service</span>
              <span className="text-[#172033] font-bold text-right">
                {order.quantity.toLocaleString()} {order.categoryName} {order.serviceName}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-400">Account Link</span>
              <a
                href={order.targetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline truncate max-w-[190px] flex items-center gap-1 font-mono text-[11px]"
              >
                {order.targetUrl}
                <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-400">Amount</span>
              <span className="text-[#172033] font-black text-[13px]">
                {currency}{order.amount.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-400">Date</span>
              <span className="text-[#172033]">{formatDate(order.createdAt)}</span>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-gray-400">Status</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-50 text-[#20B26B] border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-[#20B26B] animate-pulse" />
                {order.orderStatus}
              </span>
            </div>
          </div>
        </div>

        {/* View Orders CTA */}
        <button
          onClick={onViewOrders}
          className="w-full mt-6 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#F72585] to-[#FF4FA0] text-white font-extrabold text-[15px] flex items-center justify-center gap-2 shadow-lg shadow-pink-300/40 hover:shadow-pink-400 active:scale-[0.98] transition-all cursor-pointer"
        >
          <span>View My Orders</span>
          <ArrowRight className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>

      {/* Mandatory Immediate Success Notification Modal */}
      {showNotificationPopup && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-pink-100 text-center animate-scale-in">
            <div className="w-12 h-12 rounded-full bg-pink-100 text-[#F72585] flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-6 h-6 fill-[#F72585]" />
            </div>

            <h3 className="text-base font-black text-[#172033]">Order Confirmed!</h3>
            <p className="text-xs font-bold text-gray-700 mt-2 leading-relaxed">
              Your order has been placed successfully.
              <br />
              <span className="text-[#F72585]">
                Your order will be completed {completionTimeText}.
              </span>
            </p>

            <button
              onClick={() => setShowNotificationPopup(false)}
              className="mt-4 w-full py-2.5 rounded-xl bg-[#F72585] text-white font-bold text-xs shadow-md active:scale-95 cursor-pointer"
            >
              Got it, thanks!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
