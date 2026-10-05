import React from 'react';
import { X, LayoutGrid, FileEdit, CreditCard, Rocket, CheckCircle2, PlayCircle, ExternalLink } from 'lucide-react';

interface HowToOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowToOrderModal: React.FC<HowToOrderModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const steps = [
    {
      num: 1,
      title: 'Choose Service',
      desc: 'Select your desired service and plan from Instagram, YouTube, Facebook or any platform.',
      icon: <LayoutGrid className="w-5 h-5 text-[#F72585]" />,
    },
    {
      num: 2,
      title: 'Fill Details',
      desc: 'Enter your name, mobile number and account/profile or post link. No login or password required!',
      icon: <FileEdit className="w-5 h-5 text-[#FF4FA0]" />,
    },
    {
      num: 3,
      title: 'Proceed to Pay',
      desc: 'Complete the payment securely via Google Pay, PhonePe, Paytm, UPI, Cards or NetBanking.',
      icon: <CreditCard className="w-5 h-5 text-[#20B26B]" />,
    },
    {
      num: 4,
      title: 'Get Instant Delivery',
      desc: 'Your order is processed instantly and you will begin receiving real social engagement.',
      icon: <Rocket className="w-5 h-5 text-[#F72585]" />,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-lg sm:max-w-xl bg-white rounded-3xl p-6 shadow-2xl border border-pink-100 max-h-[90vh] overflow-y-auto animate-scale-in">
        <div className="flex items-center justify-between pb-3.5 border-b border-gray-100">
          <div>
            <h3 className="text-base sm:text-lg font-black text-[#172033]">How to Order</h3>
            <p className="text-xs text-gray-400 font-semibold">
              4 simple steps to boost your social media
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Official YouTube Short Video Guide Card */}
        <a
          href="https://youtube.com/shorts/ooX_6PNNEh0?si=PaJ1mv6RTF9FZYSz"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3.5 flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-red-500/10 via-red-500/5 to-pink-500/10 border border-red-200 hover:border-red-300 transition-all group shadow-2xs"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-md shadow-red-500/25 group-hover:scale-105 transition-transform shrink-0">
              <PlayCircle className="w-6 h-6 fill-white text-red-600" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs sm:text-sm font-black text-[#172033]">
                  Watch Video Tutorial
                </span>
                <span className="text-[9px] font-black px-1.5 py-0.2 rounded-md bg-red-600 text-white">
                  SHORTS
                </span>
              </div>
              <p className="text-[11px] text-gray-500 font-medium">
                Step-by-step video on how to buy and order
              </p>
            </div>
          </div>
          <span className="text-[11px] font-black text-red-600 bg-white border border-red-200 px-3 py-1.5 rounded-xl shadow-2xs group-hover:bg-red-600 group-hover:text-white transition-all flex items-center gap-1 shrink-0">
            <span>Watch</span>
            <ExternalLink className="w-3 h-3" />
          </span>
        </a>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {steps.map((step) => (
            <div
              key={step.num}
              className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-pink-50/40 border border-pink-100/70"
            >
              <div className="w-9 h-9 rounded-xl bg-white border border-pink-200 text-[#F72585] flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
                {step.num}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-extrabold text-[#172033]">{step.title}</h4>
                  <div className="p-1 rounded-lg bg-white shadow-2xs">{step.icon}</div>
                </div>
                <p className="text-[11px] text-gray-600 font-medium mt-1 leading-snug">
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 pt-3 border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-[#F72585] text-white font-extrabold text-xs shadow-md shadow-pink-200 active:scale-95 cursor-pointer"
          >
            Got it, Let's Order!
          </button>
        </div>
      </div>
    </div>
  );
};
