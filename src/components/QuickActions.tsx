import React from 'react';
import { HelpCircle, PlayCircle, ArrowRight } from 'lucide-react';
import { WebsiteSettings } from '../types';

interface QuickActionsProps {
  settings?: WebsiteSettings;
  onOpenHowToOrder: () => void;
  onOpenSupport: () => void;
  onNavigateOrders?: () => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  settings,
  onOpenHowToOrder,
  onOpenSupport,
}) => {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 max-w-7xl mx-auto">
      <div className="grid grid-cols-2 gap-2.5 sm:gap-4 max-w-xl mx-auto">
        {/* 1. Help & Support Ticket Card (No WhatsApp) */}
        <button
          onClick={onOpenSupport}
          className="flex items-center gap-3 p-3.5 sm:p-4 rounded-2xl bg-white border border-pink-100 shadow-[0_2px_12px_rgba(247,37,133,0.06)] hover:border-pink-300 hover:shadow-md transition-all active:scale-[0.98] group cursor-pointer text-left"
        >
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-pink-50 text-[#F72585] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <HelpCircle className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-xs sm:text-sm font-black text-[#172033] leading-tight">
              Help & Support
            </h4>
            <p className="text-[10px] sm:text-xs font-bold text-[#F72585] flex items-center gap-0.5 mt-0.5">
              Create Ticket <ArrowRight className="w-3 h-3" />
            </p>
          </div>
        </button>

        {/* 2. How to Buy / Watch Guide Card */}
        <a
          href="https://youtube.com/shorts/ooX_6PNNEh0?si=PaJ1mv6RTF9FZYSz"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 p-3.5 sm:p-4 rounded-2xl bg-white border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:border-pink-300 hover:shadow-md transition-all active:scale-[0.98] group cursor-pointer text-left"
        >
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-red-50 text-red-600 group-hover:scale-105 transition-transform flex items-center justify-center shrink-0">
            <PlayCircle className="w-5 h-5 sm:w-6 sm:h-6 fill-red-100 text-red-600" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h4 className="text-xs sm:text-sm font-black text-[#172033] leading-tight">
                How to Buy
              </h4>
              <span className="text-[9px] font-black px-1.5 py-0.2 rounded-md bg-red-100 text-red-600">
                YouTube
              </span>
            </div>
            <p className="text-[10px] sm:text-xs font-bold text-gray-500 group-hover:text-[#F72585] flex items-center gap-0.5 mt-0.5">
              Watch Video <ArrowRight className="w-3 h-3" />
            </p>
          </div>
        </a>
      </div>
    </div>
  );
};
