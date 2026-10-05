import React, { useState } from 'react';
import { WebsiteSettings } from '../types';
import { dbService } from '../lib/db';
import { trackMetaContact } from '../lib/metaPixel';
import {
  ArrowLeft,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Send,
  User,
  Phone,
  Hash,
  PlayCircle,
  Copy,
  Check,
  ShieldCheck,
  Clock,
  Sparkles,
  MessageSquare,
  Lock,
} from 'lucide-react';

interface HelpCenterPageProps {
  settings?: WebsiteSettings;
  onBack: () => void;
  onOpenHowToOrder: () => void;
}

const ISSUE_OPTIONS = [
  'Order Delay / Processing',
  'Payment / UPI Issue',
  'Drop / Refill Request',
  'Service Inquiry',
  'Other Problem',
];

export const HelpCenterPage: React.FC<HelpCenterPageProps> = ({
  settings,
  onBack,
  onOpenHowToOrder,
}) => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Ticket form state
  const [customerName, setCustomerName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [orderId, setOrderId] = useState('');
  const [problem, setProblem] = useState(ISSUE_OPTIONS[0]);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdTicketId, setCreatedTicketId] = useState<string | null>(null);
  const [copiedTicket, setCopiedTicket] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const faqs = [
    {
      q: 'How to place an order?',
      a: 'Choose your desired platform (Instagram, YouTube, Facebook, etc.), select the service (Followers, Likes, Views), pick a plan, enter your profile/post link and phone number, and complete payment. Your order starts automatically!',
    },
    {
      q: 'How long does it take to start & complete?',
      a: `Most services begin processing instantly within 5–15 minutes and complete ${settings?.orderCompletionTimeText || 'within 24 hours'}. Real-time progress can be tracked in the Orders tab.`,
    },
    {
      q: 'Do I need to share my account password?',
      a: 'Never! We will NEVER ask for your password. All we need is your public profile username or post link. Your account remains 100% safe and secure.',
    },
    {
      q: 'Will followers or engagement drop over time?',
      a: 'We provide high-retention, high-quality profiles. All our premium plans include non-drop stability and refill guarantees if any natural drop occurs.',
    },
    {
      q: 'Which payment methods are accepted?',
      a: 'We accept all major UPI apps (Google Pay, PhonePe, Paytm, BHIM), NetBanking, and Cards with instant automated order activation.',
    },
    {
      q: 'What if my order is delayed or faces an issue?',
      a: 'Simply fill the support ticket form with your order ID or mobile number. Our team will verify and resolve or refund promptly.',
    },
  ];

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!customerName.trim()) {
      setErrorMsg('Please enter your full name');
      return;
    }

    const cleanMobile = mobileNumber.replace(/[^0-9]/g, '');
    if (cleanMobile.length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number');
      return;
    }

    if (!message.trim()) {
      setErrorMsg('Please describe your issue');
      return;
    }

    setIsSubmitting(true);
    try {
      const ticket = await dbService.createSupportTicket({
        customerName: customerName.trim(),
        mobileNumber: cleanMobile,
        orderId: orderId.trim() || undefined,
        problem,
        message: message.trim(),
      });
      setCreatedTicketId(ticket.ticketId);
      trackMetaContact('support_ticket');
    } catch (err) {
      console.error('Failed to create ticket:', err);
      setErrorMsg('Failed to submit ticket. Please check your internet connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyTicket = () => {
    if (createdTicketId) {
      navigator.clipboard.writeText(createdTicketId);
      setCopiedTicket(true);
      setTimeout(() => setCopiedTicket(false), 2000);
    }
  };

  const handleResetTicketForm = () => {
    setCustomerName('');
    setMobileNumber('');
    setOrderId('');
    setProblem(ISSUE_OPTIONS[0]);
    setMessage('');
    setCreatedTicketId(null);
    setCopiedTicket(false);
    setErrorMsg('');
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
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#F72585] text-white flex items-center justify-center shadow-xs">
                <HelpCircle className="w-4.5 h-4.5" />
              </div>
              <div>
                <h1 className="font-black text-lg sm:text-xl text-[#172033] leading-none">
                  Help & Support Center
                </h1>
                <p className="text-[11px] font-semibold text-gray-400 mt-0.5 hidden sm:block">
                  Support Tickets • Step-by-Step Guide • FAQs
                </p>
              </div>
            </div>
          </div>
          <span className="text-xs font-black uppercase text-[#F72585] bg-pink-50 border border-pink-200 px-3 py-1 rounded-full">
            ● 24x7 Help Desk
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {/* Responsive 2-column layout on Desktop, 1-column on Mobile/Tablet */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* LEFT: Support Ticket Section */}
          <div className="lg:col-span-6 bg-white rounded-3xl p-5 sm:p-7 border border-pink-100 shadow-[0_4px_24px_rgba(247,37,133,0.06)]">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
              <div className="w-11 h-11 rounded-2xl bg-pink-50 text-[#F72585] flex items-center justify-center">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-[#172033] leading-tight">
                  Create Support Ticket
                </h2>
                <p className="text-xs text-gray-500 font-medium">
                  Submit your query and our team will resolve it quickly
                </p>
              </div>
            </div>

            {createdTicketId ? (
              /* SUCCESS TICKET VIEW */
              <div className="py-8 text-center space-y-4 animate-scale-in">
                <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 text-[#20B26B] mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
                </div>

                <div>
                  <h3 className="text-lg font-black text-[#172033]">
                    Ticket Submitted Successfully!
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1 max-w-sm mx-auto">
                    Our support specialist has received your query and will contact you on your mobile number.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-gray-200 max-w-xs mx-auto flex items-center justify-between">
                  <div className="text-left">
                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">
                      Your Ticket ID
                    </span>
                    <span className="text-lg font-black text-[#F72585] font-mono">
                      {createdTicketId}
                    </span>
                  </div>
                  <button
                    onClick={handleCopyTicket}
                    className="px-3.5 py-1.5 rounded-xl bg-white border border-gray-200 hover:border-pink-200 text-xs font-bold text-gray-700 flex items-center gap-1 shadow-2xs active:scale-95 transition-all cursor-pointer"
                  >
                    {copiedTicket ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>

                <button
                  onClick={handleResetTicketForm}
                  className="mt-2 px-6 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-gray-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  Create Another Ticket
                </button>
              </div>
            ) : (
              /* TICKET INPUT FORM */
              <form onSubmit={handleCreateTicket} className="mt-5 space-y-3.5">
                {errorMsg && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-semibold">
                    {errorMsg}
                  </div>
                )}

                {/* Customer Name */}
                <div>
                  <label className="block text-xs font-bold text-[#172033] mb-1">
                    Your Full Name <span className="text-red-500">*</span>
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
                      placeholder="e.g. Amit Verma"
                      className="w-full pl-10 pr-3.5 py-2.5 sm:py-3 rounded-xl border border-gray-200 text-sm font-semibold text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#F72585] transition-all bg-white"
                    />
                  </div>
                </div>

                {/* Mobile Number */}
                <div>
                  <label className="block text-xs font-bold text-[#172033] mb-1">
                    Mobile Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative flex">
                    <div className="flex items-center px-3.5 bg-gray-50 border border-r-0 border-gray-200 rounded-l-xl text-xs font-bold text-gray-700">
                      +91
                    </div>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="10-digit mobile number"
                      className="w-full px-3.5 py-2.5 sm:py-3 rounded-r-xl border border-gray-200 text-sm font-semibold text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#F72585] transition-all bg-white"
                    />
                  </div>
                </div>

                {/* Problem Type */}
                <div>
                  <label className="block text-xs font-bold text-[#172033] mb-1">
                    What is the issue? <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={problem}
                    onChange={(e) => setProblem(e.target.value)}
                    className="w-full px-3.5 py-2.5 sm:py-3 rounded-xl border border-gray-200 text-sm font-semibold text-[#172033] bg-white focus:outline-none focus:ring-2 focus:ring-[#F72585] transition-all"
                  >
                    {ISSUE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Order ID (Optional) */}
                <div>
                  <label className="block text-xs font-bold text-[#172033] mb-1">
                    Order ID <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <Hash className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={orderId}
                      onChange={(e) => setOrderId(e.target.value)}
                      placeholder="e.g. #SWF123456"
                      className="w-full pl-10 pr-3.5 py-2.5 sm:py-3 rounded-xl border border-gray-200 text-sm font-semibold text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#F72585] transition-all font-mono bg-white"
                    />
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-xs font-bold text-[#172033] mb-1">
                    Message / Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe your issue or query in detail..."
                    className="w-full p-3.5 rounded-xl border border-gray-200 text-sm font-medium text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#F72585] transition-all resize-none bg-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#F72585] to-[#FF4FA0] text-white font-black text-sm flex items-center justify-center gap-2 shadow-md shadow-pink-300 hover:shadow-lg active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? 'Submitting...' : 'Submit Support Ticket'}</span>
                </button>
              </form>
            )}
          </div>

          {/* RIGHT: Guide + FAQs + Guarantees */}
          <div className="lg:col-span-6 space-y-5">
            {/* How to Buy Guide Card */}
            <a
              href="https://youtube.com/shorts/ooX_6PNNEh0?si=PaJ1mv6RTF9FZYSz"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-5 rounded-3xl bg-gradient-to-r from-red-50 via-white to-pink-50/50 border border-red-200 shadow-sm cursor-pointer hover:border-red-300 transition-all active:scale-[0.99] group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-md shadow-red-200 shrink-0 group-hover:scale-105 transition-transform">
                  <PlayCircle className="w-6 h-6 fill-white text-red-600" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-base font-black text-[#172033]">How to Buy (Video Guide)</h3>
                    <span className="text-[9px] font-black px-1.5 py-0.2 rounded-md bg-red-600 text-white">YouTube</span>
                  </div>
                  <p className="text-xs font-medium text-gray-500">
                    Step-by-step video instructions to place & track orders
                  </p>
                </div>
              </div>
              <span className="text-xs font-black text-red-600 bg-white border border-red-200 px-3.5 py-2 rounded-xl shadow-2xs group-hover:bg-red-600 group-hover:text-white transition-all shrink-0">
                Watch Video
              </span>
            </a>

            {/* FAQs Accordion */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-100 shadow-[0_2px_14px_rgba(0,0,0,0.02)] space-y-3">
              <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                <Sparkles className="w-4 h-4 text-[#F72585] fill-[#F72585]" />
                <h3 className="text-sm sm:text-base font-black text-[#172033] uppercase tracking-wide">
                  Frequently Asked Questions
                </h3>
              </div>

              <div className="space-y-2.5">
                {faqs.map((faq, idx) => {
                  const isOpen = openFaq === idx;
                  return (
                    <div
                      key={idx}
                      className="rounded-2xl border border-gray-100 overflow-hidden transition-colors"
                    >
                      <button
                        onClick={() => setOpenFaq(isOpen ? null : idx)}
                        className="w-full flex items-center justify-between p-3.5 sm:p-4 text-left bg-slate-50/60 hover:bg-pink-50/30 transition-colors cursor-pointer"
                      >
                        <span className="text-xs sm:text-sm font-bold text-[#172033] pr-2 leading-snug">
                          {faq.q}
                        </span>
                        <div className="shrink-0 text-gray-400">
                          {isOpen ? (
                            <ChevronUp className="w-4 h-4 text-[#F72585]" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </div>
                      </button>
                      {isOpen && (
                        <div className="p-4 bg-white text-xs sm:text-sm font-medium text-gray-600 leading-relaxed border-t border-gray-100">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Trust Guarantees */}
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-2xs flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#20B26B] flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <span className="text-xs font-black text-[#172033] block">No Password</span>
                  <span className="text-[11px] text-gray-400">100% Safe Public Link</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-2xs flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-pink-50 text-[#F72585] flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <span className="text-xs font-black text-[#172033] block">Instant Dispatch</span>
                  <span className="text-[11px] text-gray-400">Automated System</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
