import React, { useState, useEffect } from 'react';
import { WebsiteSettings } from '../../types';
import { dbService } from '../../lib/db';
import { fetchProviderBalance } from '../../lib/providerService';
import {
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  ShieldCheck,
  Zap,
  Wallet,
  Eye,
  EyeOff,
  ExternalLink,
} from 'lucide-react';

interface AdminSettingsProps {
  onSettingsUpdated?: () => void;
}

export const AdminSettings: React.FC<AdminSettingsProps> = ({ onSettingsUpdated }) => {
  const [settings, setSettings] = useState<WebsiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // SMM Provider State
  const [showApiKey, setShowApiKey] = useState(false);
  const [checkingBalance, setCheckingBalance] = useState(false);
  const [balanceInfo, setBalanceInfo] = useState<{ balance: string; currency: string } | null>(null);
  const [balanceError, setBalanceError] = useState<string | null>(null);

  const loadSettings = async () => {
    const s = await dbService.getSettings();
    setSettings(s);
    if (s.providerBalance) {
      setBalanceInfo({
        balance: s.providerBalance,
        currency: s.providerCurrency || 'USD',
      });
    }
    setLoading(false);
  };

  const handleCheckBalance = async () => {
    if (!settings?.providerApiKey?.trim()) {
      setBalanceError('Please enter your SMM Provider API Key first.');
      return;
    }
    setCheckingBalance(true);
    setBalanceError(null);

    const res = await fetchProviderBalance(
      settings.providerApiUrl || 'https://smmxpert.in/api/v2',
      settings.providerApiKey
    );

    setCheckingBalance(false);
    if (res.success && res.balance) {
      const info = { balance: res.balance, currency: res.currency || 'USD' };
      setBalanceInfo(info);
      setSettings((prev) =>
        prev
          ? {
              ...prev,
              providerBalance: info.balance,
              providerCurrency: info.currency,
            }
          : prev
      );
    } else {
      setBalanceError(res.error || 'Failed to fetch provider balance');
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    await dbService.updateSettings(settings);
    setSavedSuccess(true);
    if (onSettingsUpdated) onSettingsUpdated();
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleClearAllData = async () => {
    if (
      confirm(
        'Are you sure you want to clear all data (categories, services, plans, offers, banners)? You will be able to add everything fresh.'
      )
    ) {
      await dbService.clearAllDemoData();
      if (onSettingsUpdated) onSettingsUpdated();
      alert('All demo data cleared! You can now add your own categories, plans, and offers.');
    }
  };

  if (loading || !settings) {
    return <div className="p-8 text-center text-slate-400">Loading settings...</div>;
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="pb-4 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white">Global Settings</h1>
          <p className="text-xs text-slate-400">
            Configure branding, WhatsApp support links, delivery times, and currency.
          </p>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-700 text-[#20B26B] text-xs font-bold animate-fade-in">
            <CheckCircle className="w-4 h-4" />
            <span>Settings saved successfully!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Branding */}
        <div className="p-5 rounded-3xl bg-slate-800/80 border border-slate-700/70 space-y-4">
          <h3 className="text-sm font-black text-white uppercase tracking-wider">
            Brand & Identity
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Brand Name</label>
              <input
                type="text"
                value={settings.websiteName}
                onChange={(e) => setSettings({ ...settings, websiteName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-[#F72585]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Subtitle</label>
              <input
                type="text"
                value={settings.subtitle}
                onChange={(e) => setSettings({ ...settings, subtitle: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-[#F72585]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Default Currency Symbol
              </label>
              <input
                type="text"
                value={settings.defaultCurrency}
                onChange={(e) => setSettings({ ...settings, defaultCurrency: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-[#F72585]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Order Completion Time Text
              </label>
              <input
                type="text"
                value={settings.orderCompletionTimeText}
                onChange={(e) => setSettings({ ...settings, orderCompletionTimeText: e.target.value })}
                placeholder="within 24 hours"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-[#F72585]"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Shown to customer on checkout confirmation modal (e.g. "within 24 hours").
              </span>
            </div>
          </div>
        </div>

        {/* WhatsApp & Support */}
        <div className="p-5 rounded-3xl bg-slate-800/80 border border-slate-700/70 space-y-4">
          <h3 className="text-sm font-black text-white uppercase tracking-wider">
            WhatsApp & Support Integration
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                WhatsApp Support Number
              </label>
              <input
                type="text"
                value={settings.supportWhatsAppNumber}
                onChange={(e) => setSettings({ ...settings, supportWhatsAppNumber: e.target.value })}
                placeholder="+919876543210"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-[#F72585]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Direct WhatsApp Chat Link
              </label>
              <input
                type="text"
                value={settings.supportWhatsAppLink}
                onChange={(e) => setSettings({ ...settings, supportWhatsAppLink: e.target.value })}
                placeholder="https://wa.me/919876543210..."
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-[#F72585]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Support Helper Text
            </label>
            <input
              type="text"
              value={settings.supportText || ''}
              onChange={(e) => setSettings({ ...settings, supportText: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-[#F72585]"
            />
          </div>
        </div>

        {/* SMM Provider API Configuration */}
        <div className="p-5 rounded-3xl bg-slate-800/80 border border-purple-900/50 shadow-lg shadow-purple-950/20 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#F72585] to-purple-600 flex items-center justify-center text-white">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                  SMM Provider API (Auto Fulfillment)
                </h3>
                <p className="text-[11px] text-slate-400">
                  Connect to smmxpert.in or any SMM v2 API to automate order delivery
                </p>
              </div>
            </div>

            <a
              href="https://smmxpert.in"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1"
            >
              <span>smmxpert.in</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Provider API Endpoint URL
              </label>
              <input
                type="text"
                value={settings.providerApiUrl || 'https://smmxpert.in/api/v2'}
                onChange={(e) => setSettings({ ...settings, providerApiUrl: e.target.value })}
                placeholder="https://smmxpert.in/api/v2"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-purple-500"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Standard v2 API URL (e.g. https://smmxpert.in/api/v2)
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Provider API Key
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={settings.providerApiKey || ''}
                  onChange={(e) => setSettings({ ...settings, providerApiKey: e.target.value })}
                  placeholder="Enter API key from Account page"
                  className="w-full pl-3 pr-9 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-purple-500"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Get this key from your smmxpert.in &gt; Account &gt; Generate API Key
              </span>
            </div>
          </div>

          {/* Auto Order Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/90 border border-slate-700">
            <div>
              <span className="text-xs font-bold text-white block">
                Automatic Order Placement
              </span>
              <span className="text-[11px] text-slate-400 block mt-0.5">
                Automatically push order to SMM provider as soon as customer payment is verified
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(settings.providerAutoOrder)}
                onChange={(e) => setSettings({ ...settings, providerAutoOrder: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>

          {/* Wallet Balance Checker */}
          <div className="p-3.5 rounded-2xl bg-purple-950/20 border border-purple-800/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-900/50 border border-purple-700/60 flex items-center justify-center text-purple-300">
                <Wallet className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-purple-200 block">
                  Provider Wallet Balance
                </span>
                {balanceInfo ? (
                  <span className="text-sm font-black text-emerald-400">
                    {balanceInfo.currency} {balanceInfo.balance}
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-400">
                    Click to check live balance on provider
                  </span>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={handleCheckBalance}
              disabled={checkingBalance}
              className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${checkingBalance ? 'animate-spin' : ''}`} />
              <span>{checkingBalance ? 'Checking...' : 'Check Balance'}</span>
            </button>
          </div>

          {balanceError && (
            <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{balanceError}</span>
            </div>
          )}
        </div>

        {/* Maintenance Mode & Reset */}
        <div className="p-5 rounded-3xl bg-slate-800/80 border border-slate-700/70 space-y-4">
          <h3 className="text-sm font-black text-white uppercase tracking-wider">
            Site Controls & Danger Zone
          </h3>

          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900 border border-slate-700/80">
            <div>
              <span className="text-xs font-bold text-white block">Maintenance Mode</span>
              <span className="text-[11px] text-slate-400">
                Temporarily pause customer orders while you make catalog updates.
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.maintenanceMode}
                onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#F72585]"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900 border border-slate-700/80">
            <div>
              <span className="text-xs font-bold text-slate-200 block">Clear All Catalog Data</span>
              <span className="text-[11px] text-slate-400">
                Wipe all categories, services, plans, offers, and banners so you start 100% fresh.
              </span>
            </div>
            <button
              type="button"
              onClick={handleClearAllData}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-red-900/60 text-slate-300 hover:text-red-200 text-xs font-bold transition-colors cursor-pointer border border-slate-700 hover:border-red-700"
            >
              Clear All Data
            </button>
          </div>
        </div>

        {/* Save CTA */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-3 rounded-2xl bg-[#F72585] hover:bg-[#E01E75] text-white font-black text-sm flex items-center gap-2 shadow-lg shadow-pink-600/30 active:scale-95 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save All Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
};
