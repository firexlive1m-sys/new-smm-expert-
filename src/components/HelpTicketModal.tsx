import React, { useState } from 'react';
import { dbService } from '../lib/db';
import {
  X,
  Send,
  Ticket,
  User,
  Phone,
  Hash,
  MessageSquare,
  HelpCircle,
  CheckCircle2,
  Copy,
  Check,
} from 'lucide-react';

interface HelpTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultOrderId?: string;
}

const ISSUE_OPTIONS = [
  'Order Delay / Processing',
  'Payment / UPI Issue',
  'Drop / Refill Request',
  'Service Inquiry',
  'Other Problem',
];

export const HelpTicketModal: React.FC<HelpTicketModalProps> = ({
  isOpen,
  onClose,
  defaultOrderId = '',
}) => {
  const [customerName, setCustomerName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [orderId, setOrderId] = useState(defaultOrderId);
  const [problem, setProblem] = useState(ISSUE_OPTIONS[0]);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdTicketId, setCreatedTicketId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
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
      setErrorMsg('Please describe your issue or question');
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
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleResetForm = () => {
    setCustomerName('');
    setMobileNumber('');
    setOrderId('');
    setProblem(ISSUE_OPTIONS[0]);
    setMessage('');
    setCreatedTicketId(null);
    setCopied(false);
    setErrorMsg('');
  };

  const handleModalClose = () => {
    handleResetForm();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-3xl p-5 shadow-2xl border border-pink-100 max-h-[90vh] overflow-y-auto animate-scale-in">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-pink-50 border border-pink-100 text-[#F72585] flex items-center justify-center">
              <HelpCircle className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-base font-black text-[#172033] leading-tight">
                Help & Support
              </h3>
              <p className="text-[11px] text-gray-400 font-semibold">
                Create a support ticket for quick assistance
              </p>
            </div>
          </div>
          <button
            onClick={handleModalClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        {createdTicketId ? (
          /* SUCCESS SCREEN */
          <div className="py-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 text-[#20B26B] mx-auto flex items-center justify-center shadow-xs">
              <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
            </div>

            <div>
              <h4 className="text-lg font-black text-[#172033]">Ticket Submitted!</h4>
              <p className="text-xs text-gray-500 font-medium mt-1 max-w-xs mx-auto">
                Your support ticket has been registered. Our team will review and contact you on your mobile number.
              </p>
            </div>

            {/* Ticket ID Box */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-gray-200 max-w-xs mx-auto flex items-center justify-between">
              <div className="text-left">
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">
                  Your Ticket ID
                </span>
                <span className="text-base font-black text-[#F72585] font-mono">
                  {createdTicketId}
                </span>
              </div>
              <button
                onClick={handleCopyTicket}
                className="px-3 py-1.5 rounded-xl bg-white border border-gray-200 hover:border-pink-200 text-xs font-bold text-gray-700 flex items-center gap-1 shadow-2xs active:scale-95 transition-all cursor-pointer"
              >
                {copied ? (
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

            <div className="pt-2 flex gap-2">
              <button
                onClick={handleResetForm}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-xs font-bold hover:bg-gray-50 transition-colors cursor-pointer"
              >
                New Ticket
              </button>
              <button
                onClick={handleModalClose}
                className="flex-1 py-2.5 rounded-xl bg-[#F72585] hover:bg-[#E01E75] text-white text-xs font-black shadow-md shadow-pink-300 transition-all cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* TICKET FORM */
          <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
            {errorMsg && (
              <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            {/* Customer Name */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Your Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#F72585] transition-all"
                />
              </div>
            </div>

            {/* Mobile Number */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Mobile Number <span className="text-red-500">*</span>
              </label>
              <div className="relative flex">
                <div className="flex items-center gap-1 px-3 bg-gray-50 border border-r-0 border-gray-200 rounded-l-xl text-xs font-bold text-gray-700">
                  <Phone className="w-3.5 h-3.5 text-gray-500" />
                  +91
                </div>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="10-digit mobile number"
                  className="w-full px-3 py-2.5 rounded-r-xl border border-gray-200 text-sm font-semibold text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#F72585] transition-all"
                />
              </div>
            </div>

            {/* Issue Category */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                What issue are you facing? <span className="text-red-500">*</span>
              </label>
              <select
                value={problem}
                onChange={(e) => setProblem(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-[#172033] bg-white focus:outline-none focus:ring-2 focus:ring-[#F72585] transition-all"
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
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Order ID <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Hash className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  placeholder="e.g. #SWF123456"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#F72585] transition-all font-mono"
                />
              </div>
            </div>

            {/* Message Details */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Message / Description <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <textarea
                  required
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Explain your problem or question..."
                  className="w-full p-3 rounded-xl border border-gray-200 text-sm font-medium text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#F72585] transition-all resize-none"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#F72585] to-[#FF4FA0] text-white font-black text-sm flex items-center justify-center gap-2 shadow-md shadow-pink-300 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Creating Ticket...' : 'Submit Support Ticket'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
