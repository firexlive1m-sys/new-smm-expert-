import React, { useState, useEffect } from 'react';
import { Banner, Category, Offer } from '../../types';
import { dbService } from '../../lib/db';
import { Plus, Edit2, Trash2, Eye, EyeOff, Save, X, Image as ImageIcon, Link as LinkIcon } from 'lucide-react';

export const AdminBanners: React.FC = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);

  // Form fields
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [badgeText, setBadgeText] = useState('🔥 LIMITED TIME OFFER');
  const [discountBadge, setDiscountBadge] = useState('UP TO 70% OFF');
  const [buttonText, setButtonText] = useState('Order Now');
  const [imageUrl, setImageUrl] = useState('');
  const [redirectType, setRedirectType] = useState<'category' | 'offer' | 'external' | 'none'>('category');
  const [targetCategoryId, setTargetCategoryId] = useState('');
  const [targetOfferId, setTargetOfferId] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [sortOrder, setSortOrder] = useState(1);
  const [active, setActive] = useState(true);

  const loadData = async () => {
    const [bList, cList, oList] = await Promise.all([
      dbService.getBanners(false),
      dbService.getCategories(false),
      dbService.getOffers(undefined, false),
    ]);
    setBanners(bList);
    setCategories(cList);
    setOffers(oList);
    if (!targetCategoryId && cList.length > 0) setTargetCategoryId(cList[0].id);
    if (!targetOfferId && oList.length > 0) setTargetOfferId(oList[0].id);
  };

  useEffect(() => {
    loadData();
    const unsub = dbService.subscribe(loadData);
    return unsub;
  }, []);

  const handleOpenAdd = () => {
    setEditingBanner(null);
    setTitle('GROW YOUR SOCIAL MEDIA');
    setSubtitle('Real Users • Non-Drop • Instant Start');
    setBadgeText('🔥 LIMITED TIME OFFER');
    setDiscountBadge('UP TO 70% OFF');
    setButtonText('Order Now');
    setImageUrl('');
    setRedirectType('category');
    setTargetCategoryId(categories[0]?.id || '');
    setTargetOfferId(offers[0]?.id || '');
    setTargetUrl('');
    setSortOrder(banners.length + 1);
    setActive(true);
    setModalOpen(true);
  };

  const handleOpenEdit = (b: Banner) => {
    setEditingBanner(b);
    setTitle(b.title);
    setSubtitle(b.subtitle);
    setBadgeText(b.badgeText || '');
    setDiscountBadge(b.discountBadge || '');
    setButtonText(b.buttonText || '');
    setImageUrl(b.imageUrl || '');
    setRedirectType(b.redirectType || 'category');
    setTargetCategoryId(b.targetCategoryId || categories[0]?.id || '');
    setTargetOfferId(b.targetOfferId || offers[0]?.id || '');
    setTargetUrl(b.targetUrl || '');
    setSortOrder(b.sortOrder);
    setActive(b.active);
    setModalOpen(true);
  };

  const handleToggleActive = async (b: Banner) => {
    await dbService.saveBanner({ ...b, active: !b.active });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this banner?')) {
      await dbService.deleteBanner(id);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const bannerId = editingBanner ? editingBanner.id : `banner-${Date.now()}`;
    const newBanner: Banner = {
      id: bannerId,
      title: title.trim(),
      subtitle: subtitle.trim(),
      badgeText: badgeText.trim() || undefined,
      discountBadge: discountBadge.trim() || undefined,
      buttonText: buttonText.trim() || undefined,
      imageUrl: imageUrl.trim() || undefined,
      redirectType,
      targetCategoryId: redirectType === 'category' ? targetCategoryId : undefined,
      targetOfferId: redirectType === 'offer' ? targetOfferId : undefined,
      targetUrl: redirectType === 'external' ? targetUrl.trim() : undefined,
      sortOrder: Number(sortOrder),
      active,
    };

    await dbService.saveBanner(newBanner);
    setModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-black text-white">Homepage Banners Slider</h1>
          <p className="text-xs text-slate-400">
            Control the top hero carousel. Add custom poster images & select click redirection target!
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 bg-gradient-to-r from-[#F72585] to-[#FF4FA0] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-pink-500/30 hover:scale-[1.02] active:scale-95 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Banner</span>
        </button>
      </div>

      {/* Banners List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {banners.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-slate-900 border border-slate-800 rounded-3xl p-6">
            <ImageIcon className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-400">No banners added yet.</p>
          </div>
        ) : (
          banners.map((b) => (
            <div
              key={b.id}
              className={`p-5 rounded-3xl border transition-all flex flex-col justify-between ${
                b.active
                  ? 'bg-slate-900 border-slate-800 hover:border-pink-500/40 shadow-lg'
                  : 'bg-slate-900/50 border-slate-800/50 opacity-60'
              }`}
            >
              <div>
                {/* Banner Image Preview */}
                {b.imageUrl ? (
                  <div className="w-full h-32 rounded-2xl overflow-hidden mb-3 border border-slate-800 bg-black">
                    <img src={b.imageUrl} alt={b.title} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-full h-24 rounded-2xl bg-gradient-to-tr from-[#F72585]/20 to-[#FF4FA0]/10 border border-pink-500/20 flex items-center justify-center mb-3">
                    <span className="text-xs font-bold text-pink-400">Graphic Text Banner</span>
                  </div>
                )}

                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-[10px] font-black uppercase text-[#F72585] bg-pink-500/10 px-2 py-0.5 rounded-full">
                    {b.badgeText || 'BANNER'}
                  </span>
                  {b.discountBadge && (
                    <span className="text-[10px] font-black text-white bg-[#F72585] px-2 py-0.5 rounded-md">
                      {b.discountBadge}
                    </span>
                  )}
                </div>

                <h3 className="text-base font-black text-white leading-snug">{b.title}</h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{b.subtitle}</p>

                {/* Redirection indicator */}
                <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400 font-semibold bg-slate-800/60 p-2 rounded-xl">
                  <LinkIcon className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                  <span className="truncate">
                    Target:{' '}
                    {b.redirectType === 'category'
                      ? categories.find((c) => c.id === b.targetCategoryId)?.name || 'Platform'
                      : b.redirectType === 'offer'
                      ? offers.find((o) => o.id === b.targetOfferId)?.title || 'Special Offer'
                      : b.redirectType === 'external'
                      ? b.targetUrl
                      : 'None'}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                <button
                  onClick={() => handleToggleActive(b)}
                  className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  {b.active ? (
                    <>
                      <Eye className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400">Active</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-4 h-4 text-slate-500" />
                      <span>Hidden</span>
                    </>
                  )}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(b)}
                    className="p-1.5 text-slate-400 hover:text-[#F72585] transition-colors cursor-pointer"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(b.id)}
                    className="p-1.5 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl max-h-[92vh] overflow-y-auto animate-scale-in">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
              <h3 className="text-base font-black text-white">
                {editingBanner ? 'Edit Banner' : 'Add New Banner'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-4">
              {/* Image URL with live preview */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Banner Image URL (Canva / Direct Link)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://example.com/banner.jpg"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-[#F72585]"
                  />
                  {imageUrl && (
                    <div className="w-12 h-10 rounded-lg bg-slate-800 border border-slate-700 overflow-hidden shrink-0">
                      <img src={imageUrl} alt="preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  If image is provided, banner will render as a full designer graphic poster!
                </p>
              </div>

              {/* Redirection Target */}
              <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-3">
                <label className="block text-xs font-black uppercase text-pink-400">
                  🎯 Click Redirection (Where should click go?)
                </label>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setRedirectType('category')}
                    className={`py-2 px-2 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer ${
                      redirectType === 'category'
                        ? 'border-[#F72585] bg-pink-500/20 text-white'
                        : 'border-slate-700 bg-slate-800 text-slate-400'
                    }`}
                  >
                    Platform Page
                  </button>
                  <button
                    type="button"
                    onClick={() => setRedirectType('offer')}
                    className={`py-2 px-2 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer ${
                      redirectType === 'offer'
                        ? 'border-[#F72585] bg-pink-500/20 text-white'
                        : 'border-slate-700 bg-slate-800 text-slate-400'
                    }`}
                  >
                    Special Offer
                  </button>
                  <button
                    type="button"
                    onClick={() => setRedirectType('external')}
                    className={`py-2 px-2 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer ${
                      redirectType === 'external'
                        ? 'border-[#F72585] bg-pink-500/20 text-white'
                        : 'border-slate-700 bg-slate-800 text-slate-400'
                    }`}
                  >
                    Custom URL
                  </button>
                </div>

                {redirectType === 'category' && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Select Target Platform
                    </label>
                    <select
                      value={targetCategoryId}
                      onChange={(e) => setTargetCategoryId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-[#F72585]"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {redirectType === 'offer' && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Select Target Combo Offer
                    </label>
                    <select
                      value={targetOfferId}
                      onChange={(e) => setTargetOfferId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-[#F72585]"
                    >
                      {offers.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.title} (₹{o.price})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {redirectType === 'external' && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Enter Target URL
                    </label>
                    <input
                      type="url"
                      value={targetUrl}
                      onChange={(e) => setTargetUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-[#F72585]"
                    />
                  </div>
                )}
              </div>

              {/* Title & Subtitle */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Banner Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. GROW YOUR SOCIAL MEDIA"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-[#F72585]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Subtitle</label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="e.g. Real Users • Non-Drop • Instant Start"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-[#F72585]"
                />
              </div>

              {/* Badges & Button */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Badge Text</label>
                  <input
                    type="text"
                    value={badgeText}
                    onChange={(e) => setBadgeText(e.target.value)}
                    placeholder="🔥 LIMITED TIME OFFER"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-[#F72585]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Discount Tag</label>
                  <input
                    type="text"
                    value={discountBadge}
                    onChange={(e) => setDiscountBadge(e.target.value)}
                    placeholder="UP TO 70% OFF"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-[#F72585]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Button Text</label>
                <input
                  type="text"
                  value={buttonText}
                  onChange={(e) => setButtonText(e.target.value)}
                  placeholder="Order Now"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-[#F72585]"
                />
              </div>

              {/* Active Switch */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="bannerActive"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="rounded text-[#F72585] focus:ring-0 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="bannerActive" className="text-xs font-bold text-slate-300 cursor-pointer">
                  Display this Banner on the homepage
                </label>
              </div>

              {/* Submit Button */}
              <div className="pt-3">
                <button
                  type="submit"
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#F72585] to-[#FF4FA0] text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-pink-500/30 hover:scale-[1.01] active:scale-98 transition-all cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingBanner ? 'Update Banner' : 'Save Banner'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
