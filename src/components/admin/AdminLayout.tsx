import React, { useState } from 'react';
import { logoutAdmin } from '../../lib/adminAuth';
import {
  LayoutDashboard,
  ShoppingBag,
  Layers,
  Sparkles,
  Percent,
  Image as ImageIcon,
  Ticket,
  Settings,
  LogOut,
  ExternalLink,
  Zap,
  Menu,
  X,
  ListOrdered,
} from 'lucide-react';

interface AdminLayoutProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  onViewSite: () => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentTab,
  onTabChange,
  onViewSite,
  children,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'orders', label: 'Orders', icon: <ShoppingBag className="w-4 h-4" /> },
    { id: 'categories', label: 'Categories', icon: <Layers className="w-4 h-4" /> },
    { id: 'services', label: 'Services', icon: <ListOrdered className="w-4 h-4" /> },
    { id: 'plans', label: 'Plans', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'offers', label: 'Offers', icon: <Percent className="w-4 h-4" /> },
    { id: 'banners', label: 'Banners', icon: <ImageIcon className="w-4 h-4" /> },
    { id: 'tickets', label: 'Tickets', icon: <Ticket className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  const handleSelectTab = (id: string) => {
    onTabChange(id);
    setMobileMenuOpen(false);
  };

  const handleLogout = () => {
    logoutAdmin();
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col md:flex-row">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-950 border-r border-slate-800 p-4 shrink-0 justify-between">
        <div>
          {/* Admin Header */}
          <div className="flex items-center gap-2.5 pb-6 mb-6 border-b border-slate-800/80">
            <img
              src="https://i.ibb.co/dsQxmK1G/file-0000000085c881f4b687018bdb77e122.png"
              alt="SkyRocket"
              className="w-9 h-9 rounded-xl object-cover shadow-md shadow-pink-500/30"
            />
            <div>
              <div className="flex items-baseline">
                <span className="font-black text-lg text-white">Sky</span>
                <span className="font-black text-lg text-[#F72585]">Rocket</span>
              </div>
              <span className="text-[10px] uppercase font-bold text-pink-400 tracking-wider">
                Admin Panel
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  currentTab === item.id
                    ? 'bg-[#F72585] text-white shadow-md shadow-pink-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="pt-4 border-t border-slate-800/80 space-y-2">
          <button
            onClick={onViewSite}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-850 transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5 text-[#F72585]" />
              View Customer Site
            </span>
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-950/30 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <div className="md:hidden sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img
            src="https://i.ibb.co/dsQxmK1G/file-0000000085c881f4b687018bdb77e122.png"
            alt="SkyRocket"
            className="w-7 h-7 rounded-lg object-cover"
          />
          <span className="font-extrabold text-sm text-white">SkyRocket Admin</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onViewSite}
            className="p-1.5 rounded-lg bg-slate-900 text-slate-300 text-xs flex items-center gap-1 font-bold"
          >
            <ExternalLink className="w-3.5 h-3.5 text-[#F72585]" />
            Site
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg bg-slate-900 text-slate-300"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-950 border-b border-slate-800 p-4 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleSelectTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold ${
                currentTab === item.id
                  ? 'bg-[#F72585] text-white'
                  : 'text-slate-400 hover:bg-slate-900'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-red-400 pt-2 border-t border-slate-800"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out</span>
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 bg-slate-900 overflow-y-auto p-4 md:p-8">
        <div className="max-w-6xl mx-auto">{children}</div>
      </main>
    </div>
  );
};
