import React, { useState, useEffect } from 'react';
import { Banner } from '../types';
import { ChevronRight, ChevronLeft, Sparkles, TrendingUp } from 'lucide-react';

interface HeroSliderProps {
  banners: Banner[];
  onBannerClick?: (banner: Banner) => void;
  autoSlideInterval?: number;
}

export const HeroSlider: React.FC<HeroSliderProps> = ({
  banners,
  onBannerClick,
  autoSlideInterval = 4,
}) => {
  const activeBanners = banners.filter((b) => b.active);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (activeBanners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
    }, autoSlideInterval * 1000);
    return () => clearInterval(interval);
  }, [activeBanners.length, autoSlideInterval]);

  if (activeBanners.length === 0) {
    return null;
  }

  const current = activeBanners[currentIndex] || activeBanners[0];

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + activeBanners.length) % activeBanners.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
  };

  return (
    <div className="relative px-4 sm:px-6 lg:px-8 pt-3 sm:pt-5 pb-2 max-w-7xl mx-auto group">
      {/* Desktop Prev / Next Carousel Controls */}
      {activeBanners.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            aria-label="Previous banner"
            className="hidden md:flex absolute left-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/95 hover:bg-white text-gray-700 hover:text-[#F72585] shadow-lg items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer hover:scale-105"
          >
            <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
          </button>
          <button
            onClick={handleNext}
            aria-label="Next banner"
            className="hidden md:flex absolute right-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/95 hover:bg-white text-gray-700 hover:text-[#F72585] shadow-lg items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer hover:scale-105"
          >
            <ChevronRight className="w-5 h-5 stroke-[2.5]" />
          </button>
        </>
      )}

      {/* Case 1: Image URL provided - Full Graphic Banner Poster */}
      {current.imageUrl ? (
        <div
          onClick={() => onBannerClick && onBannerClick(current)}
          className="relative overflow-hidden rounded-3xl border border-pink-200/80 shadow-[0_4px_24px_rgba(247,37,133,0.08)] cursor-pointer group/card bg-black"
        >
          <img
            src={current.imageUrl}
            alt={current.title || 'Promotional Banner'}
            className="w-full h-44 sm:h-60 md:h-72 lg:h-84 object-cover rounded-3xl transition-transform duration-300 group-hover/card:scale-[1.01]"
          />

          {/* Floating Action Button on corner if buttonText provided */}
          {current.buttonText && (
            <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 z-10">
              <span className="px-4 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-[#F72585] to-[#FF4FA0] text-white text-xs sm:text-sm font-black rounded-xl shadow-lg flex items-center gap-1.5 hover:scale-105 transition-all">
                {current.buttonText}
                <ChevronRight className="w-4 h-4 stroke-[2.5]" />
              </span>
            </div>
          )}

          {/* Top badges if set */}
          {(current.badgeText || current.discountBadge) && (
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
              {current.badgeText && (
                <span className="text-[10px] sm:text-xs font-black uppercase text-white bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
                  {current.badgeText}
                </span>
              )}
              {current.discountBadge && (
                <span className="text-[10px] sm:text-xs font-black uppercase text-white bg-[#F72585] px-2.5 py-1 rounded-lg shadow-sm">
                  {current.discountBadge}
                </span>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Case 2: No Image URL - Rich Stylized Typography Banner */
        <div
          onClick={() => onBannerClick && onBannerClick(current)}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-pink-50 via-white to-pink-100/70 border border-pink-200/80 p-5 sm:p-7 md:p-9 shadow-[0_4px_24px_rgba(247,37,133,0.07)] cursor-pointer"
        >
          {/* Background glow & subtle graphics */}
          <div className="absolute -top-16 -right-16 w-56 h-56 bg-[#F72585]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-[#FF4FA0]/10 rounded-full blur-2xl pointer-events-none" />

          {/* Top Badges Row */}
          <div className="flex items-center justify-between gap-2 mb-3">
            {current.badgeText && (
              <span className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-black uppercase tracking-wider text-[#F72585] bg-pink-100/90 border border-pink-200/80 px-3 py-1 rounded-full shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 fill-[#F72585]" />
                {current.badgeText}
              </span>
            )}

            {current.discountBadge && (
              <span className="inline-flex items-center text-[11px] sm:text-xs font-black uppercase text-white bg-gradient-to-r from-[#F72585] to-[#FF4FA0] px-3 py-1 rounded-xl shadow-xs shadow-pink-300">
                {current.discountBadge}
              </span>
            )}
          </div>

          {/* Content Body */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 md:gap-8">
            <div className="flex-1 z-10">
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-[#172033] leading-[1.15] tracking-tight uppercase">
                {current.title}
              </h2>
              <p className="text-xs sm:text-sm md:text-base font-semibold text-gray-600 mt-2 max-w-2xl leading-relaxed">
                {current.subtitle}
              </p>

              {/* Platform indicators strip */}
              <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 mt-4">
                <div className="flex -space-x-1.5 items-center">
                  <span className="w-6 h-6 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 flex items-center justify-center text-[10px] text-white font-black ring-2 ring-white">
                    IG
                  </span>
                  <span className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center text-[10px] text-white font-black ring-2 ring-white">
                    YT
                  </span>
                  <span className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-[10px] text-white font-black ring-2 ring-white">
                    FB
                  </span>
                  <span className="w-6 h-6 rounded-full bg-sky-500 flex items-center justify-center text-[10px] text-white font-black ring-2 ring-white">
                    TG
                  </span>
                </div>
                <span className="text-[11px] sm:text-xs font-bold text-[#20B26B] bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  ● Live Instant Dispatch
                </span>
                <span className="hidden sm:inline-flex text-[11px] sm:text-xs font-bold text-gray-500 bg-white/80 px-2.5 py-0.5 rounded-full border border-gray-200">
                  No Password Required
                </span>
              </div>

              {current.buttonText && (
                <div className="mt-4 sm:mt-5">
                  <button
                    type="button"
                    className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-[#F72585] to-[#FF4FA0] text-white text-xs sm:text-sm font-black rounded-xl inline-flex items-center justify-center gap-1.5 shadow-md shadow-pink-300 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <span>{current.buttonText}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Right Graphic */}
            <div className="relative shrink-0 self-center sm:self-auto w-24 h-24 sm:w-36 sm:h-36 md:w-44 md:h-44 lg:w-52 lg:h-52 flex items-center justify-center">
              <div className="w-full h-full rounded-3xl bg-gradient-to-tr from-[#F72585] to-[#FF4FA0] text-white flex flex-col items-center justify-center shadow-xl shadow-pink-300/50 p-4">
                <TrendingUp className="w-10 h-10 sm:w-14 sm:h-14 stroke-[2.5]" />
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest mt-1">GROWTH</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Slide Dots */}
      {activeBanners.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-2.5">
          {activeBanners.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                idx === currentIndex ? 'w-7 bg-[#F72585]' : 'w-2.5 bg-pink-200 hover:bg-pink-300'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
