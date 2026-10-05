import React, { useState, useEffect } from 'react';
import { Order, SupportTicket, WebsiteSettings } from '../../types';
import { dbService } from '../../lib/db';
import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  XCircle,
  IndianRupee,
  Calendar,
  Ticket,
  Plus,
  ArrowRight,
  TrendingUp,
  Layers,
  Sparkles,
  Percent,
  Image as ImageIcon,
  ExternalLink,
} from 'lucide-react';

interface AdminDashboardProps {
  onNavigateTab: (tab: string) => void;
  settings?: WebsiteSettings;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onNavigateTab,
  settings,
}) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);

  const currency = settings?.defaultCurrency || '₹';

  const loadData = async () => {
    try {
      const [ordList, tktList] = await Promise.all([
        dbService.getAllOrders(),
        dbService.getAllTickets(),
      ]);
      setOrders(ordList);
      setTickets(tktList);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const unsub = dbService.subscribe(() => {
      loadData();
    });
    return unsub;
  }, []);

  // Compute metrics
  const totalOrders = orders.length;
  const processingOrders = orders.filter((o) => o.orderStatus === 'Processing').length;
  const pendingOrders = orders.filter((o) => o.orderStatus === 'Pending').length;
  const completedOrders = orders.filter((o) => o.orderStatus === 'Completed').length;
  const cancelledOrders = orders.filter((o) => o.orderStatus === 'Cancelled').length;
  const totalRevenue = orders
    .filter((o) => o.paymentStatus === 'Paid' && o.orderStatus !== 'Cancelled')
    .reduce((sum, o) => sum + o.amount, 0);

  // Today's orders & revenue
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayOrdersList = orders.filter((o) => o.createdAt.slice(0, 10) === todayStr);
  const todayOrdersCount = todayOrdersList.length;
  const todayRevenue = todayOrdersList
    .filter((o) => o.paymentStatus === 'Paid' && o.orderStatus !== 'Cancelled')
    .reduce((sum, o) => sum + o.amount, 0);

  const openTickets = tickets.filter((t) => t.status === 'Open' || t.status === 'In Progress').length;

  const handleQuickStatusChange = async (order: Order, newStatus: Order['orderStatus']) => {
    await dbService.updateOrderStatus(order.id, newStatus);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white">Dashboard Overview</h1>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Real-time control panel for orders, catalog, and manual fulfillment.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigateTab('categories')}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 text-[#F72585]" />
            Category
          </button>
          <button
            onClick={() => onNavigateTab('services')}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 text-[#F72585]" />
            Service
          </button>
          <button
            onClick={() => onNavigateTab('plans')}
            className="px-3.5 py-1.5 rounded-xl bg-[#F72585] hover:bg-[#E01E75] text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-pink-600/30 cursor-pointer active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            Add Plan
          </button>
          <button
            onClick={() => onNavigateTab('offers')}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 text-pink-400" />
            Offer
          </button>
          <button
            onClick={() => onNavigateTab('banners')}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 text-blue-400" />
            Banner
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Total Orders */}
        <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/70">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Total Orders</span>
            <div className="w-8 h-8 rounded-xl bg-pink-500/10 text-[#F72585] flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-white">{totalOrders}</div>
          <span className="text-[10px] text-slate-400 mt-1 block">All-time placed orders</span>
        </div>

        {/* Processing Orders */}
        <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/70">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Processing</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-[#20B26B] flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-[#20B26B]">{processingOrders}</div>
          <span className="text-[10px] text-emerald-400/80 mt-1 block">Awaiting fulfillment</span>
        </div>

        {/* Completed Orders */}
        <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/70">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Completed</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-[#20B26B] flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-white">{completedOrders}</div>
          <span className="text-[10px] text-slate-400 mt-1 block">Successfully delivered</span>
        </div>

        {/* Total Revenue */}
        <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/70">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Total Revenue</span>
            <div className="w-8 h-8 rounded-xl bg-[#F72585]/10 text-[#F72585] flex items-center justify-center">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-white">
            {currency}{totalRevenue.toLocaleString()}
          </div>
          <span className="text-[10px] text-pink-400/80 mt-1 block">Paid orders</span>
        </div>

        {/* Open Tickets */}
        <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/70">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Open Tickets</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Ticket className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-amber-400">{openTickets}</div>
          <span className="text-[10px] text-slate-400 mt-1 block">Customer inquiries</span>
        </div>
      </div>

      {/* Secondary Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="p-3.5 rounded-2xl bg-slate-850 border border-slate-800">
          <span className="text-[11px] font-bold text-slate-400">Today's Orders</span>
          <div className="text-xl font-extrabold text-white mt-1">{todayOrdersCount}</div>
        </div>
        <div className="p-3.5 rounded-2xl bg-slate-850 border border-slate-800">
          <span className="text-[11px] font-bold text-slate-400">Today's Revenue</span>
          <div className="text-xl font-extrabold text-[#20B26B] mt-1">
            {currency}{todayRevenue.toLocaleString()}
          </div>
        </div>
        <div className="p-3.5 rounded-2xl bg-slate-850 border border-slate-800">
          <span className="text-[11px] font-bold text-slate-400">Pending Orders</span>
          <div className="text-xl font-extrabold text-amber-400 mt-1">{pendingOrders}</div>
        </div>
        <div className="p-3.5 rounded-2xl bg-slate-850 border border-slate-800">
          <span className="text-[11px] font-bold text-slate-400">Cancelled Orders</span>
          <div className="text-xl font-extrabold text-slate-400 mt-1">{cancelledOrders}</div>
        </div>
      </div>

      {/* Recent Orders Queue for Quick Manual Fulfillment */}
      <div className="rounded-3xl bg-slate-800/80 border border-slate-700/70 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-black text-white">Recent Orders (Manual Fulfillment)</h2>
            <p className="text-xs text-slate-400">Click any order to fulfill or change status</p>
          </div>
          <button
            onClick={() => onNavigateTab('orders')}
            className="text-xs font-bold text-[#F72585] hover:text-pink-400 flex items-center gap-1 cursor-pointer"
          >
            View All Orders <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs">No orders recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-700">
                <tr>
                  <th className="py-2.5 px-3">Order ID</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Service</th>
                  <th className="py-2.5 px-3">Target URL</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60 font-medium">
                {orders.slice(0, 6).map((order) => (
                  <tr key={order.id} className="hover:bg-slate-750/50 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-pink-400">{order.orderId}</td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-white">{order.customerName}</div>
                      <div className="text-[10px] text-slate-400">+91 {order.mobileNumber}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="text-white">
                        {order.quantity.toLocaleString()} {order.categoryName} {order.serviceName}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <a
                        href={order.targetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:underline max-w-[150px] truncate block flex items-center gap-1"
                      >
                        <span className="truncate">{order.targetUrl}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    </td>
                    <td className="py-3 px-3 font-black text-white">
                      {currency}{order.amount.toLocaleString()}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
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
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {order.orderStatus !== 'Completed' && (
                          <button
                            onClick={() => handleQuickStatusChange(order, 'Completed')}
                            className="px-2 py-1 rounded bg-[#20B26B]/20 hover:bg-[#20B26B]/30 text-[#20B26B] font-bold text-[10px] cursor-pointer"
                          >
                            Mark Completed
                          </button>
                        )}
                        {order.orderStatus !== 'Processing' && order.orderStatus !== 'Completed' && (
                          <button
                            onClick={() => handleQuickStatusChange(order, 'Processing')}
                            className="px-2 py-1 rounded bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 font-bold text-[10px] cursor-pointer"
                          >
                            Processing
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
