import React from 'react';
import { Home, Layers, ShoppingBag, HelpCircle } from 'lucide-react';

interface BottomNavigationProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  currentView,
  onNavigate,
}) => {
  const tabs = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
    },
    {
      id: 'services',
      label: 'Services',
      icon: Layers,
    },
    {
      id: 'orders',
      label: 'Orders',
      icon: ShoppingBag,
    },
    {
      id: 'support',
      label: 'Help',
      icon: HelpCircle,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/95 backdrop-blur-md border-t border-pink-100 shadow-[0_-4px_24px_rgba(247,37,133,0.06)] px-3 py-2 transition-all">
      <div className="max-w-md mx-auto grid grid-cols-4 gap-1 items-center">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentView === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onNavigate(tab.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-all duration-200 cursor-pointer active:scale-95 ${
                isActive
                  ? 'text-[#F72585] bg-pink-50/80 font-black shadow-2xs'
                  : 'text-gray-400 hover:text-gray-700 font-semibold'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? 'scale-110 stroke-[2.4]' : 'stroke-[1.9]'
                  }`}
                />
                {isActive && (
                  <span className="absolute -top-0.5 -right-1 w-1.5 h-1.5 bg-[#F72585] rounded-full ring-2 ring-white" />
                )}
              </div>
              <span
                className={`text-[11px] tracking-tight mt-1 transition-colors ${
                  isActive ? 'text-[#F72585] font-black' : 'text-gray-500 font-semibold'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
