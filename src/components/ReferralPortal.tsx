import React, { useState, useEffect, useMemo } from 'react';
import { Partner, PartnerCommission, PayoutRequest, PartnerTicket, WebsiteSettings } from '../types';
import { dbService } from '../lib/db';
import {
  Home,
  Landmark,
  FileText,
  ShoppingBag,
  Eye,
  EyeOff,
  User,
  Phone,
  Lock,
  ChevronRight,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Wallet,
  Share2,
  Copy,
  Check,
  Info,
  Percent,
  AlertCircle,
  CheckCircle2,
  Loader2,
  LogOut,
  RefreshCw,
  X,
  LifeBuoy,
  Send,
  MessageSquare,
} from 'lucide-react';

interface ReferralPortalProps {
  settings?: WebsiteSettings;
  onNavigateHome?: () => void;
}

type TabType = 'home' | 'withdrawal' | 'transactions' | 'purchases';

export const ReferralPortal: React.FC<ReferralPortalProps> = ({ settings, onNavigateHome }) => {
  const [partner, setPartner] = useState<Partner | null>(null);
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [currentTab, setCurrentTab] = useState<TabType>('home');

  // Form states - Register
  const [regName, setRegName] = useState('');
  const [regMobile, setRegMobile] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);

  // Form states - Login
  const [loginMobile, setLoginMobile] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Form states - Withdrawal
  const [payoutAmount, setPayoutAmount] = useState<number | ''>('');
  const [payoutUpi, setPayoutUpi] = useState('');

  // Status & loaders
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showCommissionModal, setShowCommissionModal] = useState(false);

  // Partner Ticket states
  const [partnerTickets, setPartnerTickets] = useState<PartnerTicket[]>([]);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [ticketView, setTicketView] = useState<'create' | 'list'>('create');
  const [ticketName, setTicketName] = useState('');
  const [ticketMobile, setTicketMobile] = useState('');
  const [ticketProblem, setTicketProblem] = useState('Payout Issue');
  const [ticketCustomProblem, setTicketCustomProblem] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);

  // Partner Ticket actions
  const handleOpenTicketModal = (view: 'create' | 'list' = 'create') => {
    if (partner) {
      setTicketName(partner.name);
      setTicketMobile(partner.mobile);
    }
    setTicketView(view);
    setShowTicketModal(true);
  };

  const handleCreatePartnerTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partner) return;

    const finalProblem = ticketProblem === 'Other Problem' && ticketCustomProblem.trim()
      ? ticketCustomProblem.trim()
      : ticketProblem;

    if (!ticketMessage.trim()) {
      setErrorMessage('Please enter your problem description.');
      return;
    }

    setIsSubmittingTicket(true);
    try {
      await dbService.createPartnerTicket({
        partnerId: partner.id,
        partnerUserId: partner.userId,
        partnerName: ticketName.trim() || partner.name,
        partnerMobile: ticketMobile.trim() || partner.mobile,
        referralCode: partner.referralCode,
        problem: finalProblem,
        message: ticketMessage.trim(),
      });
      setSuccessMessage('Support ticket raised successfully! Admin has been notified.');
      setTicketMessage('');
      setTicketCustomProblem('');
      setTicketView('list');
      await loadPartnerHistory(partner.id);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to submit ticket. Please try again.');
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  // Transaction tab filter: All | Earnings | Withdrawal
  const [txnFilter, setTxnFilter] = useState<'all' | 'earnings' | 'withdrawal'>('all');

  // History data
  const [commissions, setCommissions] = useState<PartnerCommission[]>([]);
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const currency = settings?.defaultCurrency || '₹';
  const commissionRate = settings?.referralCommissionPercent ?? 30;
  const minWithdrawal = settings?.referralMinWithdrawal ?? 200;

  // Restore session from localStorage if logged in
  useEffect(() => {
    try {
      const savedPartnerId = localStorage.getItem('sky_partner_session_id');
      if (savedPartnerId) {
        dbService.getPartnerById(savedPartnerId).then((p) => {
          if (p && p.active) {
            setPartner(p);
          }
        });
      }
    } catch {}
  }, []);

  // Fetch partner data, commissions, payouts & tickets
  const loadPartnerHistory = async (partnerId: string) => {
    setIsRefreshing(true);
    try {
      const [p, comms, pays, tkts] = await Promise.all([
        dbService.getPartnerById(partnerId),
        dbService.getCommissionsForPartner(partnerId),
        dbService.getPayoutRequestsForPartner(partnerId),
        dbService.getPartnerTickets(partnerId),
      ]);
      if (p) setPartner(p);
      setCommissions(comms);
      setPayouts(pays);
      setPartnerTickets(tkts);
    } catch (e) {
      console.error('Error loading partner history:', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (partner?.id) {
      loadPartnerHistory(partner.id);
      const unsub = dbService.subscribe(() => {
        loadPartnerHistory(partner.id);
      });
      return unsub;
    }
  }, [partner?.id]);

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      const loggedPartner = await dbService.partnerLogin(loginMobile, loginPassword);
      if (loggedPartner) {
        setPartner(loggedPartner);
        try {
          localStorage.setItem('sky_partner_session_id', loggedPartner.id);
        } catch {}
        setCurrentTab('home');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Login failed. Please verify your mobile number and password.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Register
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (regPassword !== regConfirmPassword) {
      setErrorMessage('Passwords do not match. Please verify.');
      return;
    }

    setIsLoading(true);
    try {
      const newPartner = await dbService.createPartner({
        name: regName,
        mobile: regMobile,
        password: regPassword,
      });

      setPartner(newPartner);
      try {
        localStorage.setItem('sky_partner_session_id', newPartner.id);
      } catch {}
      setCurrentTab('home');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Registration failed. Please check your inputs.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Logout
  const handleLogout = () => {
    setPartner(null);
    setShowProfileModal(false);
    try {
      localStorage.removeItem('sky_partner_session_id');
    } catch {}
  };

  // Handle Payout Request
  const handleRequestPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partner) return;

    setErrorMessage(null);
    setSuccessMessage(null);

    const amount = Number(payoutAmount);
    if (!amount || amount < minWithdrawal) {
      setErrorMessage(`Minimum withdrawal amount is ${currency}${minWithdrawal}.`);
      return;
    }

    if (amount > Number(partner.walletBalance || 0)) {
      setErrorMessage(`Insufficient balance! Your current wallet balance is ${currency}${partner.walletBalance}.`);
      return;
    }

    if (!payoutUpi.trim()) {
      setErrorMessage('Please enter your valid UPI ID.');
      return;
    }

    setIsLoading(true);
    try {
      await dbService.createPayoutRequest({
        partnerId: partner.id,
        amount,
        upiId: payoutUpi.trim(),
        accountHolderName: partner.name,
      });

      setSuccessMessage(`Withdrawal request of ${currency}${amount} submitted! It will be processed within 24 hours.`);
      setPayoutAmount('');
      await loadPartnerHistory(partner.id);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to submit withdrawal request.');
    } finally {
      setIsLoading(false);
    }
  };

  // Referral link
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://skyrocketsmm.in';
  const referralLink = partner ? `${origin}/?ref=${partner.referralCode}` : '';

  const copyLinkToClipboard = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2200);
  };

  const shareReferralLink = () => {
    if (!referralLink) return;
    if (navigator.share) {
      navigator.share({
        title: 'SkyRocket SMM - Social Growth',
        text: `Boost your Instagram, YouTube & social media growth instantly! Order with 24x7 support:`,
        url: referralLink,
      }).catch(() => {});
    } else {
      const text = encodeURIComponent(
        `🚀 *SkyRocket SMM - Real Social Media Growth*\nGet Followers, Views, Likes at lowest price!\n👉 Order now: ${referralLink}`
      );
      window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
    }
  };

  // Calculate Today's Earnings
  const todayEarnings = useMemo(() => {
    const today = new Date().toDateString();
    return commissions
      .filter((c) => new Date(c.createdAt).toDateString() === today)
      .reduce((sum, c) => sum + (Number(c.commissionAmount) || 0), 0);
  }, [commissions]);

  // Combined Transactions List (Earnings + Withdrawals sorted by date)
  const combinedTransactions = useMemo(() => {
    type TxnItem = {
      id: string;
      type: 'earning' | 'withdrawal';
      title: string;
      date: string;
      amount: number;
      status: string;
      statusBadge: 'Credit' | 'Pending' | 'Completed' | 'Rejected';
    };

    const earningsList: TxnItem[] = commissions.map((c) => ({
      id: c.id,
      type: 'earning',
      title: 'Commission Earned',
      date: c.createdAt,
      amount: c.commissionAmount,
      status: 'Credit',
      statusBadge: 'Credit',
    }));

    const withdrawalsList: TxnItem[] = payouts.map((p) => {
      let badge: 'Pending' | 'Completed' | 'Rejected' = 'Pending';
      if (p.status === 'Paid') badge = 'Completed';
      else if (p.status === 'Rejected') badge = 'Rejected';

      return {
        id: p.id,
        type: 'withdrawal',
        title: 'Withdrawal Request',
        date: p.createdAt,
        amount: p.amount,
        status: p.status,
        statusBadge: badge,
      };
    });

    const merged = [...earningsList, ...withdrawalsList].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    if (txnFilter === 'earnings') return merged.filter((t) => t.type === 'earning');
    if (txnFilter === 'withdrawal') return merged.filter((t) => t.type === 'withdrawal');
    return merged;
  }, [commissions, payouts, txnFilter]);

  // Platform icon helper for Purchase History
  const getPlatformIcon = (serviceOrCategoryName: string) => {
    const lower = serviceOrCategoryName.toLowerCase();
    if (lower.includes('youtube') || lower.includes('yt')) {
      return (
        <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
          </svg>
        </div>
      );
    }
    // Default to Instagram / gradient purple
    return (
      <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
        </svg>
      </div>
    );
  };

  // Helper date formatter: "Oct 06, 2026 • 10:24 AM"
  const formatDateTime = (isoDate: string) => {
    try {
      const d = new Date(isoDate);
      const datePart = d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
      const timePart = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      return `${datePart} • ${timePart}`;
    } catch {
      return isoDate;
    }
  };

  // =========================================================================
  // VIEW: AUTHENTICATION (LOGIN OR REGISTER) - MATCHING MOCKUP SCREENS 1 & 2
  // =========================================================================
  if (!partner) {
    return (
      <div className="min-h-screen bg-white flex flex-col justify-between selection:bg-blue-100">
        <div className="max-w-md w-full mx-auto px-6 py-10 flex-1 flex flex-col justify-center">
          {/* Top Brand Logo / Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              SkyRocket <span className="text-[#1877F2]">SMM</span>
            </h1>
            <p className="text-xs font-semibold text-slate-400 mt-1">
              Earn More Together
            </p>
          </div>

          {/* Alert Message Banner */}
          {errorMessage && (
            <div className="mb-5 p-3 rounded-2xl bg-red-50 border border-red-200 text-red-600 text-xs font-semibold flex items-center gap-2 animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* SCREEN 1: LOGIN FORM */}
          {authView === 'login' ? (
            <div className="space-y-6">
              <div className="text-center space-y-1.5">
                <h2 className="text-xl font-bold text-slate-900">
                  Login to Your Account
                </h2>
                <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                  Access your referral dashboard and start earning 30% commission.
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                {/* Mobile Number Field */}
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={loginMobile}
                    onChange={(e) => setLoginMobile(e.target.value)}
                    placeholder="Mobile Number"
                    maxLength={10}
                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white border border-slate-200 text-slate-900 text-sm font-medium focus:outline-none focus:border-[#1877F2] focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-400"
                    required
                  />
                </div>

                {/* Password Field */}
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full pl-11 pr-11 py-3.5 rounded-2xl bg-white border border-slate-200 text-slate-900 text-sm font-medium focus:outline-none focus:border-[#1877F2] focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-400"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Login Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 rounded-2xl bg-[#1877F2] hover:bg-[#1464c9] active:scale-[0.99] text-white text-sm font-bold shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Logging in...</span>
                    </>
                  ) : (
                    <span>Login</span>
                  )}
                </button>
              </form>

              {/* Bottom Switch to Register */}
              <div className="text-center pt-4 border-t border-slate-100">
                <p className="text-xs text-slate-600">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthView('register');
                      setErrorMessage(null);
                    }}
                    className="text-[#1877F2] font-bold hover:underline cursor-pointer ml-1"
                  >
                    Register Now
                  </button>
                </p>
              </div>
            </div>
          ) : (
            /* SCREEN 2: CREATE YOUR ACCOUNT / REGISTER FORM */
            <div className="space-y-6">
              <div className="text-center space-y-1.5">
                <h2 className="text-xl font-bold text-slate-900">
                  Create Your Account
                </h2>
                <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                  Join our referral program and earn 30% commission on every purchase.
                </p>
              </div>

              <form onSubmit={handleRegister} className="space-y-3.5">
                {/* Full Name */}
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Full Name"
                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white border border-slate-200 text-slate-900 text-sm font-medium focus:outline-none focus:border-[#1877F2] focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-400"
                    required
                  />
                </div>

                {/* Mobile Number */}
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={regMobile}
                    onChange={(e) => setRegMobile(e.target.value)}
                    placeholder="Mobile Number"
                    maxLength={10}
                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white border border-slate-200 text-slate-900 text-sm font-medium focus:outline-none focus:border-[#1877F2] focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-400"
                    required
                  />
                </div>

                {/* Password */}
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full pl-11 pr-11 py-3.5 rounded-2xl bg-white border border-slate-200 text-slate-900 text-sm font-medium focus:outline-none focus:border-[#1877F2] focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-400"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Confirm Password */}
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type={showRegConfirmPassword ? 'text' : 'password'}
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="Confirm Password"
                    className="w-full pl-11 pr-11 py-3.5 rounded-2xl bg-white border border-slate-200 text-slate-900 text-sm font-medium focus:outline-none focus:border-[#1877F2] focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-400"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showRegConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Create Account Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 rounded-2xl bg-[#1877F2] hover:bg-[#1464c9] active:scale-[0.99] text-white text-sm font-bold shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 mt-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <span>Create Account</span>
                  )}
                </button>
              </form>

              {/* Terms disclaimer */}
              <p className="text-[11px] text-slate-400 text-center leading-relaxed">
                By registering, you agree to our <span className="text-slate-600 font-semibold">Terms & Conditions</span> and <span className="text-slate-600 font-semibold">Privacy Policy</span>.
              </p>

              {/* Bottom Switch to Login */}
              <div className="text-center pt-3 border-t border-slate-100">
                <p className="text-xs text-slate-600">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthView('login');
                      setErrorMessage(null);
                    }}
                    className="text-[#1877F2] font-bold hover:underline cursor-pointer ml-1"
                  >
                    Login
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* Back to main website link */}
          <div className="text-center mt-6">
            <button
              onClick={onNavigateHome}
              className="text-xs font-semibold text-slate-400 hover:text-slate-700 transition-colors"
            >
              ← Back to Main Store
            </button>
          </div>
        </div>

        {/* Decorative subtle blue bottom wave illustration */}
        <div className="w-full h-16 bg-gradient-to-t from-blue-50/60 to-transparent pointer-events-none" />
      </div>
    );
  }

  // =========================================================================
  // VIEW: AUTHENTICATED PARTNER PORTAL (MATCHING EXACT MOCKUP SCREENS)
  // =========================================================================
  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-900 pb-24 selection:bg-blue-100">
      <div className="max-w-md mx-auto px-4 pt-4 sm:pt-6 space-y-4">

        {/* Global Toast / Success Banner */}
        {successMessage && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between gap-2 shadow-xs animate-fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
            <button onClick={() => setSuccessMessage(null)} className="text-emerald-500 hover:text-emerald-700">✕</button>
          </div>
        )}

        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center justify-between gap-2 shadow-xs animate-fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{errorMessage}</span>
            </div>
            <button onClick={() => setErrorMessage(null)} className="text-red-400 hover:text-red-700">✕</button>
          </div>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* SUB-VIEW 1: HOME DASHBOARD (Matches Image 2 - Screen 3) */}
        {/* ----------------------------------------------------------------- */}
        {currentTab === 'home' && (
          <div className="space-y-4">
            {/* Top Bar: Brand Title & User Initial Avatar */}
            <div className="flex items-center justify-between py-1">
              <h1 className="text-lg font-black text-slate-900 tracking-tight">
                SkyRocket <span className="text-[#1877F2]">SMM</span>
              </h1>

              {/* User Avatar Circle */}
              <button
                type="button"
                onClick={() => setShowProfileModal(true)}
                className="w-9 h-9 rounded-full bg-[#0F172A] text-white flex items-center justify-center font-bold text-sm shadow-xs hover:scale-105 active:scale-95 transition-all cursor-pointer"
                title="Account Profile"
              >
                {partner.name ? partner.name.charAt(0).toUpperCase() : 'S'}
              </button>
            </div>

            {/* Total Earnings Card */}
            <div className="p-5 rounded-3xl bg-[#F0F5FF] border border-blue-100 shadow-xs space-y-1">
              <span className="text-xs font-semibold text-slate-500">
                Total Earnings
              </span>
              <div className="text-3xl font-black text-slate-900 tracking-tight">
                {currency}{Number(partner.totalEarnings || 0).toLocaleString()}
              </div>
            </div>

            {/* 2-Column Row: Today's Earnings & Wallet Balance */}
            <div className="grid grid-cols-2 gap-3">
              {/* Today's Earnings */}
              <div className="p-4 rounded-3xl bg-white border border-slate-100 shadow-xs flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <ArrowUp className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 block leading-tight">
                    Today's Earnings
                  </span>
                  <span className="text-base font-black text-slate-900 mt-0.5 block">
                    {currency}{todayEarnings.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Wallet Balance */}
              <div className="p-4 rounded-3xl bg-white border border-slate-100 shadow-xs flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#1877F2] flex items-center justify-center shrink-0">
                  <Wallet className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 block leading-tight">
                    Wallet Balance
                  </span>
                  <span className="text-base font-black text-slate-900 mt-0.5 block">
                    {currency}{Number(partner.walletBalance || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Your Referral Link Card */}
            <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-100 shadow-xs space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-blue-50 text-[#1877F2] flex items-center justify-center">
                  <svg className="w-4 h-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                  </svg>
                </div>
                <span className="text-xs font-bold text-slate-800">Your Referral Link</span>
              </div>

              {/* Link Input with Copy Icon inside */}
              <div className="flex items-center rounded-2xl bg-slate-50 border border-slate-200/80 p-1.5 pl-3.5 gap-2">
                <span className="text-xs font-medium text-slate-600 truncate flex-1 select-all font-mono">
                  {referralLink}
                </span>
                <button
                  type="button"
                  onClick={copyLinkToClipboard}
                  className="w-8 h-8 rounded-xl bg-[#1877F2] hover:bg-[#1464c9] text-white flex items-center justify-center shrink-0 transition-all cursor-pointer shadow-xs active:scale-95"
                  title="Copy link"
                >
                  {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              {/* Solid Blue Share Link Button */}
              <button
                type="button"
                onClick={shareReferralLink}
                className="w-full py-3 rounded-2xl bg-[#1877F2] hover:bg-[#1464c9] active:scale-[0.99] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm shadow-blue-500/20 transition-all cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>Share Link</span>
              </button>
            </div>

            {/* 30% Your Commission Promo Banner */}
            <div className="p-4 sm:p-5 rounded-3xl bg-[#E8F8F0] border border-emerald-100 flex items-center gap-4">
              <div className="text-3xl sm:text-4xl font-black text-emerald-600 tracking-tight shrink-0">
                {commissionRate}%
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Your Commission</h4>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                  Earn {commissionRate}% commission on every purchase made through your link.
                </p>
              </div>
            </div>

            {/* Quick Navigation Menu List */}
            <div className="rounded-3xl bg-white border border-slate-100 shadow-xs divide-y divide-slate-100 overflow-hidden">
              {/* Withdrawal */}
              <button
                type="button"
                onClick={() => setCurrentTab('withdrawal')}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50/80 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-2xl bg-blue-50 text-[#1877F2] flex items-center justify-center shrink-0">
                    <Landmark className="w-4.5 h-4.5 stroke-[2.2]" />
                  </div>
                  <span className="text-sm font-bold text-slate-800">Withdrawal</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

              {/* Transactions */}
              <button
                type="button"
                onClick={() => setCurrentTab('transactions')}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50/80 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                    <FileText className="w-4.5 h-4.5 stroke-[2.2]" />
                  </div>
                  <span className="text-sm font-bold text-slate-800">Transactions</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

              {/* Purchase History */}
              <button
                type="button"
                onClick={() => setCurrentTab('purchases')}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50/80 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                    <ShoppingBag className="w-4.5 h-4.5 stroke-[2.2]" />
                  </div>
                  <span className="text-sm font-bold text-slate-800">Purchase History</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

              {/* Commission Details */}
              <button
                type="button"
                onClick={() => setShowCommissionModal(true)}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50/80 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <Percent className="w-4.5 h-4.5 stroke-[2.2]" />
                  </div>
                  <span className="text-sm font-bold text-slate-800">Commission Details</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

              {/* Ticket / Support Option */}
              <button
                type="button"
                onClick={() => handleOpenTicketModal('create')}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50/80 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                    <LifeBuoy className="w-4.5 h-4.5 stroke-[2.2]" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-slate-800 block">Ticket & Support</span>
                    <span className="text-[11px] text-slate-400 block font-medium">Raise issue or check replies</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {partnerTickets.filter((t) => t.status === 'Open' || t.status === 'In Progress').length > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-mono">
                      {partnerTickets.filter((t) => t.status === 'Open' || t.status === 'In Progress').length} Active
                    </span>
                  )}
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* SUB-VIEW 2: WITHDRAWAL SCREEN (Matches Image 1 - Screen 1) */}
        {/* ----------------------------------------------------------------- */}
        {currentTab === 'withdrawal' && (
          <div className="space-y-4">
            {/* Top Bar with Back Arrow */}
            <div className="flex items-center justify-between py-1 relative">
              <button
                type="button"
                onClick={() => setCurrentTab('home')}
                className="w-9 h-9 rounded-full bg-white border border-slate-200/80 text-slate-700 flex items-center justify-center hover:bg-slate-50 active:scale-95 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4.5 h-4.5" />
              </button>
              <h2 className="text-base font-bold text-slate-900 absolute left-1/2 -translate-x-1/2">
                Withdrawal
              </h2>
              <div className="w-9" />
            </div>

            {/* Available Balance Card */}
            <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-100 shadow-xs flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-[#EAF2FF] text-[#1877F2] flex items-center justify-center shrink-0">
                <Wallet className="w-5 h-5 stroke-[2.3]" />
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-400 block">
                  Available Balance
                </span>
                <span className="text-2xl font-black text-slate-900 mt-0.5 block tracking-tight">
                  {currency}{Number(partner.walletBalance || 0).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Enter Withdrawal Amount Section */}
            <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-100 shadow-xs space-y-3.5">
              <h3 className="text-xs font-bold text-slate-900">
                Enter Withdrawal Amount
              </h3>

              {/* Amount Input */}
              <div className="relative">
                <span className="text-base font-black text-slate-400 absolute left-4 top-1/2 -translate-y-1/2">
                  ₹
                </span>
                <input
                  type="number"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Enter amount"
                  min={minWithdrawal}
                  max={partner.walletBalance}
                  className="w-full pl-9 pr-4 py-3 rounded-2xl bg-white border border-slate-200 text-slate-900 text-sm font-bold focus:outline-none focus:border-[#1877F2] focus:ring-2 focus:ring-blue-100 placeholder:text-slate-400"
                />
              </div>

              {/* Quick Preset Pills */}
              <div className="grid grid-cols-4 gap-2">
                {[500, 1000, 2000, 5000].map((amt) => {
                  const isSelected = payoutAmount === amt;
                  return (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setPayoutAmount(amt)}
                      className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#1877F2] text-white shadow-xs'
                          : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-100'
                      }`}
                    >
                      ₹{amt.toLocaleString()}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Payment Method Section */}
            <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-100 shadow-xs space-y-3.5">
              <h3 className="text-xs font-bold text-slate-900">
                Payment Method
              </h3>

              {/* UPI Card Container */}
              <div className="p-3.5 rounded-2xl bg-white border border-blue-200/90 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Multi-color UPI Icon */}
                    <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center shrink-0">
                      <span className="text-[11px] font-black text-emerald-600 tracking-tighter">UPI</span>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 block leading-tight">
                        UPI (Recommended)
                      </span>
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        Directly to your UPI ID
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>

                {/* Enter UPI ID Field */}
                <div className="space-y-1">
                  <div className="relative">
                    <span className="text-xs font-black text-emerald-600 absolute left-3.5 top-1/2 -translate-y-1/2">
                      UPI
                    </span>
                    <input
                      type="text"
                      value={payoutUpi}
                      onChange={(e) => setPayoutUpi(e.target.value)}
                      placeholder="Enter UPI ID"
                      className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs font-bold focus:outline-none focus:border-[#1877F2] placeholder:text-slate-400"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 pl-1">
                    Example: sahil@ybl, name@oksbi, phone@paytm
                  </p>
                </div>
              </div>

              {/* Request Withdrawal Button */}
              <button
                type="button"
                onClick={handleRequestPayout}
                disabled={isLoading || Number(partner.walletBalance || 0) < minWithdrawal}
                className="w-full py-3.5 rounded-2xl bg-[#1877F2] hover:bg-[#1464c9] active:scale-[0.99] text-white text-sm font-bold shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing Request...</span>
                  </>
                ) : (
                  <span>Request Withdrawal</span>
                )}
              </button>

              {/* Info Notice Box */}
              <div className="p-3.5 rounded-2xl bg-[#F0F5FF] border border-blue-100 flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-[#1877F2] text-white flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold">
                  i
                </div>
                <p className="text-xs text-slate-600 leading-snug">
                  Your withdrawal request will be processed within 24 hours.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* SUB-VIEW 3: TRANSACTIONS SCREEN (Matches Image 1 - Screen 2) */}
        {/* ----------------------------------------------------------------- */}
        {currentTab === 'transactions' && (
          <div className="space-y-4">
            {/* Top Bar with Back Arrow */}
            <div className="flex items-center justify-between py-1 relative">
              <button
                type="button"
                onClick={() => setCurrentTab('home')}
                className="w-9 h-9 rounded-full bg-white border border-slate-200/80 text-slate-700 flex items-center justify-center hover:bg-slate-50 active:scale-95 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4.5 h-4.5" />
              </button>
              <h2 className="text-base font-bold text-slate-900 absolute left-1/2 -translate-x-1/2">
                Transactions
              </h2>
              <button
                type="button"
                onClick={() => loadPartnerHistory(partner.id)}
                className="w-9 h-9 rounded-full bg-white border border-slate-200/80 text-slate-700 flex items-center justify-center hover:bg-slate-50 transition-all cursor-pointer"
                title="Refresh"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Filter Tabs Pill */}
            <div className="flex rounded-2xl bg-slate-100 p-1">
              {(['all', 'earnings', 'withdrawal'] as const).map((tab) => {
                const isSelected = txnFilter === tab;
                const label = tab === 'all' ? 'All' : tab === 'earnings' ? 'Earnings' : 'Withdrawal';
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setTxnFilter(tab)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#1877F2] text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Transactions Feed List */}
            <div className="space-y-2.5">
              {combinedTransactions.length === 0 ? (
                <div className="p-12 text-center rounded-3xl bg-white border border-slate-100 shadow-xs space-y-2">
                  <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <FileText className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold text-slate-700">No transactions recorded yet</p>
                  <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                    When customers purchase through your link or when you request payouts, they will appear here.
                  </p>
                </div>
              ) : (
                combinedTransactions.map((item) => (
                  <div
                    key={`${item.type}-${item.id}`}
                    className="p-3.5 sm:p-4 rounded-3xl bg-white border border-slate-100 shadow-xs flex items-center justify-between gap-3"
                  >
                    {/* Left Icon + Title + Date */}
                    <div className="flex items-center gap-3">
                      {item.type === 'earning' ? (
                        <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                          <ArrowUp className="w-5 h-5 stroke-[2.5]" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center shrink-0">
                          <ArrowDown className="w-5 h-5 stroke-[2.5]" />
                        </div>
                      )}
                      <div>
                        <span className="text-xs font-bold text-slate-900 block leading-tight">
                          {item.title}
                        </span>
                        <span className="text-[11px] text-slate-400 block mt-0.5 font-medium">
                          {formatDateTime(item.date)}
                        </span>
                      </div>
                    </div>

                    {/* Right Amount + Status Badge */}
                    <div className="text-right shrink-0">
                      <span
                        className={`text-sm font-black block font-mono ${
                          item.type === 'earning' ? 'text-emerald-600' : 'text-slate-900'
                        }`}
                      >
                        {item.type === 'earning' ? `+ ₹${item.amount.toLocaleString()}` : `- ₹${item.amount.toLocaleString()}`}
                      </span>

                      {/* Status Badge */}
                      {item.statusBadge === 'Credit' && (
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-0.5">
                          Credit
                        </span>
                      )}
                      {item.statusBadge === 'Pending' && (
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full inline-block mt-0.5">
                          Pending
                        </span>
                      )}
                      {item.statusBadge === 'Completed' && (
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-0.5">
                          Completed
                        </span>
                      )}
                      {item.statusBadge === 'Rejected' && (
                        <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full inline-block mt-0.5">
                          Rejected
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* SUB-VIEW 4: PURCHASE HISTORY SCREEN (Matches Image 1 - Screen 3) */}
        {/* ----------------------------------------------------------------- */}
        {currentTab === 'purchases' && (
          <div className="space-y-4">
            {/* Top Bar with Back Arrow */}
            <div className="flex items-center justify-between py-1 relative">
              <button
                type="button"
                onClick={() => setCurrentTab('home')}
                className="w-9 h-9 rounded-full bg-white border border-slate-200/80 text-slate-700 flex items-center justify-center hover:bg-slate-50 active:scale-95 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4.5 h-4.5" />
              </button>
              <h2 className="text-base font-bold text-slate-900 absolute left-1/2 -translate-x-1/2">
                Purchase History
              </h2>
              <button
                type="button"
                onClick={() => loadPartnerHistory(partner.id)}
                className="w-9 h-9 rounded-full bg-white border border-slate-200/80 text-slate-700 flex items-center justify-center hover:bg-slate-50 transition-all cursor-pointer"
                title="Refresh"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Purchases Feed List */}
            <div className="space-y-2.5">
              {commissions.length === 0 ? (
                <div className="p-12 text-center rounded-3xl bg-white border border-slate-100 shadow-xs space-y-2">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold text-slate-700">No referral purchases yet</p>
                  <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                    Share your referral link with friends or on social media. Each purchase made will appear here with your 30% commission!
                  </p>
                </div>
              ) : (
                commissions.map((comm) => (
                  <div
                    key={comm.id}
                    className="p-3.5 sm:p-4 rounded-3xl bg-white border border-slate-100 shadow-xs flex items-center justify-between gap-3 hover:border-blue-100 transition-colors"
                  >
                    {/* Platform Logo + Title + Date + Qty */}
                    <div className="flex items-center gap-3 min-w-0">
                      {getPlatformIcon(comm.categoryName || comm.serviceName)}
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-900 block truncate leading-tight">
                          {comm.categoryName} {comm.serviceName}
                        </span>
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          {formatDateTime(comm.createdAt)}
                        </span>
                        <span className="text-[11px] text-slate-400 block font-medium">
                          Qty: 1
                        </span>
                      </div>
                    </div>

                    {/* Price + Chevron + Commission Badge */}
                    <div className="text-right shrink-0">
                      <div className="flex items-center justify-end gap-1">
                        <span className="text-sm font-black text-slate-900 font-mono">
                          ₹{Number(comm.orderAmount).toLocaleString()}
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </div>
                      <span className="text-[10px] font-bold text-[#1877F2] bg-blue-50 px-2 py-0.5 rounded-full inline-block mt-1">
                        Commission: ₹{Number(comm.commissionAmount).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* BOTTOM NAVIGATION BAR - EXACT MATCH TO MOCKUP BOTTOM BAR */}
      {/* ========================================================================= */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200/80 shadow-[0_-4px_16px_rgba(0,0,0,0.04)]">
        <div className="max-w-md mx-auto grid grid-cols-4 px-2 py-2">
          {/* 1. Home */}
          <button
            type="button"
            onClick={() => setCurrentTab('home')}
            className={`flex flex-col items-center justify-center py-1 gap-1 text-[11px] font-bold transition-colors cursor-pointer ${
              currentTab === 'home' ? 'text-[#1877F2]' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Home className="w-5 h-5 stroke-[2.2]" />
            <span>Home</span>
          </button>

          {/* 2. Withdrawal */}
          <button
            type="button"
            onClick={() => setCurrentTab('withdrawal')}
            className={`flex flex-col items-center justify-center py-1 gap-1 text-[11px] font-bold transition-colors cursor-pointer ${
              currentTab === 'withdrawal' ? 'text-[#1877F2]' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Landmark className="w-5 h-5 stroke-[2.2]" />
            <span>Withdrawal</span>
          </button>

          {/* 3. Transactions */}
          <button
            type="button"
            onClick={() => setCurrentTab('transactions')}
            className={`flex flex-col items-center justify-center py-1 gap-1 text-[11px] font-bold transition-colors cursor-pointer ${
              currentTab === 'transactions' ? 'text-[#1877F2]' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <FileText className="w-5 h-5 stroke-[2.2]" />
            <span>Transactions</span>
          </button>

          {/* 4. Purchase History */}
          <button
            type="button"
            onClick={() => setCurrentTab('purchases')}
            className={`flex flex-col items-center justify-center py-1 gap-1 text-[11px] font-bold transition-colors cursor-pointer ${
              currentTab === 'purchases' ? 'text-[#1877F2]' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <ShoppingBag className="w-5 h-5 stroke-[2.2]" />
            <span>Purchase History</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PROFILE / ACCOUNT MODAL (When tapping user avatar) */}
      {/* ========================================================================= */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="w-full max-w-xs bg-white rounded-3xl p-6 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Partner Account</h3>
              <button
                onClick={() => setShowProfileModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-center space-y-1">
              <div className="w-14 h-14 rounded-full bg-[#0F172A] text-white flex items-center justify-center text-xl font-bold mx-auto shadow-sm">
                {partner.name.charAt(0).toUpperCase()}
              </div>
              <h4 className="text-base font-bold text-slate-900">{partner.name}</h4>
              <p className="text-xs text-slate-400 font-mono">+91 {partner.mobile}</p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">User ID:</span>
                <span className="font-mono font-bold text-slate-800">{partner.userId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Referral Code:</span>
                <span className="font-mono font-bold text-[#1877F2]">{partner.referralCode}</span>
              </div>
            </div>

            <div className="pt-1 space-y-2">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full py-2.5 rounded-2xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout Account</span>
              </button>

              <button
                type="button"
                onClick={onNavigateHome}
                className="w-full py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                Go to Main Store
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* COMMISSION DETAILS MODAL */}
      {/* ========================================================================= */}
      {showCommissionModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Percent className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Commission Policy</h3>
              </div>
              <button
                onClick={() => setShowCommissionModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-900 font-semibold">
                🎉 You receive a flat <strong>{commissionRate}% commission</strong> on every successful purchase made through your unique link!
              </div>

              <div className="space-y-1.5">
                <h4 className="font-bold text-slate-900">How it works:</h4>
                <p>1. Customer clicks on your link and places an order.</p>
                <p>2. Once payment is confirmed, {commissionRate}% of the order amount is credited immediately to your Wallet Balance.</p>
                <p>3. You can withdraw directly to your UPI ID once balance reaches {currency}{minWithdrawal}.</p>
                <p>4. All withdrawal requests are processed within 24 hours.</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowCommissionModal(false)}
              className="w-full py-3 rounded-2xl bg-[#1877F2] text-white text-xs font-bold shadow-xs cursor-pointer"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PARTNER SUPPORT / TICKET MODAL */}
      {/* ========================================================================= */}
      {showTicketModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col animate-scale-up">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <LifeBuoy className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 leading-tight">Partner Support Desk</h3>
                  <p className="text-[10px] text-slate-400">Direct query to Admin Panel</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTicketModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tab switch: [Raise New Ticket] [My Tickets (N)] */}
            <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-100 shrink-0 text-xs font-bold">
              <button
                type="button"
                onClick={() => setTicketView('create')}
                className={`py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  ticketView === 'create'
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Send className="w-3.5 h-3.5" />
                <span>Raise Ticket</span>
              </button>
              <button
                type="button"
                onClick={() => setTicketView('list')}
                className={`py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  ticketView === 'list'
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>My Tickets ({partnerTickets.length})</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto pr-1 -mr-1 flex-1 space-y-4">
              {ticketView === 'create' ? (
                /* VIEW 1: RAISE TICKET FORM */
                <form onSubmit={handleCreatePartnerTicket} className="space-y-3.5">
                  <div className="p-3 rounded-2xl bg-indigo-50/70 border border-indigo-100/80 text-[11px] text-indigo-900 leading-relaxed">
                    💡 Need assistance with payouts, missing commission, or referral link? Fill details below and admin will assist you directly.
                  </div>

                  {/* Name field */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 block">
                      Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={ticketName}
                        onChange={(e) => setTicketName(e.target.value)}
                        placeholder="Your full name"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium focus:outline-none focus:border-indigo-500 focus:bg-white transition-all placeholder:text-slate-400"
                        required
                      />
                    </div>
                  </div>

                  {/* Mobile Number field */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 block">
                      Mobile / WhatsApp Number
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        value={ticketMobile}
                        onChange={(e) => setTicketMobile(e.target.value)}
                        placeholder="10-digit mobile number"
                        maxLength={10}
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium focus:outline-none focus:border-indigo-500 focus:bg-white transition-all placeholder:text-slate-400"
                        required
                      />
                    </div>
                  </div>

                  {/* Problem / Subject selector */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 block">
                      Kya Problem Hai? (Select Issue)
                    </label>
                    <select
                      value={ticketProblem}
                      onChange={(e) => setTicketProblem(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium focus:outline-none focus:border-indigo-500 focus:bg-white cursor-pointer"
                    >
                      <option value="Payout Issue">Payout / Withdrawal Issue</option>
                      <option value="Commission Not Credited">Commission Not Credited</option>
                      <option value="Referral Link Problem">Referral Link / Click Problem</option>
                      <option value="Bank / UPI Details Issue">Bank / UPI Details Issue</option>
                      <option value="Order Inquiry for Referred User">Order Inquiry for Referred User</option>
                      <option value="Other Problem">Other Problem (Custom)</option>
                    </select>

                    {ticketProblem === 'Other Problem' && (
                      <input
                        type="text"
                        value={ticketCustomProblem}
                        onChange={(e) => setTicketCustomProblem(e.target.value)}
                        placeholder="Specify your problem title..."
                        className="w-full mt-2 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium focus:outline-none focus:border-indigo-500 focus:bg-white placeholder:text-slate-400"
                        required
                      />
                    )}
                  </div>

                  {/* Discription field */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 block">
                      Discription (Describe problem in detail)
                    </label>
                    <textarea
                      value={ticketMessage}
                      onChange={(e) => setTicketMessage(e.target.value)}
                      rows={3}
                      placeholder="Apna problem ya sawal yahan detail mein likhein..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium focus:outline-none focus:border-indigo-500 focus:bg-white resize-none transition-all placeholder:text-slate-400"
                      required
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmittingTicket}
                    className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white text-xs font-bold shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingTicket ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Submitting Ticket...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Submit Ticket</span>
                      </>
                    )}
                  </button>
                </form>
              ) : (
                /* VIEW 2: MY TICKETS LIST */
                <div className="space-y-3">
                  {partnerTickets.length === 0 ? (
                    <div className="text-center py-8 px-4 space-y-2">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                        <MessageSquare className="w-6 h-6 stroke-[1.8]" />
                      </div>
                      <h4 className="text-xs font-bold text-slate-700">No Tickets Raised Yet</h4>
                      <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                        If you have any doubt regarding withdrawals or commissions, raise a ticket now.
                      </p>
                      <button
                        type="button"
                        onClick={() => setTicketView('create')}
                        className="mt-2 px-4 py-2 rounded-xl bg-indigo-50 text-indigo-600 text-xs font-bold hover:bg-indigo-100 cursor-pointer inline-flex items-center gap-1.5"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Raise New Ticket</span>
                      </button>
                    </div>
                  ) : (
                    partnerTickets.map((tkt) => {
                      const isResolved = tkt.status === 'Resolved';
                      const isOpen = tkt.status === 'Open';
                      const isInProgress = tkt.status === 'In Progress';

                      const statusColor = isResolved
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : isInProgress
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : isOpen
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200';

                      return (
                        <div
                          key={tkt.id}
                          className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5"
                        >
                          {/* Ticket Header */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-[11px] font-bold text-slate-800">
                                {tkt.ticketId}
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium">
                                • {formatDateTime(tkt.createdAt)}
                              </span>
                            </div>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusColor}`}
                            >
                              {tkt.status}
                            </span>
                          </div>

                          {/* Problem Topic */}
                          <div>
                            <span className="text-xs font-bold text-slate-900 block">
                              {tkt.problem}
                            </span>
                            <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed bg-white p-2.5 rounded-xl border border-slate-100">
                              {tkt.message}
                            </p>
                          </div>

                          {/* Admin Reply if available */}
                          {tkt.adminReply && (
                            <div className="p-2.5 rounded-xl bg-indigo-50/80 border border-indigo-200/70 space-y-1">
                              <div className="flex items-center gap-1.5 text-indigo-900">
                                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                                <span className="text-[10px] font-bold uppercase tracking-wider">
                                  Admin Reply:
                                </span>
                              </div>
                              <p className="text-xs text-indigo-950 font-medium leading-relaxed pl-5">
                                {tkt.adminReply}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* Modal Bottom Footer */}
            <div className="pt-2 border-t border-slate-100 text-center shrink-0">
              <p className="text-[10px] text-slate-400">
                Partner Support is monitored by SkyRocket Admin Team 24/7.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
