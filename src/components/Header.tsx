import React, { useState } from 'react';
import {
  Zap,
  Menu,
  X,
  ArrowLeft,
  HelpCircle,
  ShoppingBag,
  Home,
  Layers,
  PlayCircle,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import { WebsiteSettings } from '../types';

interface HeaderProps {
  settings?: WebsiteSettings;
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  currentView?: string;
  onNavigate?: (view: string, data?: any) => void;
  onOpenHowToOrder?: () => void;
  onOpenSupport?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  title,
  subtitle,
  showBack,
  onBack,
  currentView = 'home',
  onNavigate,
  onOpenHowToOrder,
  onOpenSupport,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const brandName = settings?.websiteName || 'swiftSMM';
  const brandSubtitle = settings?.subtitle || 'SOCIAL GROWTH PANEL';

  const handleNavClick = (view: string) => {
    setMenuOpen(false);
    if (onNavigate) {
      onNavigate(view);
    }
  };

  return (
    <>
      <header className="bg-white border-b border-pink-100/80 shadow-[0_2px_12px_rgba(247,37,133,0.04)] px-4 sm:px-6 lg:px-8 py-3 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Left: Brand Logo & Title */}
          <div className="flex items-center gap-3">
            {showBack && onBack ? (
              <button
                onClick={onBack}
                aria-label="Go back"
                className="w-9 h-9 rounded-full bg-pink-50 hover:bg-pink-100 text-[#F72585] flex items-center justify-center transition-colors active:scale-95 cursor-pointer -ml-1"
              >
                <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
              </button>
            ) : null}

            {title ? (
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#F72585] to-[#FF4FA0] text-white flex items-center justify-center shadow-sm shadow-pink-200">
                  <Zap className="w-4 h-4 fill-white" />
                </div>
                <div>
                  <h1 className="font-black text-lg md:text-xl text-[#172033] leading-tight flex items-center gap-1.5">
                    {title}
                  </h1>
                  {subtitle && (
                    <p className="text-[10px] md:text-xs uppercase font-extrabold text-gray-400 tracking-wider">
                      {subtitle}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <button
                onClick={() => handleNavClick('home')}
                className="flex items-center gap-2.5 text-left cursor-pointer group"
              >
                <img
                  src={settings?.logoUrl || 'https://i.ibb.co/dsQxmK1G/file-0000000085c881f4b687018bdb77e122.png'}
                  alt={brandName}
                  className="w-9 h-9 md:w-10 md:h-10 rounded-2xl object-cover shadow-md shadow-pink-300/30 group-hover:scale-105 transition-transform"
                />
                <div>
                  <div className="flex items-baseline">
                    <span className="font-black text-xl md:text-2xl text-[#172033] tracking-tight">Sky</span>
                    <span className="font-black text-xl md:text-2xl text-[#F72585] tracking-tight">Rocket</span>
                  </div>
                  <p className="text-[9px] md:text-[10px] uppercase font-black text-gray-400 tracking-[0.16em] -mt-0.5">
                    {brandSubtitle}
                  </p>
                </div>
              </button>
            )}
          </div>

          {/* Center Navigation Links: Tablet & Desktop Only */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            <button
              onClick={() => handleNavClick('home')}
              className={`px-3.5 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                currentView === 'home'
                  ? 'bg-pink-50 text-[#F72585]'
                  : 'text-gray-600 hover:text-[#172033] hover:bg-slate-50'
              }`}
            >
              Home
            </button>

            <button
              onClick={() => handleNavClick('services')}
              className={`px-3.5 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                currentView === 'services'
                  ? 'bg-pink-50 text-[#F72585]'
                  : 'text-gray-600 hover:text-[#172033] hover:bg-slate-50'
              }`}
            >
              All Services
            </button>

            <button
              onClick={() => handleNavClick('orders')}
              className={`px-3.5 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                currentView === 'orders'
                  ? 'bg-pink-50 text-[#F72585]'
                  : 'text-gray-600 hover:text-[#172033] hover:bg-slate-50'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Track Orders</span>
            </button>

            <button
              onClick={() => {
                if (onOpenSupport) onOpenSupport();
                else handleNavClick('support');
              }}
              className={`px-3.5 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                currentView === 'support'
                  ? 'bg-pink-50 text-[#F72585]'
                  : 'text-gray-600 hover:text-[#172033] hover:bg-slate-50'
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              <span>Help Center</span>
            </button>
          </nav>

          {/* Right Controls: Desktop Action Buttons & Mobile Hamburger */}
          <div className="flex items-center gap-2.5">
            {/* Desktop: How to Buy Guide button */}
            <button
              onClick={onOpenHowToOrder}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-gray-600 hover:text-[#F72585] hover:bg-pink-50/60 border border-gray-200/80 transition-all cursor-pointer"
            >
              <PlayCircle className="w-4 h-4 text-[#F72585]" />
              <span>How to Order</span>
            </button>

            {/* Desktop CTA: Instant Order button */}
            <button
              onClick={() => handleNavClick('services')}
              className="hidden lg:flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#F72585] to-[#FF4FA0] text-white text-xs font-black shadow-sm shadow-pink-200 hover:shadow-md hover:scale-[1.02] transition-all cursor-pointer"
            >
              <span>Explore Plans</span>
            </button>

            {/* Mobile Hamburger Menu Toggle */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Open menu"
              className="md:hidden w-9 h-9 rounded-xl border border-gray-200 hover:border-pink-300 text-gray-700 hover:text-[#F72585] hover:bg-pink-50/50 flex items-center justify-center transition-all cursor-pointer active:scale-95"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5 stroke-[2.2]" />}
            </button>
          </div>
        </div>
      </header>

      {/* Slide-out Menu Drawer for Mobile screens */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-end md:hidden animate-fade-in">
          <div className="w-72 sm:w-80 bg-white h-full shadow-2xl flex flex-col p-5 animate-slide-left">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <img
                  src={settings?.logoUrl || 'https://i.ibb.co/dsQxmK1G/file-0000000085c881f4b687018bdb77e122.png'}
                  alt={brandName}
                  className="w-8 h-8 rounded-xl object-cover shadow-xs"
                />
                <span className="font-extrabold text-[#172033] text-lg">Sky<span className="text-[#F72585]">Rocket</span></span>
              </div>
              <button
                onClick={() => setMenuOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <nav className="mt-4 flex flex-col gap-1.5 flex-1">
              <button
                onClick={() => handleNavClick('home')}
                className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-bold transition-colors text-left ${
                  currentView === 'home'
                    ? 'bg-pink-50 text-[#F72585]'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Home className="w-4.5 h-4.5 text-[#F72585]" />
                Home
              </button>

              <button
                onClick={() => handleNavClick('services')}
                className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-bold transition-colors text-left ${
                  currentView === 'services'
                    ? 'bg-pink-50 text-[#F72585]'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Layers className="w-4.5 h-4.5 text-[#F72585]" />
                All Services
              </button>

              <button
                onClick={() => handleNavClick('orders')}
                className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-bold transition-colors text-left ${
                  currentView === 'orders'
                    ? 'bg-pink-50 text-[#F72585]'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <ShoppingBag className="w-4.5 h-4.5 text-[#F72585]" />
                Track Orders
              </button>

              <button
                onClick={() => {
                  setMenuOpen(false);
                  if (onOpenSupport) onOpenSupport();
                  else handleNavClick('support');
                }}
                className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-bold transition-colors text-left ${
                  currentView === 'support'
                    ? 'bg-pink-50 text-[#F72585]'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <HelpCircle className="w-4.5 h-4.5 text-[#F72585]" />
                Help & Support Center
              </button>

              <button
                onClick={() => {
                  setMenuOpen(false);
                  if (onOpenHowToOrder) onOpenHowToOrder();
                }}
                className="flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors text-left"
              >
                <PlayCircle className="w-4.5 h-4.5 text-[#FF4FA0]" />
                How to Order (4 Steps)
              </button>
            </nav>

            {/* Footer of drawer */}
            <div className="pt-4 border-t border-gray-100">
              <p className="text-[11px] font-bold text-gray-500 text-center">
                swiftSMM • Social Growth Panel
              </p>
              <p className="text-[10px] text-gray-400 text-center mt-1">
                Fast Automated Dispatch • 24x7 Support
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
