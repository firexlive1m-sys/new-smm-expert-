import React from 'react';
import { Category } from '../types';
import { PlatformIcon } from './PlatformIcon';
import { ArrowRight, Sparkles, ShieldCheck, Zap } from 'lucide-react';

interface ServicesSectionProps {
  categories: Category[];
  onSelectCategory: (category: Category) => void;
}

export const ServicesSection: React.FC<ServicesSectionProps> = ({
  categories,
  onSelectCategory,
}) => {
  const activeCategories = categories.filter((c) => c.active);

  return (
    <section className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl mx-auto" id="services">
      {/* Section Header */}
      <div className="flex flex-col items-center text-center mb-6 sm:mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-50 border border-pink-200/80 text-[#F72585] text-xs font-black uppercase tracking-wider mb-2">
          <Sparkles className="w-3.5 h-3.5 fill-[#F72585]" />
          <span>Top Social Platforms</span>
        </div>
        <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-[#172033] tracking-tight">
          Select Your Platform to Begin
        </h3>
        <p className="text-xs sm:text-sm text-gray-500 font-semibold mt-1 max-w-lg">
          High-retention engagement, non-drop stability, and instant automated dispatch
        </p>
      </div>

      {activeCategories.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-3xl border border-gray-100 p-8 shadow-xs max-w-md mx-auto">
          <p className="text-gray-500 font-semibold text-sm">Services currently being updated.</p>
        </div>
      ) : (
        /* Responsive Grid: 1 col on mobile, 2 col on tablet, 3-4 col on desktop */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
          {activeCategories.map((category) => (
            <div
              key={category.id}
              onClick={() => onSelectCategory(category)}
              className="flex items-center justify-between p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white border border-gray-100/90 shadow-[0_2px_14px_rgba(0,0,0,0.03)] hover:border-pink-300 hover:shadow-[0_8px_24px_rgba(247,37,133,0.1)] hover:-translate-y-0.5 transition-all cursor-pointer group"
            >
              {/* Platform Logo & Details */}
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-pink-50 to-pink-100/50 border border-pink-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform overflow-hidden p-2 shadow-2xs">
                  <PlatformIcon
                    nameOrSlug={category.name}
                    imageUrl={category.imageUrl}
                    className="w-8 h-8 sm:w-9 sm:h-9"
                  />
                </div>
                <div className="min-w-0">
                  <h4 className="text-base sm:text-lg font-black text-[#172033] tracking-tight truncate group-hover:text-[#F72585] transition-colors">
                    {category.name}
                  </h4>
                  <p className="text-xs font-medium text-gray-500 truncate mt-0.5">
                    {category.description || 'Followers • Likes • Views'}
                  </p>
                </div>
              </div>

              {/* Plans CTA button */}
              <div className="shrink-0 ml-3">
                <button
                  type="button"
                  className="px-3.5 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-[#F72585] to-[#FF4FA0] text-white text-xs font-black flex items-center gap-1.5 shadow-sm shadow-pink-300/50 group-hover:shadow-pink-400 group-hover:scale-105 transition-all cursor-pointer"
                >
                  <span>Plans</span>
                  <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
