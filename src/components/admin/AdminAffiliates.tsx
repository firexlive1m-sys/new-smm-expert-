import React, { useState, useEffect } from 'react';
import { Partner, PartnerCommission, PayoutRequest, PartnerTicket, TicketStatus, WebsiteSettings } from '../../types';
import { dbService } from '../../lib/db';
import {
  Users,
  Wallet,
  TrendingUp,
  ArrowDownLeft,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  Eye,
  ShieldCheck,
  AlertTriangle,
  Save,
  Check,
  X,
  RefreshCw,
  ExternalLink,
  Phone,
  Copy,
  Zap,
  Loader2,
  LifeBuoy,
  MessageSquare,
  Send,
  MessageCircle,
} from 'lucide-react';

interface AdminAffiliatesProps {
  settings?: WebsiteSettings;
}

export const AdminAffiliates: React.FC<AdminAffiliatesProps> = ({ settings }) => {
  const [activeTab, setActiveTab] = useState<'payouts' | 'partners' | 'tickets' | 'settings'>('payouts');
  const [partners, setPartners] = useState<Partner[]>([]);
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [commissions, setCommissions] = useState<PartnerCommission[]>([]);
  const [partnerTickets, setPartnerTickets] = useState<PartnerTicket[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [payoutFilter, setPayoutFilter] = useState<'All' | 'Pending' | 'Paid' | 'Rejected'>('Pending');
  const [ticketFilter, setTicketFilter] = useState<'All' | 'Open' | 'In Progress' | 'Resolved' | 'Closed'>('All');

  // Modals
  const [auditPartner, setAuditPartner] = useState<Partner | null>(null);
  const [auditCommissions, setAuditCommissions] = useState<PartnerCommission[]>([]);
  const [processPayoutModal, setProcessPayoutModal] = useState<{
    payout: PayoutRequest;
    action: 'Paid' | 'Rejected';
  } | null>(null);
  const [transactionRef, setTransactionRef] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Partner Ticket Reply Modal
  const [selectedTicket, setSelectedTicket] = useState<PartnerTicket | null>(null);
  const [ticketReply, setTicketReply] = useState('');
  const [ticketStatus, setTicketStatus] = useState<TicketStatus>('Open');
  const [isSavingTicket, setIsSavingTicket] = useState(false);

  // Settings tab form
  const [commissionRate, setCommissionRate] = useState<number>(settings?.referralCommissionPercent ?? 30);
  const [minWithdrawal, setMinWithdrawal] = useState<number>(settings?.referralMinWithdrawal ?? 200);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const currency = settings?.defaultCurrency || '₹';

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [ptrs, pays, comms, tkts] = await Promise.all([
        dbService.getAllPartners(),
        dbService.getAllPayoutRequests(),
        dbService.getAllCommissions(),
        dbService.getAllPartnerTickets(),
      ]);
      setPartners(ptrs);
      setPayouts(pays);
      setCommissions(comms);
      setPartnerTickets(tkts);
    } catch (err) {
      console.error('Error loading affiliates data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const unsub = dbService.subscribe(() => {
      loadData();
    });
    return unsub;
  }, []);

  // Quick stats
  const pendingPayouts = payouts.filter((p) => p.status === 'Pending');
  const totalPaidOut = payouts
    .filter((p) => p.status === 'Paid')
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const totalCommissionsEarned = commissions.reduce(
    (sum, c) => sum + (Number(c.commissionAmount) || 0),
    0
  );

  // Open Partner Audit Modal
  const handleOpenAudit = async (ptr: Partner) => {
    setAuditPartner(ptr);
    try {
      const comms = await dbService.getCommissionsForPartner(ptr.id);
      setAuditCommissions(comms);
    } catch {
      setAuditCommissions([]);
    }
  };

  // Open Payout Process Modal
  const handleOpenProcessPayout = (payout: PayoutRequest, action: 'Paid' | 'Rejected') => {
    setProcessPayoutModal({ payout, action });
    setTransactionRef('');
    setAdminNote(action === 'Paid' ? 'Approved & transferred via UPI' : 'Suspicious activity / Invalid request');
  };

  // Submit Payout Process
  const handleConfirmProcessPayout = async () => {
    if (!processPayoutModal) return;
    setIsProcessing(true);
    try {
      await dbService.processPayoutRequest(
        processPayoutModal.payout.id,
        processPayoutModal.action,
        adminNote,
        transactionRef
      );
      showToast(
        processPayoutModal.action === 'Paid'
          ? `Payout of ${currency}${processPayoutModal.payout.amount} marked as Paid!`
          : `Payout of ${currency}${processPayoutModal.payout.amount} rejected and refunded to wallet.`
      );
      setProcessPayoutModal(null);
      await loadData();
    } catch (err: any) {
      alert(`Error processing payout: ${err?.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Toggle Partner Status
  const handleTogglePartnerStatus = async (ptr: Partner) => {
    try {
      const updated = { ...ptr, active: !ptr.active };
      await dbService.updatePartner(ptr.id, { active: !ptr.active });
      showToast(`Partner ${ptr.name} is now ${updated.active ? 'Active' : 'Suspended'}`);
      await loadData();
    } catch (e: any) {
      alert(e?.message);
    }
  };

  // Save Affiliate Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      await dbService.updateSettings({
        referralCommissionPercent: Number(commissionRate) || 30,
        referralMinWithdrawal: Number(minWithdrawal) || 200,
      });
      showToast('Affiliate Program Settings saved successfully!');
    } catch (e: any) {
      alert(e?.message);
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Open Partner Ticket Reply Modal
  const handleOpenTicketReply = (tkt: PartnerTicket) => {
    setSelectedTicket(tkt);
    setTicketReply(tkt.adminReply || '');
    setTicketStatus(tkt.status);
  };

  // Save Partner Ticket Reply
  const handleSaveTicketReply = async () => {
    if (!selectedTicket) return;
    setIsSavingTicket(true);
    try {
      await dbService.updatePartnerTicket(selectedTicket.id, {
        status: ticketStatus,
        adminReply: ticketReply.trim() || undefined,
      });
      showToast(`Partner ticket ${selectedTicket.ticketId} updated successfully!`);
      setSelectedTicket(null);
      await loadData();
    } catch (err: any) {
      alert(`Error updating ticket: ${err?.message}`);
    } finally {
      setIsSavingTicket(false);
    }
  };

  // Quick stats - open partner tickets
  const openPartnerTickets = partnerTickets.filter(
    (t) => t.status === 'Open' || t.status === 'In Progress'
  );

  // Filtered lists
  const filteredPayouts = payouts.filter((p) => {
    if (payoutFilter !== 'All' && p.status !== payoutFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        p.payoutId.toLowerCase().includes(q) ||
        p.partnerName.toLowerCase().includes(q) ||
        p.partnerMobile.includes(q) ||
        p.upiId.toLowerCase().includes(q) ||
        p.partnerUserId.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const filteredPartners = partners.filter((ptr) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        ptr.userId.toLowerCase().includes(q) ||
        ptr.name.toLowerCase().includes(q) ||
        ptr.mobile.includes(q) ||
        ptr.referralCode.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const filteredPartnerTickets = partnerTickets.filter((tkt) => {
    if (ticketFilter !== 'All' && tkt.status !== ticketFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        tkt.ticketId.toLowerCase().includes(q) ||
        tkt.partnerName.toLowerCase().includes(q) ||
        tkt.partnerMobile.includes(q) ||
        tkt.partnerUserId.toLowerCase().includes(q) ||
        (tkt.referralCode && tkt.referralCode.toLowerCase().includes(q)) ||
        tkt.problem.toLowerCase().includes(q) ||
        tkt.message.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold animate-fade-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-white">Affiliates & Partner Program</h1>
            {pendingPayouts.length > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/60 text-amber-300 font-mono text-xs font-bold animate-pulse">
                {pendingPayouts.length} Payouts Pending
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400">
            Audit partner referrals, verify order authenticity, process UPI withdrawals, and set commission rates.
          </p>
        </div>
        <button
          type="button"
          onClick={loadData}
          disabled={isLoading}
          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer self-start sm:self-auto transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-3xl bg-slate-800/80 border border-slate-700/70 space-y-1.5">
          <div className="flex items-center justify-between text-purple-400">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Partners</span>
            <Users className="w-4 h-4" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono">
            {partners.length}
          </div>
          <p className="text-[10px] text-slate-400">Registered promoters</p>
        </div>

        <div className="p-4 sm:p-5 rounded-3xl bg-slate-800/80 border border-amber-800/50 space-y-1.5">
          <div className="flex items-center justify-between text-amber-400">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pending Payouts</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">
            {pendingPayouts.length}
          </div>
          <p className="text-[10px] text-amber-300/80 font-bold">Needs your approval</p>
        </div>

        <div className="p-4 sm:p-5 rounded-3xl bg-slate-800/80 border border-slate-700/70 space-y-1.5">
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Paid Out</span>
            <Wallet className="w-4 h-4" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
            {currency}{totalPaidOut.toLocaleString()}
          </div>
          <p className="text-[10px] text-slate-400">Disbursed via UPI</p>
        </div>

        <div className="p-4 sm:p-5 rounded-3xl bg-slate-800/80 border border-slate-700/70 space-y-1.5">
          <div className="flex items-center justify-between text-[#F72585]">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Commissions</span>
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono">
            {currency}{totalCommissionsEarned.toLocaleString()}
          </div>
          <p className="text-[10px] text-slate-400">{commissions.length} referral orders</p>
        </div>
      </div>

      {/* Main Tabs Selector */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('payouts')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'payouts'
              ? 'bg-[#F72585] text-white shadow-sm'
              : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
          }`}
        >
          <ArrowDownLeft className="w-3.5 h-3.5" />
          <span>Withdrawal Requests ({payouts.length})</span>
          {pendingPayouts.length > 0 && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-white text-[#F72585] text-[10px] font-black">
              {pendingPayouts.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('partners')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'partners'
              ? 'bg-[#F72585] text-white shadow-sm'
              : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Partners Directory ({partners.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('tickets')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'tickets'
              ? 'bg-[#F72585] text-white shadow-sm'
              : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
          }`}
        >
          <LifeBuoy className="w-3.5 h-3.5" />
          <span>Partner Tickets ({partnerTickets.length})</span>
          {openPartnerTickets.length > 0 && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-900 text-[10px] font-black">
              {openPartnerTickets.length} Open
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'settings'
              ? 'bg-[#F72585] text-white shadow-sm'
              : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Program Settings</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: PAYOUT REQUESTS */}
      {/* ========================================================= */}
      {activeTab === 'payouts' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search payout ID, name, mobile, UPI..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-[#F72585] placeholder:text-slate-500"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {(['All', 'Pending', 'Paid', 'Rejected'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setPayoutFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    payoutFilter === st
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="rounded-3xl bg-slate-800/80 border border-slate-700/70 overflow-hidden shadow-lg">
            {filteredPayouts.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs font-bold">
                No withdrawal requests found matching this filter.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[700px]">
                  <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-slate-850 border-b border-slate-700">
                    <tr>
                      <th className="py-3 px-4">Payout ID / Date</th>
                      <th className="py-3 px-4">Partner Details</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">UPI ID</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions / Audit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {filteredPayouts.map((p) => {
                      const matchedPtr = partners.find((ptr) => ptr.id === p.partnerId);
                      return (
                        <tr key={p.id} className="hover:bg-slate-750/50 transition-colors">
                          <td className="py-3 px-4">
                            <span className="font-mono font-bold text-white block">{p.payoutId}</span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {new Date(p.createdAt).toLocaleString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-white">{p.partnerName}</span>
                              <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-purple-950 border border-purple-800 text-purple-300">
                                {p.partnerUserId}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 block font-mono">
                              📱 +91 {p.partnerMobile}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono font-black text-emerald-400 text-sm">
                            {currency}{p.amount.toLocaleString()}
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-mono font-bold text-purple-300 px-2 py-0.5 rounded bg-purple-950/60 border border-purple-800/80 inline-block">
                              {p.upiId}
                            </span>
                            {p.accountHolderName && (
                              <span className="text-[10px] text-slate-400 block mt-0.5">
                                Name: {p.accountHolderName}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {p.status === 'Paid' && (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-950/80 border border-emerald-800 text-emerald-300 flex items-center gap-1 w-fit">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                <span>Paid</span>
                              </span>
                            )}
                            {p.status === 'Pending' && (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-950/80 border border-amber-800 text-amber-300 flex items-center gap-1 w-fit animate-pulse">
                                <Clock className="w-3 h-3 text-amber-400" />
                                <span>Pending Action</span>
                              </span>
                            )}
                            {p.status === 'Rejected' && (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-950/80 border border-red-800 text-red-300 flex items-center gap-1 w-fit">
                                <XCircle className="w-3 h-3 text-red-400" />
                                <span>Rejected</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Audit Button */}
                              {matchedPtr && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenAudit(matchedPtr)}
                                  className="px-2.5 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                                  title="Audit Referral Orders"
                                >
                                  <Eye className="w-3.5 h-3.5 text-purple-400" />
                                  <span>Audit</span>
                                </button>
                              )}

                              {p.status === 'Pending' && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenProcessPayout(p, 'Paid')}
                                    className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Pay</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenProcessPayout(p, 'Rejected')}
                                    className="px-2.5 py-1.5 rounded-lg bg-red-950 hover:bg-red-900 border border-red-800 text-red-300 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                    <span>Reject</span>
                                  </button>
                                </>
                              )}

                              {p.status === 'Paid' && p.transactionRef && (
                                <span className="text-[10px] font-mono text-emerald-400 font-bold">
                                  UTR: {p.transactionRef}
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: PARTNERS DIRECTORY */}
      {/* ========================================================= */}
      {activeTab === 'partners' && (
        <div className="space-y-4">
          <div className="relative max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search partner ID, name, mobile, code..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-[#F72585] placeholder:text-slate-500"
            />
          </div>

          <div className="rounded-3xl bg-slate-800/80 border border-slate-700/70 overflow-hidden shadow-lg">
            {filteredPartners.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs font-bold">
                No partners found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[700px]">
                  <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-slate-850 border-b border-slate-700">
                    <tr>
                      <th className="py-3 px-4">Partner User ID</th>
                      <th className="py-3 px-4">Name & Mobile</th>
                      <th className="py-3 px-4">Referral Code</th>
                      <th className="py-3 px-4">Paid Orders</th>
                      <th className="py-3 px-4">Lifetime Earned</th>
                      <th className="py-3 px-4">Wallet Balance</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Audit & Controls</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {filteredPartners.map((ptr) => (
                      <tr key={ptr.id} className="hover:bg-slate-750/50 transition-colors">
                        <td className="py-3 px-4 font-mono font-black text-purple-300">
                          {ptr.userId}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-white block">{ptr.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            📱 +91 {ptr.mobile}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-[#F72585]">
                          {ptr.referralCode}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-white">
                          {ptr.totalOrdersCount || 0}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-200">
                          {currency}{Number(ptr.totalEarnings || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 font-mono font-black text-emerald-400">
                          {currency}{Number(ptr.walletBalance || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <button
                            type="button"
                            onClick={() => handleTogglePartnerStatus(ptr)}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer ${
                              ptr.active
                                ? 'bg-emerald-950/80 border border-emerald-800 text-emerald-300'
                                : 'bg-red-950/80 border border-red-800 text-red-300'
                            }`}
                          >
                            {ptr.active ? 'Active' : 'Suspended'}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleOpenAudit(ptr)}
                            className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-[#F72585] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer ml-auto transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Audit Orders</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: PARTNER SUPPORT TICKETS */}
      {/* ========================================================= */}
      {activeTab === 'tickets' && (
        <div className="space-y-4">
          {/* Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ticket ID, partner name, mobile, problem..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-[#F72585] placeholder:text-slate-500"
              />
            </div>

            {/* Status Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {(['All', 'Open', 'In Progress', 'Resolved', 'Closed'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setTicketFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    ticketFilter === st
                      ? 'bg-[#F72585] text-white shadow-xs'
                      : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                  }`}
                >
                  {st}
                  {st === 'Open' && openPartnerTickets.length > 0 && (
                    <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-900 text-[10px] font-black">
                      {openPartnerTickets.length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Tickets Table / List */}
          <div className="rounded-3xl bg-slate-800/80 border border-slate-700/70 overflow-hidden shadow-lg">
            {filteredPartnerTickets.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs font-bold space-y-1">
                <LifeBuoy className="w-8 h-8 mx-auto text-slate-500 mb-2" />
                <p>No partner support tickets found.</p>
                <p className="text-[11px] text-slate-500 font-normal">
                  When referral partners submit inquiries from their dashboard, they will appear right here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[850px]">
                  <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-slate-850 border-b border-slate-700">
                    <tr>
                      <th className="py-3 px-4">Ticket ID</th>
                      <th className="py-3 px-4">Partner Details</th>
                      <th className="py-3 px-4">Problem / Issue</th>
                      <th className="py-3 px-4">Discription</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Admin Reply</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {filteredPartnerTickets.map((tkt) => {
                      const isOpen = tkt.status === 'Open';
                      const isInProg = tkt.status === 'In Progress';
                      const isResolved = tkt.status === 'Resolved';

                      const badgeStyle = isOpen
                        ? 'bg-amber-950/80 border-amber-800 text-amber-300'
                        : isInProg
                        ? 'bg-blue-950/80 border-blue-800 text-blue-300'
                        : isResolved
                        ? 'bg-emerald-950/80 border-emerald-800 text-emerald-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400';

                      return (
                        <tr key={tkt.id} className="hover:bg-slate-750/50 transition-colors">
                          {/* Ticket ID & Date */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="font-mono font-bold text-white block">
                              {tkt.ticketId}
                            </span>
                            <span className="text-[10px] text-slate-400 block font-mono">
                              {new Date(tkt.createdAt).toLocaleDateString('en-GB', {
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </td>

                          {/* Partner info with WhatsApp & Call */}
                          <td className="py-3 px-4">
                            <div className="font-bold text-white">{tkt.partnerName}</div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[11px] text-slate-300 font-mono">
                                +91 {tkt.partnerMobile}
                              </span>
                              <a
                                href={`https://api.whatsapp.com/send?phone=91${tkt.partnerMobile.replace(/\D/g, '')}&text=Hello%20${encodeURIComponent(tkt.partnerName)},%20regarding%20your%20SkyRocket%20partner%20ticket%20${tkt.ticketId}:`}
                                target="_blank"
                                rel="noreferrer"
                                className="w-5 h-5 rounded-full bg-emerald-600/30 text-emerald-400 hover:bg-emerald-600 hover:text-white flex items-center justify-center transition-colors"
                                title="Chat on WhatsApp"
                              >
                                <MessageCircle className="w-3 h-3" />
                              </a>
                              <a
                                href={`tel:${tkt.partnerMobile}`}
                                className="w-5 h-5 rounded-full bg-blue-600/30 text-blue-400 hover:bg-blue-600 hover:text-white flex items-center justify-center transition-colors"
                                title="Call Partner"
                              >
                                <Phone className="w-3 h-3" />
                              </a>
                            </div>
                            <div className="text-[10px] text-purple-300 font-mono mt-0.5">
                              User: {tkt.partnerUserId} {tkt.referralCode ? `• Ref: ${tkt.referralCode}` : ''}
                            </div>
                          </td>

                          {/* Problem topic */}
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-md bg-purple-950/80 border border-purple-800 text-purple-300 font-bold text-[11px] inline-block">
                              {tkt.problem}
                            </span>
                          </td>

                          {/* Message Description */}
                          <td className="py-3 px-4 max-w-xs">
                            <p className="text-slate-300 text-xs line-clamp-2 leading-relaxed" title={tkt.message}>
                              {tkt.message}
                            </p>
                          </td>

                          {/* Status */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${badgeStyle}`}>
                              {tkt.status}
                            </span>
                          </td>

                          {/* Admin Reply status */}
                          <td className="py-3 px-4 max-w-[180px]">
                            {tkt.adminReply ? (
                              <div className="text-[11px] text-emerald-300 line-clamp-2 font-medium" title={tkt.adminReply}>
                                💬 {tkt.adminReply}
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-500 italic">No reply yet</span>
                            )}
                          </td>

                          {/* Action Button */}
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleOpenTicketReply(tkt)}
                              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>Reply / Status</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: PROGRAM SETTINGS */}
      {/* ========================================================= */}
      {activeTab === 'settings' && (
        <div className="max-w-xl rounded-3xl bg-slate-800/80 border border-slate-700/70 p-6 space-y-5">
          <div>
            <h3 className="text-base font-black text-white">Affiliate Program Settings</h3>
            <p className="text-xs text-slate-400">
              Configure the default commission percentage and minimum withdrawal requirements.
            </p>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Default Commission Percentage (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(Number(e.target.value))}
                  min={1}
                  max={100}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold font-mono focus:outline-none focus:border-[#F72585]"
                  required
                />
                <span className="absolute right-3.5 top-2.5 text-xs font-black text-slate-400 pointer-events-none">
                  %
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Currently set to <strong>{commissionRate}%</strong>. When an order is Paid, partner receives {commissionRate}% of the order amount.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Minimum Withdrawal Amount ({currency})
              </label>
              <input
                type="number"
                value={minWithdrawal}
                onChange={(e) => setMinWithdrawal(Number(e.target.value))}
                min={10}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold font-mono focus:outline-none focus:border-[#F72585]"
                required
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Partners cannot request withdrawal below this threshold.
              </p>
            </div>

            <button
              type="submit"
              disabled={isSavingSettings}
              className="px-5 py-2.5 rounded-xl bg-[#F72585] hover:bg-[#E01E75] text-white text-xs font-black flex items-center gap-1.5 shadow-md shadow-pink-600/30 cursor-pointer disabled:opacity-50"
            >
              {isSavingSettings ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Settings</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* ========================================================= */}
      {/* AUDIT MODAL: INSPECT ALL ORDERS GENERATED BY THIS PARTNER */}
      {/* ========================================================= */}
      {auditPartner && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <span>Referral Audit: {auditPartner.name}</span>
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-purple-950 border border-purple-800 text-purple-300">
                    {auditPartner.userId}
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Mobile: +91 {auditPartner.mobile} • Code: <span className="text-[#F72585] font-bold">{auditPartner.referralCode}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAuditPartner(null)}
                className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Partner Snapshot */}
            <div className="grid grid-cols-3 gap-3 p-3.5 rounded-2xl bg-slate-800/60 border border-slate-750">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Wallet Balance</span>
                <span className="font-mono font-black text-emerald-400 text-base">
                  {currency}{auditPartner.walletBalance}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Lifetime Earned</span>
                <span className="font-mono font-black text-white text-base">
                  {currency}{auditPartner.totalEarnings}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Paid Orders</span>
                <span className="font-mono font-black text-purple-300 text-base">
                  {auditPartner.totalOrdersCount} orders
                </span>
              </div>
            </div>

            {/* Audit Commissions Table */}
            <div>
              <h4 className="text-xs font-bold text-white mb-2">Orders Generating Commission:</h4>
              {auditCommissions.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs rounded-2xl bg-slate-800/40 border border-slate-800">
                  No commission records found for this partner.
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-800 overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="text-[10px] uppercase tracking-wider text-slate-400 bg-slate-800 border-b border-slate-750">
                      <tr>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Order ID</th>
                        <th className="py-2.5 px-3">Service</th>
                        <th className="py-2.5 px-3">Order Value</th>
                        <th className="py-2.5 px-3 font-mono">Commission</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {auditCommissions.map((comm) => (
                        <tr key={comm.id} className="hover:bg-slate-800/30">
                          <td className="py-2 px-3 text-slate-400 font-mono text-[10px]">
                            {new Date(comm.createdAt).toLocaleString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className="py-2 px-3 font-mono font-bold text-white">
                            {comm.orderId}
                          </td>
                          <td className="py-2 px-3 text-slate-300">
                            {comm.categoryName} • {comm.serviceName}
                          </td>
                          <td className="py-2 px-3 font-mono text-slate-300">
                            {currency}{comm.orderAmount}
                          </td>
                          <td className="py-2 px-3 font-mono font-black text-emerald-400">
                            +{currency}{comm.commissionAmount}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setAuditPartner(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* PROCESS PAYOUT MODAL: MARK PAID OR REJECT */}
      {/* ========================================================= */}
      {processPayoutModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                {processPayoutModal.action === 'Paid' ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span>Approve & Mark Payout as Paid</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-red-400" />
                    <span>Reject Payout Request</span>
                  </>
                )}
              </h3>
              <button
                type="button"
                onClick={() => setProcessPayoutModal(null)}
                className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-750 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Partner:</span>
                <span className="font-bold text-white">
                  {processPayoutModal.payout.partnerName} ({processPayoutModal.payout.partnerUserId})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Amount:</span>
                <span className="font-mono font-black text-emerald-400 text-sm">
                  {currency}{processPayoutModal.payout.amount}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">UPI ID:</span>
                <span className="font-mono font-bold text-purple-300">
                  {processPayoutModal.payout.upiId}
                </span>
              </div>
            </div>

            {processPayoutModal.action === 'Paid' && (
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Bank UTR / Transaction Reference (Optional)
                </label>
                <input
                  type="text"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  placeholder="e.g. UPI Ref #428192849182"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-emerald-400 placeholder:text-slate-500"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Admin Note / Remarks
              </label>
              <input
                type="text"
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Reason or notes..."
                className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-slate-500"
              />
              {processPayoutModal.action === 'Rejected' && (
                <p className="text-[10px] text-amber-300 mt-1">
                  ⚠️ Rejecting this request will immediately refund {currency}{processPayoutModal.payout.amount} back to the partner's wallet.
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setProcessPayoutModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleConfirmProcessPayout}
                className={`px-4 py-2 rounded-xl text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                  processPayoutModal.action === 'Paid'
                    ? 'bg-emerald-600 hover:bg-emerald-500'
                    : 'bg-red-600 hover:bg-red-500'
                }`}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : processPayoutModal.action === 'Paid' ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Confirm Paid</span>
                  </>
                ) : (
                  <>
                    <X className="w-3.5 h-3.5" />
                    <span>Confirm Reject</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* PARTNER TICKET REPLY / STATUS MODAL */}
      {/* ========================================================= */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-4 animate-scale-up">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <LifeBuoy className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="text-base font-black text-white leading-tight">
                    Partner Ticket: {selectedTicket.ticketId}
                  </h3>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Created on {new Date(selectedTicket.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Partner Details Card */}
            <div className="p-3.5 rounded-2xl bg-slate-800/70 border border-slate-750 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Partner:</span>
                <span className="font-bold text-white">
                  {selectedTicket.partnerName} ({selectedTicket.partnerUserId})
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Mobile / WhatsApp:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-purple-300 font-bold">
                    +91 {selectedTicket.partnerMobile}
                  </span>
                  <a
                    href={`https://api.whatsapp.com/send?phone=91${selectedTicket.partnerMobile.replace(/\D/g, '')}&text=Hello%20${encodeURIComponent(selectedTicket.partnerName)},%20regarding%20ticket%20${selectedTicket.ticketId}:`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2 py-0.5 rounded bg-emerald-600/30 text-emerald-400 hover:bg-emerald-600 hover:text-white text-[10px] font-bold flex items-center gap-1 transition-colors"
                  >
                    <MessageCircle className="w-3 h-3" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>
              {selectedTicket.referralCode && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Referral Code:</span>
                  <span className="font-mono font-bold text-[#F72585]">
                    {selectedTicket.referralCode}
                  </span>
                </div>
              )}
            </div>

            {/* Problem & Message */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400">Problem:</span>
                <span className="px-2 py-0.5 rounded bg-purple-950 border border-purple-800 text-purple-300 text-xs font-bold">
                  {selectedTicket.problem}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-800 border border-slate-700/80 text-xs text-slate-200 leading-relaxed max-h-36 overflow-y-auto">
                {selectedTicket.message}
              </div>
            </div>

            {/* Change Status */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Ticket Status
              </label>
              <select
                value={ticketStatus}
                onChange={(e) => setTicketStatus(e.target.value as TicketStatus)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-indigo-400 cursor-pointer"
              >
                <option value="Open">Open (Pending Review)</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
              </select>
            </div>

            {/* Admin Response */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Admin Response (Visible on Partner Dashboard)
              </label>
              <textarea
                value={ticketReply}
                onChange={(e) => setTicketReply(e.target.value)}
                rows={3}
                placeholder="Write resolution, UPI transaction info, or instructions for partner..."
                className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-400 placeholder:text-slate-500 resize-none"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSavingTicket}
                onClick={handleSaveTicketReply}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isSavingTicket ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Response & Update Status</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
