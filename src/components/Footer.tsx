import React from 'react';
import { Zap, ShieldCheck, Lock, Headphones, Clock, ArrowRight } from 'lucide-react';
import { WebsiteSettings } from '../types';

interface FooterProps {
  settings?: WebsiteSettings;
  onNavigate: (view: string) => void;
  onOpenHowToOrder: () => void;
  onOpenSupport: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  settings,
  onNavigate,
  onOpenHowToOrder,
  onOpenSupport,
}) => {
  const brandName = settings?.websiteName || 'swiftSMM';
  const brandSubtitle = settings?.subtitle || 'SOCIAL GROWTH PANEL';

  return (
    <footer className="bg-white border-t border-pink-100/80 pt-10 sm:pt-14 pb-16 md:pb-10 transition-all text-[#172033]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12 pb-10 border-b border-gray-100">
          {/* Brand Info (Cols 1 to 5 on Desktop) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <img
                src={settings?.logoUrl || 'https://i.ibb.co/dsQxmK1G/file-0000000085c881f4b687018bdb77e122.png'}
                alt={brandName}
                className="w-10 h-10 rounded-2xl object-cover shadow-md shadow-pink-300/40"
              />
              <div>
                <div className="flex items-baseline">
                  <span className="font-black text-2xl text-[#172033] tracking-tight">Sky</span>
                  <span className="font-black text-2xl text-[#F72585] tracking-tight">Rocket</span>
                </div>
                <p className="text-[10px] uppercase font-black text-gray-400 tracking-[0.16em] -mt-0.5">
                  {brandSubtitle}
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-gray-500 font-medium max-w-sm leading-relaxed">
              India's premier high-retention social media growth panel. Instant automated start, non-drop stability, and 24x7 ticket assistance with no password required.
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-[#20B26B] border border-emerald-200 text-xs font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                100% Safe Public Links
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-50 text-[#F72585] border border-pink-200 text-xs font-bold">
                <Clock className="w-3.5 h-3.5" />
                5–15 Min Start
              </span>
            </div>
          </div>

          {/* Quick Links (Cols 6 to 8) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-gray-400">
              Quick Navigation
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm font-bold text-gray-600">
              <li>
                <button
                  onClick={() => onNavigate('home')}
                  className="hover:text-[#F72585] transition-colors cursor-pointer"
                >
                  Home
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('services')}
                  className="hover:text-[#F72585] transition-colors cursor-pointer"
                >
                  All Services
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('orders')}
                  className="hover:text-[#F72585] transition-colors cursor-pointer"
                >
                  Track My Orders
                </button>
              </li>
              <li>
                <a
                  href="https://youtube.com/shorts/ooX_6PNNEh0?si=PaJ1mv6RTF9FZYSz"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#F72585] transition-colors cursor-pointer inline-flex items-center gap-1"
                >
                  <span>How to Buy (Video Guide)</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-red-100 text-red-600 font-black">YouTube</span>
                </a>
              </li>
              <li>
                <button
                  onClick={onOpenSupport}
                  className="hover:text-[#F72585] transition-colors cursor-pointer"
                >
                  Help & Support Center
                </button>
              </li>
            </ul>
          </div>

          {/* Support & Security (Cols 9 to 12) */}
          <div className="lg:col-span-4 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-gray-400">
              Security & Payment
            </h4>
            <p className="text-xs sm:text-sm text-gray-500 font-medium leading-relaxed">
              We process payments through verified UPI infrastructure. We will never ask for your account credentials or sensitive passwords.
            </p>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-pink-50 text-[#F72585] flex items-center justify-center">
                  <Headphones className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-black text-[#172033] block">Need Assistance?</span>
                  <span className="text-[11px] text-gray-400">Our team resolves tickets 24x7</span>
                </div>
              </div>
              <button
                onClick={onOpenSupport}
                className="px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-xs font-bold text-[#F72585] hover:border-pink-300 transition-colors cursor-pointer"
              >
                Open Ticket
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-400 font-medium">
          <p>© {new Date().getFullYear()} {brandName}. All rights reserved.</p>

          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-[11px] text-gray-500 font-bold">
              <Lock className="w-3 h-3 text-emerald-600" />
              Verified UPI & Cards
            </span>
            <span className="text-gray-300">•</span>
            <span className="text-gray-400 text-[11px] font-bold">
              100% Safe Social Growth
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
