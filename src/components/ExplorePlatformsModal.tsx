import React from 'react';
import { Category } from '../types';
import { PlatformIcon } from './PlatformIcon';
import { ArrowLeft, Sparkles, X } from 'lucide-react';

interface ExplorePlatformsModalProps {
  isOpen: boolean;
  categories: Category[];
  onClose: () => void;
  onSelectCategory: (category: Category) => void;
}

export const ExplorePlatformsModal: React.FC<ExplorePlatformsModalProps> = ({
  isOpen,
  categories,
  onClose,
  onSelectCategory,
}) => {
  if (!isOpen) return null;

  const activeCategories = categories.filter((c) => c.active);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-lg sm:max-w-2xl bg-white rounded-3xl p-6 shadow-2xl border border-pink-100 max-h-[90vh] overflow-y-auto animate-scale-in">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div>
            <h3 className="text-base font-black text-[#172033] flex items-center gap-1.5">
              <span>Explore Platforms</span>
              <Sparkles className="w-4 h-4 text-[#F72585] fill-[#F72585]" />
            </h3>
            <p className="text-[11px] text-gray-400 font-semibold">
              Tap any platform to view plans
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {activeCategories.length === 0 ? (
          <div className="py-8 text-center text-gray-400 font-semibold text-xs">
            No platforms added yet. Add platforms from the Admin Panel.
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-3 gap-3">
            {activeCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => {
                  onClose();
                  onSelectCategory(category);
                }}
                className="p-3.5 rounded-2xl bg-slate-50 hover:bg-pink-50/60 border border-gray-100 hover:border-pink-200 flex flex-col items-center justify-center gap-2 transition-all active:scale-95 group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-2xl bg-white shadow-xs border border-gray-100 flex items-center justify-center p-2 group-hover:scale-105 transition-transform">
                  <PlatformIcon
                    nameOrSlug={category.name}
                    imageUrl={category.imageUrl}
                    className="w-8 h-8"
                  />
                </div>
                <span className="text-xs font-black text-[#172033] text-center truncate w-full">
                  {category.name}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
