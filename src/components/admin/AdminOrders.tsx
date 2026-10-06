import React, { useState, useEffect } from 'react';
import { Order, WebsiteSettings } from '../../types';
import { dbService } from '../../lib/db';
import {
  syncSingleOrderStatus,
  syncMultipleOrdersStatus,
  dispatchOrderToProvider,
} from '../../lib/providerService';
import {
  Search,
  Filter,
  ExternalLink,
  Copy,
  CheckCheck,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  ChevronRight,
  Save,
  Trash2,
  RefreshCw,
  Zap,
  Send,
  AlertTriangle,
} from 'lucide-react';

interface AdminOrdersProps {
  settings?: WebsiteSettings;
}

export const AdminOrders: React.FC<AdminOrdersProps> = ({ settings }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Sync and Push state
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [syncingOrderId, setSyncingOrderId] = useState<string | null>(null);
  const [pushingOrderId, setPushingOrderId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Edit modal fields
  const [editStatus, setEditStatus] = useState<Order['orderStatus']>('Processing');
  const [editPaymentStatus, setEditPaymentStatus] = useState<Order['paymentStatus']>('Paid');
  const [adminNote, setAdminNote] = useState('');
  const [completionNote, setCompletionNote] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  const currency = settings?.defaultCurrency || '₹';

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadOrders = async () => {
    const list = await dbService.getAllOrders();
    setOrders(list);
  };

  useEffect(() => {
    loadOrders();
    const unsub = dbService.subscribe(loadOrders);
    return unsub;
  }, []);

  const handleSyncAllStatuses = async () => {
    const activeWithProvider = orders.filter(
      (o) => o.providerOrderId && o.orderStatus !== 'Completed' && o.orderStatus !== 'Cancelled'
    );
    if (activeWithProvider.length === 0) {
      showToast('No active orders with Provider IDs to sync.');
      return;
    }

    setIsSyncingAll(true);
    try {
      const res = await syncMultipleOrdersStatus(activeWithProvider, settings);
      await loadOrders();
      if (res.updatedCount > 0) {
        showToast(`Successfully synced ${res.updatedCount} orders from SMM Provider!`);
      } else if (res.errors.length > 0) {
        showToast(`Sync error: ${res.errors[0]}`);
      } else {
        showToast('All order statuses are already up to date.');
      }
    } catch (e: any) {
      showToast(`Sync failed: ${e?.message || 'Unknown error'}`);
    } finally {
      setIsSyncingAll(false);
    }
  };

  const handleSyncSingle = async (e: React.MouseEvent, order: Order) => {
    e.stopPropagation();
    if (!order.providerOrderId) return;
    setSyncingOrderId(order.id);
    try {
      const res = await syncSingleOrderStatus(order, settings);
      await loadOrders();
      if (res.success) {
        showToast(`Order #${order.orderId}: Status updated to ${res.status}`);
      } else {
        showToast(`Status check error: ${res.error}`);
      }
    } catch (e: any) {
      showToast(`Error: ${e?.message}`);
    } finally {
      setSyncingOrderId(null);
    }
  };

  const handlePushToProvider = async (e: React.MouseEvent, order: Order) => {
    e.stopPropagation();
    setPushingOrderId(order.id);
    try {
      const res = await dispatchOrderToProvider(order, null, settings);
      await loadOrders();
      if (res.success && res.providerOrderId) {
        showToast(`Successfully sent to provider! (ID: #${res.providerOrderId})`);
      } else {
        showToast(`Push failed: ${res.error}`);
      }
    } catch (e: any) {
      showToast(`Error: ${e?.message}`);
    } finally {
      setPushingOrderId(null);
    }
  };

  const handleOpenOrder = (order: Order) => {
    setSelectedOrder(order);
    setEditStatus(order.orderStatus);
    setEditPaymentStatus(order.paymentStatus);
    setAdminNote(order.adminNote || '');
    setCompletionNote(order.completionNote || '');
  };

  const handleSaveOrder = async () => {
    if (!selectedOrder) return;
    const wasUnpaid = selectedOrder.paymentStatus !== 'Paid';
    const isNowPaid = editPaymentStatus === 'Paid';

    await dbService.updateOrder(selectedOrder.id, {
      orderStatus: editStatus,
      paymentStatus: editPaymentStatus,
      adminNote,
      completionNote,
    });

    // If marked Paid and had a referralCode, credit commission if not already credited
    if (wasUnpaid && isNowPaid && selectedOrder.referralCode && selectedOrder.referralCommissionStatus !== 'Credited') {
      dbService.creditReferralCommission({
        ...selectedOrder,
        paymentStatus: 'Paid',
      }, settings).catch((err) => console.warn('Referral credit on manual Paid failed:', err));
    }

    setSelectedOrder(null);
    loadOrders();
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const filteredOrders = orders.filter((o) => {
    // Status filter
    if (statusFilter !== 'All') {
      if (statusFilter === 'Paid' || statusFilter === 'Unpaid') {
        if (statusFilter === 'Paid' && o.paymentStatus !== 'Paid') return false;
        if (statusFilter === 'Unpaid' && o.paymentStatus === 'Paid') return false;
      } else {
        const oStatus = o.orderStatus ? o.orderStatus.toLowerCase() : 'processing';
        if (oStatus !== statusFilter.toLowerCase()) return false;
      }
    }

    // Search query filter
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (o.orderId || '').toLowerCase().includes(q) ||
      (o.customerName || '').toLowerCase().includes(q) ||
      (o.mobileNumber || '').includes(q) ||
      (o.serviceName || '').toLowerCase().includes(q) ||
      (o.categoryName || '').toLowerCase().includes(q) ||
      (o.targetUrl || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="p-3.5 rounded-2xl bg-purple-950/90 border border-purple-700 text-purple-200 text-xs font-bold flex items-center justify-between shadow-xl animate-fade-in">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-purple-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-purple-400 hover:text-white p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-black text-white">Order Management</h1>
          <p className="text-xs text-slate-400">
            Fulfill orders, monitor automatic provider delivery, and sync real-time statuses.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSyncAllStatuses}
            disabled={isSyncingAll}
            className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-purple-900/30 transition-all cursor-pointer"
            title="Fetch latest status for all active orders from smmxpert.in"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingAll ? 'animate-spin' : ''}`} />
            <span>{isSyncingAll ? 'Syncing...' : 'Sync Provider Status'}</span>
          </button>
          <div className="text-xs font-semibold text-slate-400 bg-slate-800 px-3 py-2 rounded-xl border border-slate-700">
            Total: <span className="text-white font-bold">{orders.length}</span>
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Order ID, Name, Mobile, Service or URL..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-400 text-xs font-medium focus:outline-none focus:border-[#F72585]"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {['All', 'Processing', 'Pending', 'Completed', 'Cancelled', 'Paid'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                statusFilter === st
                  ? 'bg-[#F72585] text-white shadow-xs'
                  : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="rounded-3xl bg-slate-800/80 border border-slate-700/70 overflow-hidden shadow-lg">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            No matching orders found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-slate-850 border-b border-slate-700">
                <tr>
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Plan / Service</th>
                  <th className="py-3 px-4">Target URL</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => handleOpenOrder(order)}
                    className="hover:bg-slate-750/60 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-mono font-bold text-pink-400">{order.orderId}</div>
                      {order.providerOrderId ? (
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-purple-950/80 border border-purple-800 text-purple-300">
                            SMM #{order.providerOrderId}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[9px] text-slate-500 font-sans block mt-0.5">Manual</span>
                      )}
                      {order.referralCode && (
                        <span className="inline-flex items-center gap-1 mt-1 text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-800 text-emerald-300 font-bold block w-fit">
                          Ref: {order.referralCode}
                          {order.referralCommission ? ` (+₹${order.referralCommission})` : ''}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-bold text-white">{order.customerName}</div>
                      <div className="text-[10px] text-slate-400">+91 {order.mobileNumber}</div>
                    </td>
                    <td className="py-3 px-4">
                      {order.isCustomOffer ? (
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded-md bg-pink-500/20 text-[#F72585] text-[10px] font-black">
                              🔥 COMBO
                            </span>
                            <span className="font-bold text-white">
                              {order.offerTitle || `${order.categoryName} Combo`}
                            </span>
                          </div>
                          {order.itemsSummary && (
                            <p className="text-[11px] text-pink-300 font-semibold mt-0.5">
                              {order.itemsSummary}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="font-semibold text-slate-200">
                          {(order.quantity || 1).toLocaleString()} {order.categoryName || ''} {order.serviceName || 'Service'}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                      <a
                        href={order.targetUrl || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:underline max-w-[140px] truncate block flex items-center gap-1 font-mono text-[11px]"
                      >
                        <span className="truncate">{order.targetUrl || 'N/A'}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    </td>
                    <td className="py-3 px-4 font-black text-white whitespace-nowrap">
                      {currency}{(order.amount || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/60 text-[#20B26B] border border-emerald-800">
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                          order.orderStatus === 'Completed'
                            ? 'bg-emerald-950/60 text-[#20B26B] border border-emerald-800'
                            : order.orderStatus === 'Processing'
                            ? 'bg-blue-950/60 text-blue-400 border border-blue-800'
                            : order.orderStatus === 'Cancelled'
                            ? 'bg-slate-900 text-slate-400 border border-slate-700'
                            : 'bg-amber-950/60 text-amber-400 border border-amber-800'
                        }`}
                      >
                        {order.orderStatus}
                      </span>
                      {order.providerStatus && (
                        <span className="text-[10px] text-purple-300 block font-medium mt-0.5">
                          API: {order.providerStatus}
                        </span>
                      )}
                      {order.providerError && (
                        <span className="text-[9px] text-rose-400 block font-medium max-w-[120px] truncate mt-0.5" title={order.providerError}>
                          ⚠️ {order.providerError}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        {order.providerOrderId ? (
                          <button
                            type="button"
                            onClick={(e) => handleSyncSingle(e, order)}
                            disabled={syncingOrderId === order.id}
                            className="p-1.5 rounded-lg bg-purple-900/60 hover:bg-purple-800 border border-purple-700 text-purple-200 cursor-pointer transition-colors"
                            title="Check Live Status on SMM Provider"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${syncingOrderId === order.id ? 'animate-spin' : ''}`} />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => handlePushToProvider(e, order)}
                            disabled={pushingOrderId === order.id}
                            className="p-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white cursor-pointer shadow-xs transition-colors"
                            title="Push to smmxpert.in"
                          >
                            <Zap className={`w-3.5 h-3.5 ${pushingOrderId === order.id ? 'animate-bounce' : ''}`} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleOpenOrder(order)}
                          className="px-2.5 py-1 rounded-lg bg-slate-700 hover:bg-[#F72585] text-white text-[11px] font-bold transition-colors cursor-pointer"
                        >
                          Fulfill / Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manual Fulfillment Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-black text-white">Manual Fulfillment Details</h3>
                <p className="text-xs font-mono text-pink-400">{selectedOrder.orderId}</p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Target URL with Copy Button */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
              <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1.5">
                Target Profile / Post Link (Click to Copy or Open)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={selectedOrder.targetUrl}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-blue-400 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleCopy(selectedOrder.targetUrl)}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0"
                >
                  {copiedLink ? (
                    <CheckCheck className="w-3.5 h-3.5 text-[#20B26B]" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  {copiedLink ? 'Copied' : 'Copy'}
                </button>
                <a
                  href={selectedOrder.targetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white shrink-0"
                  title="Open Link in New Tab"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Customer & Service Snapshot */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-850 p-3.5 rounded-2xl border border-slate-800">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Customer</span>
                <span className="font-bold text-white">{selectedOrder.customerName}</span>
                <span className="block text-slate-400">+91 {selectedOrder.mobileNumber}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">
                  {selectedOrder.isCustomOffer ? '🔥 Combo Package' : 'Service & Quantity'}
                </span>
                <span className="font-bold text-white block">
                  {selectedOrder.isCustomOffer
                    ? selectedOrder.offerTitle || `${selectedOrder.categoryName || 'Social'} Combo`
                    : `${(selectedOrder.quantity || 1).toLocaleString()} ${selectedOrder.serviceName || 'Service'}`}
                </span>
                {selectedOrder.itemsSummary && (
                  <span className="block text-pink-300 text-[11px] font-semibold mt-0.5">
                    {selectedOrder.itemsSummary}
                  </span>
                )}
                <span className="block text-pink-400 font-black mt-1">
                  {currency}{(selectedOrder.amount || 0).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Payment Details Badge */}
            {(selectedOrder.paymentMethod || selectedOrder.paymentId) && (
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-755 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">
                    Gateway / Method
                  </span>
                  <span className="font-bold text-slate-200">
                    {selectedOrder.paymentMethod || 'ZapUPI Gateway'}
                  </span>
                </div>
                {selectedOrder.paymentId && (
                  <div className="text-right">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">
                      Txn / Order ID
                    </span>
                    <span className="font-mono font-bold text-pink-400">
                      {selectedOrder.paymentId}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Referral Attribution Badge */}
            {selectedOrder.referralCode && (
              <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-800/60 flex items-center justify-between text-xs">
                <div>
                  <span className="text-purple-300 block text-[10px] uppercase font-bold">
                    Referral Partner Attribution
                  </span>
                  <span className="font-mono font-bold text-white">
                    Code: {selectedOrder.referralCode}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">
                    Commission
                  </span>
                  <span className="font-mono font-black text-emerald-400">
                    +{currency}{selectedOrder.referralCommission || Math.round(Number(selectedOrder.amount || 0) * 0.3)} ({selectedOrder.referralCommissionStatus || 'Credited'})
                  </span>
                </div>
              </div>
            )}

            {/* SMM Provider Status Card */}
            <div className="p-3.5 rounded-2xl bg-purple-950/20 border border-purple-800/50 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-black text-white">SMM Provider (smmxpert.in)</span>
                </div>
                {selectedOrder.providerOrderId ? (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-900/60 border border-purple-700 text-purple-200 font-bold">
                    ID #{selectedOrder.providerOrderId}
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                    Not placed yet
                  </span>
                )}
              </div>

              {selectedOrder.providerOrderId ? (
                <div className="grid grid-cols-3 gap-2 text-xs pt-1">
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">Live Status</span>
                    <span className="font-bold text-purple-300">{selectedOrder.providerStatus || 'In progress'}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">Start Count</span>
                    <span className="font-bold text-slate-200">{selectedOrder.providerStartCount || '—'}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">Remains</span>
                    <span className="font-bold text-slate-200">{selectedOrder.providerRemains || '—'}</span>
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-slate-400">
                  This order hasn&apos;t been pushed to the SMM provider yet. You can push it directly now.
                </p>
              )}

              {selectedOrder.providerError && (
                <div className="p-2.5 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{selectedOrder.providerError}</span>
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                {selectedOrder.providerOrderId ? (
                  <button
                    type="button"
                    onClick={async () => {
                      setSyncingOrderId(selectedOrder.id);
                      const res = await syncSingleOrderStatus(selectedOrder, settings);
                      setSyncingOrderId(null);
                      if (res.success) {
                        showToast(`Status updated to ${res.status}`);
                        setSelectedOrder({
                          ...selectedOrder,
                          providerStatus: res.status,
                          providerStartCount: res.start_count,
                          providerRemains: res.remains,
                        });
                        loadOrders();
                      } else {
                        showToast(`Sync error: ${res.error}`);
                      }
                    }}
                    disabled={syncingOrderId === selectedOrder.id}
                    className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${syncingOrderId === selectedOrder.id ? 'animate-spin' : ''}`} />
                    <span>Check Live Status</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={async () => {
                      setPushingOrderId(selectedOrder.id);
                      const res = await dispatchOrderToProvider(selectedOrder, null, settings);
                      setPushingOrderId(null);
                      if (res.success && res.providerOrderId) {
                        showToast(`Sent to provider! ID #${res.providerOrderId}`);
                        setSelectedOrder({
                          ...selectedOrder,
                          providerOrderId: res.providerOrderId,
                          providerStatus: 'In progress',
                        });
                        loadOrders();
                      } else {
                        showToast(`Error: ${res.error}`);
                      }
                    }}
                    disabled={pushingOrderId === selectedOrder.id}
                    className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md shadow-purple-900/30"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Push to Provider Now</span>
                  </button>
                )}
              </div>
            </div>

            {/* Status Selector */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Order Status
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as Order['orderStatus'])}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-[#F72585]"
                >
                  <option value="Processing">Processing</option>
                  <option value="Pending">Pending</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Payment Status
                </label>
                <select
                  value={editPaymentStatus}
                  onChange={(e) => setEditPaymentStatus(e.target.value as Order['paymentStatus'])}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-[#F72585]"
                >
                  <option value="Paid">Paid</option>
                  <option value="Pending">Pending</option>
                  <option value="Failed">Failed</option>
                </select>
              </div>
            </div>

            {/* Delivery Note (Visible to Customer on Order Tracking) */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Completion Note (Visible to Customer)
              </label>
              <input
                type="text"
                value={completionNote}
                onChange={(e) => setCompletionNote(e.target.value)}
                placeholder="e.g. Delivered 1,050 followers. Thank you for choosing swiftSMM!"
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-[#F72585]"
              />
            </div>

            {/* Admin Internal Note */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Admin Private Note (Internal)
              </label>
              <input
                type="text"
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="e.g. Completed manually on Instagram panel via supplier A"
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-[#F72585]"
              />
            </div>

            {/* Save Buttons */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveOrder}
                className="px-4 py-2 rounded-xl bg-[#F72585] hover:bg-[#E01E75] text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-pink-600/30 cursor-pointer active:scale-95"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
