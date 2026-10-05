import React, { useState, useEffect } from 'react';
import { Offer, Category, Service, WebsiteSettings } from '../../types';
import { dbService } from '../../lib/db';
import { PlatformIcon } from '../PlatformIcon';
import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Save,
  X,
  Sparkles,
  Zap,
  AlertTriangle,
  Loader2,
  CheckCircle,
} from 'lucide-react';

interface AdminOffersProps {
  settings?: WebsiteSettings;
}

export const AdminOffers: React.FC<AdminOffersProps> = ({ settings }) => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [deleteModalOffer, setDeleteModalOffer] = useState<Offer | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form fields
  const [catId, setCatId] = useState('');
  const [title, setTitle] = useState('10K Followers');
  const [subtitle, setSubtitle] = useState('Real Indian · Non-Drop · Instant Delivery 🇮🇳');
  const [itemsIncluded, setItemsIncluded] = useState('');
  const [price, setPrice] = useState<number>(4169);
  const [comparePrice, setComparePrice] = useState<number>(8338);
  const [discountBadge, setDiscountBadge] = useState('60% OFF');
  const [badgeText, setBadgeText] = useState('LIMITED TIME OFFER');
  const [buttonText, setButtonText] = useState('Buy Now');
  const [priority, setPriority] = useState(1);
  const [active, setActive] = useState(true);

  // Dynamic service breakdown quantities under selected category
  const [serviceQuantities, setServiceQuantities] = useState<{ [serviceId: string]: string }>({});

  const currency = settings?.defaultCurrency || '₹';

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = async () => {
    try {
      const [oList, cList, sList] = await Promise.all([
        dbService.getOffers(undefined, false),
        dbService.getCategories(false),
        dbService.getServices(undefined, false),
      ]);
      setOffers(oList);
      setCategories(cList);
      setServices(sList);
      if (!catId && cList.length > 0) setCatId(cList[0].id);
    } catch (err) {
      console.error('Error loading offers:', err);
    }
  };

  useEffect(() => {
    loadData();
    const unsub = dbService.subscribe(() => {
      loadData();
    });
    return unsub;
  }, []);

  // Filter services belonging to currently selected category
  const currentCategoryServices = services.filter((s) => s.categoryId === catId && s.active);

  // When admin updates a service quantity, auto-construct itemsIncluded
  const handleServiceQtyChange = (srvId: string, srvName: string, val: string) => {
    const updated = { ...serviceQuantities, [srvId]: val };
    setServiceQuantities(updated);

    // Build human-friendly string: "1,000 Followers + 500 Likes + 2,000 Views"
    const parts: string[] = [];
    currentCategoryServices.forEach((s) => {
      const q = updated[s.id]?.trim();
      if (q) {
        parts.push(`${q} ${s.name}`);
      }
    });

    if (parts.length > 0) {
      setItemsIncluded(parts.join(' + '));
    }
  };

  const handleOpenAdd = () => {
    setEditingOffer(null);
    const initialCat = categories[0]?.id || '';
    setCatId(initialCat);
    setTitle('10K Followers');
    setSubtitle('Real Indian · Non-Drop · Instant Delivery 🇮🇳');
    setItemsIncluded('');
    setPrice(4169);
    setComparePrice(8338);
    setDiscountBadge('60% OFF');
    setBadgeText('LIMITED TIME OFFER');
    setButtonText('Buy Now');
    setServiceQuantities({});
    setPriority(offers.length + 1);
    setActive(true);
    setModalOpen(true);
  };

  const handleOpenEdit = (offer: Offer) => {
    setEditingOffer(offer);
    setCatId(offer.categoryId);
    setTitle(offer.title);
    setSubtitle(offer.subtitle || 'Real Indian · Non-Drop · Instant Delivery 🇮🇳');
    setItemsIncluded(offer.itemsIncluded || '');
    setPrice(offer.price);
    setComparePrice(offer.comparePrice || 0);
    setDiscountBadge(offer.discountBadge || '60% OFF');
    setBadgeText(offer.badgeText || 'LIMITED TIME OFFER');
    setButtonText(offer.buttonText || 'Buy Now');
    setServiceQuantities({});
    setPriority(offer.priority);
    setActive(offer.active);
    setModalOpen(true);
  };

  const handleToggleActive = async (offer: Offer) => {
    try {
      const updated = { ...offer, active: !offer.active };
      await dbService.saveOffer(updated);
      await loadData();
      showToast(`Offer is now ${updated.active ? 'Active' : 'Hidden'}`);
    } catch (err) {
      console.error('Toggle active error:', err);
    }
  };

  const confirmDelete = async () => {
    if (!deleteModalOffer) return;
    setIsDeleting(true);
    try {
      await dbService.deleteOffer(deleteModalOffer.id);
      await loadData();
      showToast(`Offer deleted successfully`);
      setDeleteModalOffer(null);
    } catch (err) {
      console.error('Delete offer error:', err);
      alert('Failed to delete offer. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catId || !title.trim() || !price) return;

    setIsSaving(true);
    try {
      const selectedCategory = categories.find((c) => c.id === catId);
      const offerId = editingOffer
        ? editingOffer.id
        : `offer-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

      let finalItems = itemsIncluded.trim();
      if (!finalItems) {
        const parts: string[] = [];
        currentCategoryServices.forEach((s) => {
          const q = serviceQuantities[s.id]?.trim();
          if (q) {
            parts.push(`${q} ${s.name}`);
          }
        });
        if (parts.length > 0) {
          finalItems = parts.join(' + ');
        }
      }

      const newOffer: Offer = {
        id: offerId,
        categoryId: catId,
        categoryName: selectedCategory?.name || 'Social Media',
        title: title.trim() || '10K Followers',
        subtitle: subtitle.trim() || 'Real Indian · Non-Drop · Instant Delivery 🇮🇳',
        isCustomCombo: true,
        itemsIncluded: finalItems || subtitle.trim() || 'Custom Growth Combo Pack',
        price: Number(price) || 0,
        comparePrice: comparePrice ? Number(comparePrice) : 0,
        discountBadge: discountBadge.trim() || '60% OFF',
        badgeText: badgeText.trim() || 'LIMITED TIME OFFER',
        buttonText: buttonText.trim() || 'Buy Now',
        priority: Number(priority) || 1,
        active,
      };

      await dbService.saveOffer(newOffer);
      await loadData();
      showToast(
        editingOffer ? `Offer "${newOffer.title}" updated!` : `New Offer created successfully!`
      );
      setModalOpen(false);
    } catch (err) {
      console.error('Save offer error:', err);
      alert('Failed to save offer. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold animate-fade-in">
          <CheckCircle className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <span>Special Combo Offers</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-pink-500/20 text-[#F72585] font-bold">
              High Conversion Deals
            </span>
          </h1>
          <p className="text-xs text-slate-400">
            Create featured bundle deals for each platform. Rendered with high-converting title,
            included services, badges, and instant checkout button!
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 bg-gradient-to-r from-[#F72585] to-[#FF4FA0] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-pink-500/30 hover:scale-[1.02] active:scale-95 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create Combo Offer</span>
        </button>
      </div>

      {/* Offers Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {offers.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-slate-900 border border-slate-800 rounded-3xl p-6">
            <Sparkles className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-400">No combo offers created yet.</p>
            <p className="text-xs text-slate-500 mt-1">
              Create combo packages with custom items to boost sales!
            </p>
          </div>
        ) : (
          offers.map((offer) => {
            const cat = categories.find((c) => c.id === offer.categoryId);
            return (
              <div
                key={offer.id}
                className={`p-5 rounded-3xl border transition-all flex flex-col justify-between ${
                  offer.active
                    ? 'bg-slate-850/80 border-slate-700/80 shadow-md'
                    : 'bg-slate-900/40 border-slate-800 opacity-60'
                }`}
              >
                <div>
                  {/* Top Bar: Platform + Badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="flex items-center gap-1 text-[11px] font-black uppercase text-[#F72585] bg-pink-950/60 border border-pink-800/60 px-2.5 py-0.5 rounded-full">
                      ● {offer.badgeText || 'LIMITED TIME OFFER'}
                    </span>
                    {offer.discountBadge && (
                      <span className="text-[10px] font-black bg-amber-500 text-white px-2 py-0.5 rounded-full shadow-2xs">
                        🔥 {offer.discountBadge}
                      </span>
                    )}
                  </div>

                  {/* Platform Tag */}
                  <div className="flex items-center gap-2 mb-2">
                    <PlatformIcon
                      nameOrSlug={cat?.name || offer.categoryName || 'Social'}
                      imageUrl={cat?.imageUrl}
                      className="w-5 h-5"
                    />
                    <span className="text-xs font-bold text-slate-300">
                      {cat?.name || offer.categoryName}
                    </span>
                  </div>

                  {/* Title & Subtitle */}
                  <h3 className="text-base font-black text-white leading-tight">{offer.title}</h3>
                  <p className="text-xs text-slate-400 mt-1 font-medium">
                    {offer.itemsIncluded || offer.subtitle || 'Custom Growth Combo Pack'}
                  </p>

                  {/* Price Row */}
                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                    <div>
                      {offer.comparePrice && offer.comparePrice > offer.price && (
                        <span className="text-xs text-slate-500 line-through font-bold block">
                          {currency}
                          {offer.comparePrice}
                        </span>
                      )}
                      <span className="text-xl font-black text-[#F72585]">
                        {currency}
                        {offer.price}
                      </span>
                    </div>

                    <span className="text-xs font-bold text-white bg-slate-700/80 px-3 py-1 rounded-xl">
                      ⚡ {offer.buttonText || 'Buy Now'}
                    </span>
                  </div>
                </div>

                {/* Actions Bottom Bar */}
                <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => handleToggleActive(offer)}
                    className="flex items-center gap-1 text-slate-400 hover:text-white cursor-pointer"
                  >
                    {offer.active ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                    <span>{offer.active ? 'Hide' : 'Unhide'}</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(offer)}
                      className="p-1.5 rounded-lg bg-slate-700 hover:bg-[#F72585] text-white transition-colors cursor-pointer"
                      title="Edit Offer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteModalOffer(offer)}
                      className="p-1.5 rounded-lg bg-slate-700 hover:bg-red-600 text-slate-300 hover:text-white transition-colors cursor-pointer"
                      title="Delete Offer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOffer && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-red-900/60 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-950 border border-red-800 text-red-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-black text-white">Delete Combo Offer?</h3>
              <p className="text-xs text-slate-400 mt-1">
                Are you sure you want to delete{' '}
                <span className="text-white font-bold">"{deleteModalOffer.title}"</span>?
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteModalOffer(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer transition-colors flex items-center justify-center gap-1.5"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Yes, Delete</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Combo Offer Modal (No Image URL, Full Services Breakdown) */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-2xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 my-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-black text-white">
                  {editingOffer ? 'Edit Combo Offer' : 'Create Special Combo Offer'}
                </h3>
                <p className="text-[11px] text-slate-400">
                  Configure title, included services, badges, and pricing.
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5">
              {/* 1. Platform / Category */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Target Platform / Category <span className="text-[#F72585]">*</span>
                </label>
                <select
                  value={catId}
                  onChange={(e) => {
                    setCatId(e.target.value);
                    setServiceQuantities({});
                  }}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-[#F72585]"
                  required
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Main Title & Subtitle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Offer Title <span className="text-[#F72585]">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. 10K Followers"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-[#F72585]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Subtitle / Guarantee Text
                  </label>
                  <input
                    type="text"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="e.g. Real Indian · Non-Drop · Instant Delivery 🇮🇳"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-[#F72585]"
                  />
                </div>
              </div>

              {/* 3. DYNAMIC SERVICES BREAKDOWN UNDER THIS PLATFORM */}
              <div className="p-3.5 rounded-2xl bg-slate-850 border border-slate-750 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#F72585]" />
                    <span>Included Services In This Bundle</span>
                  </label>
                  <span className="text-[10px] text-slate-400">
                    {currentCategoryServices.length} services available
                  </span>
                </div>

                {currentCategoryServices.length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic">
                    No services found for this category yet. You can type the included items
                    manually below.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                    {currentCategoryServices.map((srv) => (
                      <div key={srv.id} className="bg-slate-800 p-2 rounded-xl border border-slate-700">
                        <span className="text-[10px] font-bold text-slate-300 block truncate mb-1">
                          {srv.name}
                        </span>
                        <input
                          type="text"
                          value={serviceQuantities[srv.id] || ''}
                          onChange={(e) =>
                            handleServiceQtyChange(srv.id, srv.name, e.target.value)
                          }
                          placeholder="e.g. 1K or 500"
                          className="w-full px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-white text-[11px] font-bold focus:outline-none focus:border-[#F72585]"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Items Included Preview/Editable string */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    Items Included Summary (Editable):
                  </label>
                  <input
                    type="text"
                    value={itemsIncluded}
                    onChange={(e) => setItemsIncluded(e.target.value)}
                    placeholder="e.g. 1,000 Real Followers + 500 Likes + 2,000 Views"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-[#F72585]"
                  />
                </div>
              </div>

              {/* 4. Pricing & Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Offer Price ({currency}) <span className="text-[#F72585]">*</span>
                  </label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    placeholder="4169"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-black focus:outline-none focus:border-[#F72585]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Cut Price ({currency})
                  </label>
                  <input
                    type="number"
                    value={comparePrice}
                    onChange={(e) => setComparePrice(Number(e.target.value))}
                    placeholder="8338"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-[#F72585]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Discount Badge
                  </label>
                  <input
                    type="text"
                    value={discountBadge}
                    onChange={(e) => setDiscountBadge(e.target.value)}
                    placeholder="60% OFF"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-[#F72585]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Top Label
                  </label>
                  <input
                    type="text"
                    value={badgeText}
                    onChange={(e) => setBadgeText(e.target.value)}
                    placeholder="LIMITED TIME OFFER"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-[#F72585]"
                  />
                </div>
              </div>

              {/* 5. Button Text & Visibility */}
              <div className="grid grid-cols-2 gap-3 items-center">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Button Text
                  </label>
                  <input
                    type="text"
                    value={buttonText}
                    onChange={(e) => setButtonText(e.target.value)}
                    placeholder="Buy Now"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-[#F72585]"
                  />
                </div>

                <div className="flex items-center gap-2 pt-4">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={(e) => setActive(e.target.checked)}
                      className="rounded border-slate-700 text-[#F72585] focus:ring-0"
                    />
                    <span>Active / Visible</span>
                  </label>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                {editingOffer ? (
                  <button
                    type="button"
                    onClick={() => {
                      setModalOpen(false);
                      setDeleteModalOffer(editingOffer);
                    }}
                    className="px-3 py-2 rounded-xl bg-red-950/60 hover:bg-red-900 border border-red-800 text-red-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-4 py-2 rounded-xl bg-[#F72585] hover:bg-[#E01E75] text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-pink-600/30 cursor-pointer disabled:opacity-50"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        <span>Save Offer</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
