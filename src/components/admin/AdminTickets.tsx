import React, { useState, useEffect } from 'react';
import { SupportTicket } from '../../types';
import { dbService } from '../../lib/db';
import {
  Ticket,
  Search,
  MessageCircle,
  CheckCircle2,
  Clock,
  Trash2,
  Save,
  X,
  Send,
} from 'lucide-react';

export const AdminTickets: React.FC = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [adminReply, setAdminReply] = useState('');
  const [status, setStatus] = useState<SupportTicket['status']>('Open');

  const loadTickets = async () => {
    const list = await dbService.getAllTickets();
    setTickets(list);
  };

  useEffect(() => {
    loadTickets();
    const unsub = dbService.subscribe(loadTickets);
    return unsub;
  }, []);

  const handleOpenTicket = (tkt: SupportTicket) => {
    setSelectedTicket(tkt);
    setAdminReply(tkt.adminReply || '');
    setStatus(tkt.status);
  };

  const handleSaveTicket = async () => {
    if (!selectedTicket) return;
    await dbService.updateTicket(selectedTicket.id, {
      status,
      adminReply: adminReply.trim() || undefined,
    });
    setSelectedTicket(null);
    loadTickets();
  };

  const handleDeleteTicket = async (id: string) => {
    if (confirm('Delete this support ticket?')) {
      await dbService.deleteTicket(id);
      if (selectedTicket?.id === id) setSelectedTicket(null);
    }
  };

  const filteredTickets = tickets.filter((t) => {
    if (statusFilter === 'All') return true;
    return t.status.toLowerCase() === statusFilter.toLowerCase();
  });

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('en-GB', {
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-black text-white">Customer Support Tickets</h1>
          <p className="text-xs text-slate-400">
            Inquiries raised by website buyers. (Partner program tickets are managed in Affiliates / Referrals ➔ Partner Tickets).
          </p>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {['All', 'Open', 'In Progress', 'Resolved', 'Closed'].map((st) => (
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

      <div className="rounded-3xl bg-slate-800/80 border border-slate-700/70 overflow-hidden shadow-lg">
        {filteredTickets.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">No tickets found.</div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-slate-850 border-b border-slate-700">
              <tr>
                <th className="py-3 px-4">Ticket ID</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Problem / Issue</th>
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {filteredTickets.map((t) => (
                <tr
                  key={t.id}
                  onClick={() => handleOpenTicket(t)}
                  className="hover:bg-slate-750/50 cursor-pointer"
                >
                  <td className="py-3 px-4 font-mono font-bold text-pink-400">{t.ticketId}</td>
                  <td className="py-3 px-4">
                    <span className="font-bold text-white block">{t.customerName}</span>
                    <span className="text-[10px] text-slate-400">+91 {t.mobileNumber}</span>
                  </td>
                  <td className="py-3 px-4 text-slate-300 font-semibold">{t.problem}</td>
                  <td className="py-3 px-4 font-mono text-slate-400">{t.orderId || '—'}</td>
                  <td className="py-3 px-4 text-slate-400">{formatDate(t.createdAt)}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        t.status === 'Resolved'
                          ? 'bg-emerald-950/60 text-[#20B26B] border border-emerald-800'
                          : t.status === 'In Progress'
                          ? 'bg-blue-950/60 text-blue-400 border border-blue-800'
                          : t.status === 'Closed'
                          ? 'bg-slate-900 text-slate-400 border border-slate-700'
                          : 'bg-amber-950/60 text-amber-400 border border-amber-800'
                      }`}
                    >
                      {t.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button className="px-2.5 py-1 rounded-lg bg-slate-700 hover:bg-[#F72585] text-white text-[11px] font-bold">
                      View / Reply
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Ticket Details & Response Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-black text-white">Support Ticket</h3>
                <p className="text-xs font-mono text-pink-400">{selectedTicket.ticketId}</p>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-850 border border-slate-800 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Customer</span>
                <span className="font-bold text-white">
                  {selectedTicket.customerName} (+91 {selectedTicket.mobileNumber})
                </span>
              </div>
              {selectedTicket.orderId && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Related Order ID</span>
                  <span className="font-mono text-pink-400 font-bold">
                    {selectedTicket.orderId}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Issue Category</span>
                <span className="text-white font-semibold">{selectedTicket.problem}</span>
              </div>
            </div>

            <div>
              <span className="block text-xs font-bold text-slate-400 mb-1">Customer Message</span>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs leading-relaxed font-medium">
                {selectedTicket.message}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Ticket Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as SupportTicket['status'])}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-bold focus:outline-none"
              >
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Admin Response / Resolution Note
              </label>
              <textarea
                value={adminReply}
                onChange={(e) => setAdminReply(e.target.value)}
                rows={3}
                placeholder="Write response to user or internal resolution notes..."
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-[#F72585]"
              />
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleDeleteTicket(selectedTicket.id)}
                className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Ticket</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveTicket}
                  className="px-4 py-2 rounded-xl bg-[#F72585] hover:bg-[#E01E75] text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-pink-600/30 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Update Ticket</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
