import React, { useState, useEffect } from 'react';
import { Order, WebsiteSettings } from '../types';
import { dbService } from '../lib/db';
import { syncSingleOrderStatus } from '../lib/providerService';
import { PlatformIcon } from './PlatformIcon';
import {
  ArrowLeft,
  Search,
  User,
  Phone,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronRight,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  X,
  Zap,
} from 'lucide-react';

interface TrackOrdersPageProps {
  settings?: WebsiteSettings;
  initialCustomer?: { name: string; mobile: string } | null;
  onBack: () => void;
  onSelectPlatform?: (catName: string) => void;
}

export const TrackOrdersPage: React.FC<TrackOrdersPageProps> = ({
  settings,
  initialCustomer,
  onBack,
  onSelectPlatform,
}) => {
  const [customerName, setCustomerName] = useState(initialCustomer?.name || '');
  const [mobileNumber, setMobileNumber] = useState(initialCustomer?.mobile || '');
  const [orders, setOrders] = useState<Order[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshingOrderId, setRefreshingOrderId] = useState<string | null>(null);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('All');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  const currency = settings?.defaultCurrency || '₹';

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!customerName.trim() || !mobileNumber.trim()) return;

    setIsLoading(true);
    try {
      const results = await dbService.getOrdersByCustomer(customerName.trim(), mobileNumber.trim());
      setOrders(results || []);
      setHasSearched(true);
      setIsLoading(false);

      // Option 2 Stale-While-Revalidate: Silently check provider in background with 0 UI lag
      if (results && results.length > 0) {
        const pendingWithProvider = results.filter(
          (o) => o.providerOrderId && o.orderStatus !== 'Completed' && o.orderStatus !== 'Cancelled'
        );
        if (pendingWithProvider.length > 0) {
          Promise.all(
            pendingWithProvider.map((o) => syncSingleOrderStatus(o, settings).catch(() => {}))
          ).then(() => {
            dbService.getOrdersByCustomer(customerName.trim(), mobileNumber.trim()).then((fresh) => {
              if (fresh) setOrders(fresh);
            });
          });
        }
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      setIsLoading(false);
    }
  };

  const handleRefreshSingleOrder = async (e: React.MouseEvent, order: Order) => {
    e.stopPropagation();
    if (!order.providerOrderId) return;
    setRefreshingOrderId(order.id);
    try {
      await syncSingleOrderStatus(order, settings);
      const fresh = await dbService.getOrdersByCustomer(customerName.trim(), mobileNumber.trim());
      if (fresh) {
        setOrders(fresh);
        const updatedSelected = fresh.find((f) => f.id === order.id);
        if (updatedSelected) setSelectedOrder(updatedSelected);
      }
    } catch (err) {
      console.error('Error refreshing order status:', err);
    } finally {
      setRefreshingOrderId(null);
    }
  };

  // Auto-search if initial customer is provided
  useEffect(() => {
    if (initialCustomer?.name && initialCustomer?.mobile) {
      setCustomerName(initialCustomer.name);
      setMobileNumber(initialCustomer.mobile);
      handleSearch();
    }
  }, [initialCustomer]);

  // Real-time update subscription
  useEffect(() => {
    const unsub = dbService.subscribe(() => {
      if (customerName.trim() && mobileNumber.trim() && hasSearched) {
        dbService.getOrdersByCustomer(customerName.trim(), mobileNumber.trim()).then((res) => {
          setOrders(res || []);
        });
      }
    });
    return unsub;
  }, [customerName, mobileNumber, hasSearched]);

  const filteredOrders = orders.filter((o) => {
    if (selectedStatusFilter === 'All') return true;
    const status = o.orderStatus ? o.orderStatus.toLowerCase() : 'processing';
    return status === selectedStatusFilter.toLowerCase();
  });

  const getStatusBadge = (status: Order['orderStatus']) => {
    switch (status) {
      case 'Completed':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-black text-[#20B26B] bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
            <CheckCircle2 className="w-3 h-3" /> Completed
          </span>
        );
      case 'Processing':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-black text-[#F72585] bg-pink-50 border border-pink-200 px-2.5 py-0.5 rounded-full">
            <RefreshCw className="w-3 h-3 animate-spin" /> In Progress
          </span>
        );
      case 'Cancelled':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-black text-red-500 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-full">
            <XCircle className="w-3 h-3" /> Cancelled
          </span>
        );
      case 'Pending':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-black text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
            <Clock className="w-3 h-3" /> Queued
          </span>
        );
    }
  };

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  const handleCopyOrderId = (idText: string) => {
    navigator.clipboard.writeText(idText);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24 md:pb-16">
      {/* Top Header */}
      <div className="bg-white border-b border-pink-100 px-4 sm:px-6 lg:px-8 py-3.5 shadow-[0_2px_12px_rgba(247,37,133,0.04)]">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              aria-label="Go back"
              className="w-9 h-9 rounded-full bg-pink-50 hover:bg-pink-100 text-[#F72585] flex items-center justify-center transition-colors active:scale-95 cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
            </button>
            <h1 className="font-black text-lg sm:text-xl text-[#172033] leading-none">
              Track My Orders
            </h1>
          </div>
          {hasSearched && (
            <button
              onClick={() => handleSearch()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pink-50 text-[#F72585] text-xs font-bold hover:bg-pink-100 transition-colors cursor-pointer"
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 flex flex-col gap-6">
        {/* Track Form Card */}
        <div className="p-5 sm:p-7 rounded-3xl bg-white border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
          <div className="mb-4">
            <h2 className="text-base sm:text-lg font-black text-[#172033]">
              Lookup Your Orders
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 font-medium mt-0.5">
              Enter the exact Name and 10-digit Mobile Number entered during checkout.
            </p>
          </div>

          <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
            <div className="sm:col-span-5">
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Full Name <span className="text-[#F72585] font-bold">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full pl-10 pr-3.5 py-2.5 sm:py-3 rounded-xl bg-white border border-gray-200 text-sm font-semibold text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#F72585] transition-all"
                />
              </div>
            </div>

            <div className="sm:col-span-4">
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Mobile Number <span className="text-[#F72585] font-bold">*</span>
              </label>
              <div className="relative flex">
                <div className="flex items-center px-3 bg-gray-50 border border-r-0 border-gray-200 rounded-l-xl text-xs font-bold text-gray-700">
                  +91
                </div>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="e.g. 9876543210"
                  className="w-full px-3 py-2.5 sm:py-3 rounded-r-xl bg-white border border-gray-200 text-sm font-semibold text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#F72585] transition-all"
                />
              </div>
            </div>

            <div className="sm:col-span-3">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-[#F72585] to-[#FF4FA0] text-white font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md shadow-pink-300 hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              >
                <Search className="w-4 h-4" />
                <span>{isLoading ? 'Searching...' : 'Find Orders'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Results Section */}
        {hasSearched && (
          <div>
            {/* Filter Tabs */}
            <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                {['All', 'Processing', 'Completed', 'Pending'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setSelectedStatusFilter(status)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      selectedStatusFilter === status
                        ? 'bg-[#172033] text-white'
                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
              <span className="text-xs font-bold text-gray-500">
                Found {filteredOrders.length} {filteredOrders.length === 1 ? 'order' : 'orders'}
              </span>
            </div>

            {filteredOrders.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-gray-100 shadow-xs">
                <AlertCircle className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-base font-bold text-gray-800">No orders found.</p>
                <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                  Please verify that both your Full Name and 10-digit Mobile Number match the details entered at checkout.
                </p>
              </div>
            ) : (
              /* Responsive Orders Grid: 1 col on mobile, 2 col on tablet & desktop */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
                {filteredOrders.map((order) => (
                  <div
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white border border-gray-100 hover:border-pink-300 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md transition-all cursor-pointer active:scale-[0.99] flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-12 h-12 rounded-2xl bg-pink-50 border border-pink-100 flex items-center justify-center shrink-0 p-2 shadow-2xs">
                        <PlatformIcon nameOrSlug={order.categoryName || 'Instagram'} className="w-7 h-7" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm sm:text-base font-black text-[#172033] tracking-tight truncate">
                            {order.isCustomOffer
                              ? order.offerTitle || `${order.categoryName || 'Social'} Combo`
                              : `${(order.quantity || 1).toLocaleString()} ${order.serviceName || 'Service'}`}
                          </h4>
                          {order.isCustomOffer && (
                            <span className="text-[10px] font-black uppercase text-[#F72585] bg-pink-50 border border-pink-200 px-1.5 py-0.5 rounded-full shrink-0">
                              COMBO
                            </span>
                          )}
                        </div>
                        {order.itemsSummary && (
                          <p className="text-[11px] font-bold text-[#F72585] truncate mt-0.5">
                            {order.itemsSummary}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          {getStatusBadge(order.orderStatus || 'Processing')}
                          <span className="text-[11px] font-medium text-gray-400">
                            {formatDate(order.createdAt || '')}
                          </span>
                          {order.providerOrderId && order.orderStatus !== 'Completed' && (
                            <button
                              type="button"
                              onClick={(e) => handleRefreshSingleOrder(e, order)}
                              disabled={refreshingOrderId === order.id}
                              className="p-1 rounded-full text-purple-600 hover:bg-purple-100 transition-colors"
                              title="Check live delivery progress"
                            >
                              <RefreshCw className={`w-3 h-3 ${refreshingOrderId === order.id ? 'animate-spin' : ''}`} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2 ml-3">
                      <span className="text-base sm:text-lg font-black text-[#F72585]">
                        {currency}{(order.amount || 0).toLocaleString()}
                      </span>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-pink-100 max-h-[90vh] overflow-y-auto animate-scale-in">
            <div className="flex items-center justify-between pb-3.5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-pink-50 border border-pink-100 flex items-center justify-center p-1.5">
                  <PlatformIcon nameOrSlug={selectedOrder.categoryName || 'Instagram'} className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#172033]">
                    {selectedOrder.isCustomOffer
                      ? selectedOrder.offerTitle || `${selectedOrder.categoryName || 'Social'} Combo`
                      : `${(selectedOrder.quantity || 1).toLocaleString()} ${selectedOrder.categoryName || ''} ${selectedOrder.serviceName || 'Service'}`}
                  </h3>
                  {selectedOrder.itemsSummary && (
                    <p className="text-xs font-bold text-[#F72585] mt-0.5">
                      {selectedOrder.itemsSummary}
                    </p>
                  )}
                  <div className="flex items-center gap-1 text-xs text-gray-400 font-mono font-bold mt-0.5">
                    <span>{selectedOrder.orderId}</span>
                    <button
                      onClick={() => handleCopyOrderId(selectedOrder.orderId)}
                      className="text-[#F72585] hover:underline"
                    >
                      {copiedId ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-3">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-gray-100">
                <span className="text-xs font-bold text-gray-500">Status</span>
                {getStatusBadge(selectedOrder.orderStatus)}
              </div>

              {/* SMM Provider Live Progress if available */}
              {selectedOrder.providerOrderId && (
                <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-purple-600" />
                      Live Network Delivery
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handleRefreshSingleOrder(e, selectedOrder)}
                      disabled={refreshingOrderId === selectedOrder.id}
                      className="text-[11px] font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className={`w-3 h-3 ${refreshingOrderId === selectedOrder.id ? 'animate-spin' : ''}`} />
                      <span>Sync Live</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded-xl bg-white border border-purple-100">
                      <span className="text-[10px] text-gray-500 block font-medium">Provider Status</span>
                      <span className="font-bold text-purple-700">{selectedOrder.providerStatus || 'Processing'}</span>
                    </div>
                    {selectedOrder.providerRemains && (
                      <div className="p-2 rounded-xl bg-white border border-purple-100">
                        <span className="text-[10px] text-gray-500 block font-medium">Remaining</span>
                        <span className="font-bold text-[#172033]">{selectedOrder.providerRemains}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-gray-100">
                <span className="text-xs font-bold text-gray-500">Amount Paid</span>
                <span className="text-base font-black text-[#F72585]">
                  {currency}{selectedOrder.amount.toLocaleString()}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-gray-100 space-y-1">
                <span className="text-xs font-bold text-gray-500 block">Target Link</span>
                <a
                  href={selectedOrder.targetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#F72585] font-semibold break-all hover:underline flex items-center gap-1"
                >
                  <span>{selectedOrder.targetUrl}</span>
                  <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-gray-100">
                <span className="text-xs font-bold text-gray-500">Ordered On</span>
                <span className="text-xs font-semibold text-[#172033]">
                  {formatDate(selectedOrder.createdAt)}
                </span>
              </div>
            </div>

            <button
              onClick={() => setSelectedOrder(null)}
              className="w-full py-3 rounded-2xl bg-gray-100 hover:bg-gray-200 text-[#172033] font-bold text-xs transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
