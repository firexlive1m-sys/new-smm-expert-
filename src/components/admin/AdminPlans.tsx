import React, { useState, useEffect, useMemo } from 'react';
import { Plan, Service, Category, WebsiteSettings } from '../../types';
import { dbService } from '../../lib/db';
import { Plus, Edit2, Trash2, Eye, EyeOff, Save, X, Search, Sparkles, CheckCircle2, Zap } from 'lucide-react';

interface AdminPlansProps {
  settings?: WebsiteSettings;
}

export const AdminPlans: React.FC<AdminPlansProps> = ({ settings }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedCatId, setSelectedCatId] = useState<string>('all');
  const [selectedSrvId, setSelectedSrvId] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form fields
  const [catId, setCatId] = useState('');
  const [srvId, setSrvId] = useState('');
  const [quantity, setQuantity] = useState<number>(1000);
  const [quantityLabel, setQuantityLabel] = useState('');
  const [price, setPrice] = useState<number>(419);
  const [enableDiscount, setEnableDiscount] = useState<boolean>(false);
  const [comparePrice, setComparePrice] = useState<number | ''>('');
  const [discountPercent, setDiscountPercent] = useState<number | ''>('');
  const [guaranteeText, setGuaranteeText] = useState('Real Non-Drop Guarantee');
  const [deliveryTime, setDeliveryTime] = useState('Instant Delivery');
  const [badge, setBadge] = useState('');
  const [badgeColor, setBadgeColor] = useState('#F72585');
  const [sortOrder, setSortOrder] = useState(1);
  const [active, setActive] = useState(true);
  const [featured, setFeatured] = useState(false);
  const [providerServiceId, setProviderServiceId] = useState('');

  const currency = settings?.defaultCurrency || '₹';

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadData = async () => {
    const [cList, sList, pList] = await Promise.all([
      dbService.getCategories(false),
      dbService.getServices(undefined, false),
      dbService.getPlans(undefined, false),
    ]);
    setCategories(cList);
    setServices(sList);
    setPlans(pList);
    if (!catId && cList.length > 0) setCatId(cList[0].id);
  };

  useEffect(() => {
    loadData();
    const unsub = dbService.subscribe(loadData);
    return unsub;
  }, []);

  const availableServicesForForm = useMemo(() => {
    const matchedCat = categories.find((c) => c.id === catId);
    return services.filter(
      (s) =>
        s.categoryId === catId ||
        (matchedCat && s.categoryName && s.categoryName.toLowerCase() === matchedCat.name.toLowerCase())
    );
  }, [services, catId, categories]);

  const handleCatChange = (newCatId: string) => {
    setCatId(newCatId);
    const matchedCat = categories.find((c) => c.id === newCatId);
    const matchedSrvs = services.filter(
      (s) =>
        s.categoryId === newCatId ||
        (matchedCat && s.categoryName && s.categoryName.toLowerCase() === matchedCat.name.toLowerCase())
    );
    if (matchedSrvs.length > 0) {
      setSrvId(matchedSrvs[0].id);
    } else {
      setSrvId('');
    }
  };

  const handleOpenAdd = () => {
    setEditingPlan(null);
    const initialCat = selectedCatId !== 'all' ? selectedCatId : categories[0]?.id || '';
    setCatId(initialCat);
    const matchedCat = categories.find((c) => c.id === initialCat);
    const initialSrvs = services.filter(
      (s) =>
        s.categoryId === initialCat ||
        (matchedCat && s.categoryName && s.categoryName.toLowerCase() === matchedCat.name.toLowerCase())
    );
    setSrvId(selectedSrvId !== 'all' ? selectedSrvId : initialSrvs[0]?.id || '');
    setQuantity(1000);
    setQuantityLabel('1K Followers');
    setPrice(419);
    setEnableDiscount(false);
    setComparePrice('');
    setDiscountPercent('');
    setGuaranteeText('Real Non-Drop Guarantee');
    setDeliveryTime('Instant Delivery');
    setBadge('');
    setBadgeColor('#F72585');
    setSortOrder(plans.length + 1);
    setActive(true);
    setFeatured(false);
    setProviderServiceId('');
    setModalOpen(true);
  };

  const handleOpenEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setCatId(plan.categoryId);
    setSrvId(plan.serviceId);
    setQuantity(Number(plan.quantity) || 1000);
    setQuantityLabel(plan.quantityLabel || '');
    setPrice(Number(plan.price) || 0);

    const hasDiscount = Boolean(plan.comparePrice && Number(plan.comparePrice) > 0);
    setEnableDiscount(hasDiscount);
    setComparePrice(hasDiscount ? Number(plan.comparePrice) : '');
    setDiscountPercent(plan.discountPercent && Number(plan.discountPercent) > 0 ? Number(plan.discountPercent) : '');

    setGuaranteeText(plan.guaranteeText || 'Real Non-Drop Guarantee');
    setDeliveryTime(plan.deliveryTime || 'Instant Delivery');
    setBadge(plan.badge || '');
    setBadgeColor(plan.badgeColor || '#F72585');
    setSortOrder(plan.sortOrder || 1);
    setActive(plan.active !== false);
    setFeatured(Boolean(plan.featured));
    setProviderServiceId(plan.providerServiceId || '');
    setModalOpen(true);
  };

  const handleToggleActive = async (plan: Plan) => {
    await dbService.savePlan({ ...plan, active: !plan.active });
    await loadData();
    showToast(`Plan marked as ${!plan.active ? 'Active' : 'Hidden'}`);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this plan?')) {
      await dbService.deletePlan(id);
      await loadData();
      showToast('Plan deleted successfully');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catId) {
      alert('Please select a Platform / Category first.');
      return;
    }
    if (!srvId) {
      alert('No Service found for this platform. Please create a Service (e.g. Followers, Likes) under this category in the Services tab first.');
      return;
    }
    if (!quantity || Number(quantity) <= 0) {
      alert('Please enter a valid Quantity.');
      return;
    }
    if (!price || Number(price) <= 0) {
      alert('Please enter a valid Price.');
      return;
    }

    const matchedCat = categories.find((c) => c.id === catId);
    const matchedSrv = services.find((s) => s.id === srvId);
    const planId = editingPlan ? editingPlan.id : `plan-${Date.now()}`;

    const newPlan: Plan = {
      id: planId,
      categoryId: catId,
      categoryName: matchedCat?.name || editingPlan?.categoryName || 'Platform',
      serviceId: srvId,
      serviceName: matchedSrv?.name || editingPlan?.serviceName || 'Service',
      quantity: Number(quantity),
      quantityLabel: quantityLabel.trim() || `${quantity} ${matchedSrv?.name || ''}`.trim(),
      price: Number(price),
      comparePrice: enableDiscount && comparePrice && Number(comparePrice) > 0 ? Number(comparePrice) : undefined,
      discountPercent: enableDiscount && discountPercent && Number(discountPercent) > 0 ? Number(discountPercent) : undefined,
      guaranteeText: guaranteeText.trim() || 'Real Non-Drop Guarantee',
      deliveryTime: deliveryTime.trim() || 'Instant Delivery',
      badge: badge.trim() || undefined,
      badgeColor: badgeColor.trim() || undefined,
      sortOrder: Number(sortOrder) || 1,
      active,
      featured,
      providerServiceId: providerServiceId.trim() || undefined,
    };

    await dbService.savePlan(newPlan);
    await loadData();
    showToast(editingPlan ? 'Plan updated successfully!' : 'Plan added successfully!');
    setModalOpen(false);
  };

  const filteredPlans = plans.filter((p) => {
    if (selectedCatId !== 'all' && p.categoryId !== selectedCatId) return false;
    if (selectedSrvId !== 'all' && p.serviceId !== selectedSrvId) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold animate-fade-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-black text-white">Plans & Pricing Management</h1>
          <p className="text-xs text-slate-400">
            Control quantities, prices, discounts, badges and guarantees.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 rounded-xl bg-[#F72585] hover:bg-[#E01E75] text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-pink-600/30 cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add Plan</span>
        </button>
      </div>

      {/* Platform & Service Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={selectedCatId}
          onChange={(e) => {
            setSelectedCatId(e.target.value);
            setSelectedSrvId('all');
          }}
          className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-bold focus:outline-none"
        >
          <option value="all">All Platforms</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        {selectedCatId !== 'all' && (
          <select
            value={selectedSrvId}
            onChange={(e) => setSelectedSrvId(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-bold focus:outline-none"
          >
            <option value="all">All Services</option>
            {services
              .filter((s) => s.categoryId === selectedCatId)
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
          </select>
        )}
      </div>

      {/* Plans List Table */}
      <div className="rounded-3xl bg-slate-800/80 border border-slate-700/70 overflow-hidden shadow-lg">
        {filteredPlans.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs">No plans found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-slate-850 border-b border-slate-700">
                <tr>
                  <th className="py-3 px-4">Platform & Service</th>
                  <th className="py-3 px-4">Quantity / Label</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4">Compare / Off</th>
                  <th className="py-3 px-4">Badge</th>
                  <th className="py-3 px-4">Order</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {filteredPlans.map((plan) => (
                  <tr key={plan.id} className="hover:bg-slate-750/50">
                    <td className="py-3 px-4">
                      <span className="font-bold text-white">{plan.categoryName}</span>
                      <span className="text-slate-400 block text-[10px]">{plan.serviceName}</span>
                      {plan.providerServiceId ? (
                        <span className="inline-flex items-center gap-1 mt-1 text-[9px] font-mono px-1.5 py-0.5 rounded bg-purple-950/80 border border-purple-800 text-purple-300">
                          <Zap className="w-2.5 h-2.5 text-purple-400" />
                          API #{plan.providerServiceId} (Custom)
                        </span>
                      ) : (
                        (() => {
                          const parentSrv = services.find((s) => s.id === plan.serviceId);
                          if (parentSrv?.providerServiceId) {
                            return (
                              <span className="inline-flex items-center gap-1 mt-1 text-[9px] font-mono px-1.5 py-0.5 rounded bg-indigo-950/70 border border-indigo-800 text-indigo-300">
                                <Zap className="w-2.5 h-2.5 text-indigo-400" />
                                API #{parentSrv.providerServiceId} (via Service)
                              </span>
                            );
                          }
                          return (
                            <span className="inline-block mt-1 text-[9px] text-slate-500 italic">
                              No API ID
                            </span>
                          );
                        })()
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-black text-white text-sm">{plan.quantityLabel}</span>
                      <span className="text-slate-400 block text-[10px]">{plan.guaranteeText}</span>
                    </td>
                    <td className="py-3 px-4 font-black text-pink-400 text-sm">
                      {currency}{plan.price.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {plan.comparePrice ? (
                        <>
                          <span className="line-through">{currency}{plan.comparePrice}</span>
                          {plan.discountPercent && (
                            <span className="text-[#20B26B] font-bold ml-1.5">
                              {plan.discountPercent}% OFF
                            </span>
                          )}
                        </>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {plan.badge ? (
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-bold text-white"
                          style={{ backgroundColor: plan.badgeColor || '#F72585' }}
                        >
                          {plan.badge}
                        </span>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono">#{plan.sortOrder}</td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleToggleActive(plan)}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer ${
                          plan.active
                            ? 'bg-emerald-950/60 text-[#20B26B] border border-emerald-800'
                            : 'bg-red-950/60 text-red-400 border border-red-800'
                        }`}
                      >
                        {plan.active ? 'Active' : 'Hidden'}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(plan)}
                          className="p-1.5 rounded-lg bg-slate-700 hover:bg-[#F72585] text-white cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(plan.id)}
                          className="p-1.5 rounded-lg bg-slate-700 hover:bg-red-600 text-slate-300 hover:text-white cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-black text-white">
                {editingPlan ? 'Edit Plan' : 'Add New Plan'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Platform / Category
                  </label>
                  <select
                    value={catId}
                    onChange={(e) => handleCatChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-[#F72585]"
                    required
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Service Type
                  </label>
                  <select
                    value={srvId}
                    onChange={(e) => setSrvId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-[#F72585]"
                    required
                  >
                    {availableServicesForForm.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Quantity (Number)
                  </label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-[#F72585]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Quantity Label (Display)
                  </label>
                  <input
                    type="text"
                    value={quantityLabel}
                    onChange={(e) => setQuantityLabel(e.target.value)}
                    placeholder="e.g. 1K Followers"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-[#F72585]"
                  />
                </div>
              </div>

              {/* Regular Customer Price */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Selling Price ({currency}) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => {
                    const newPrice = Number(e.target.value);
                    setPrice(newPrice);
                    if (enableDiscount && comparePrice && Number(comparePrice) > newPrice && newPrice > 0) {
                      const pct = Math.round(((Number(comparePrice) - newPrice) / Number(comparePrice)) * 100);
                      setDiscountPercent(pct);
                    }
                  }}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm font-black focus:outline-none focus:border-[#F72585]"
                  required
                />
              </div>

              {/* Compare Price & Discount % Toggle Box (Option to Enable or Disable) */}
              <div className="p-3.5 rounded-2xl bg-slate-800/90 border border-slate-700/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-white">
                        Compare Price & Discount %
                      </span>
                      {enableDiscount ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-700 text-[#20B26B] font-bold">
                          CHALU (ON)
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700 text-slate-400 font-bold">
                          BAND (OFF)
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {enableDiscount
                        ? "Cut price (strikethrough) aur discount badge website par dikhai dega."
                        : "Band hai — Customer ko sirf regular price dikhega, koi cut price nahi."}
                    </p>
                  </div>

                  {/* Toggle Switch */}
                  <button
                    type="button"
                    onClick={() => {
                      const next = !enableDiscount;
                      setEnableDiscount(next);
                      if (!next) {
                        setComparePrice('');
                        setDiscountPercent('');
                      } else if (!comparePrice && price) {
                        const suggested = Math.round(Number(price) * 1.5);
                        setComparePrice(suggested);
                        setDiscountPercent(33);
                      }
                    }}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      enableDiscount ? 'bg-[#F72585]' : 'bg-slate-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        enableDiscount ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Visible ONLY when enabled */}
                {enableDiscount && (
                  <div className="space-y-3 pt-2.5 border-t border-slate-700 animate-fade-in">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          Compare / Cut Price ({currency})
                        </label>
                        <input
                          type="number"
                          value={comparePrice}
                          onChange={(e) => {
                            const val = e.target.value === '' ? '' : Number(e.target.value);
                            setComparePrice(val);
                            if (val && Number(val) > Number(price) && Number(price) > 0) {
                              const pct = Math.round(((Number(val) - Number(price)) / Number(val)) * 100);
                              setDiscountPercent(pct);
                            }
                          }}
                          placeholder="e.g. 899"
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-[#F72585]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          Discount % (Optional)
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            value={discountPercent}
                            onChange={(e) =>
                              setDiscountPercent(e.target.value === '' ? '' : Number(e.target.value))
                            }
                            placeholder="e.g. 50"
                            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-[#F72585]"
                          />
                          <span className="absolute right-3 top-2 text-xs font-black text-slate-400 pointer-events-none">
                            %
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Discount Presets */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] text-slate-400 font-bold mr-1">Quick Discount:</span>
                      {[20, 30, 50, 70].map((pct) => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => {
                            setDiscountPercent(pct);
                            if (price && Number(price) > 0) {
                              const calculatedCompare = Math.round(Number(price) / (1 - pct / 100));
                              setComparePrice(calculatedCompare);
                            }
                          }}
                          className="px-2 py-0.5 rounded-lg bg-slate-900 hover:bg-slate-750 border border-slate-700 text-slate-300 hover:text-white text-[10px] font-bold cursor-pointer"
                        >
                          {pct}% OFF
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Guarantee Text
                  </label>
                  <input
                    type="text"
                    value={guaranteeText}
                    onChange={(e) => setGuaranteeText(e.target.value)}
                    placeholder="Real Non-Drop Guarantee"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-[#F72585]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Delivery Speed
                  </label>
                  <input
                    type="text"
                    value={deliveryTime}
                    onChange={(e) => setDeliveryTime(e.target.value)}
                    placeholder="Instant Delivery"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-[#F72585]"
                  />
                </div>
              </div>

              <div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Badge Text (Optional)
                    </label>
                    <input
                      type="text"
                      value={badge}
                      onChange={(e) => setBadge(e.target.value)}
                      placeholder="e.g. 🔥 Most Popular"
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-[#F72585]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Badge Color
                    </label>
                    <input
                      type="color"
                      value={badgeColor}
                      onChange={(e) => setBadgeColor(e.target.value)}
                      className="w-full h-8 rounded-xl bg-slate-800 border border-slate-700 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Quick Badge Presets */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-[10px] text-slate-400 font-bold mr-1">Quick Presets:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setBadge('🔥 Most Popular');
                      setBadgeColor('#F72585');
                    }}
                    className="px-2 py-0.5 rounded-lg bg-pink-950/60 hover:bg-pink-900 border border-pink-700 text-[#F72585] text-[10px] font-black cursor-pointer active:scale-95"
                  >
                    🔥 Most Popular
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBadge('⭐ Best Value');
                      setBadgeColor('#20B26B');
                    }}
                    className="px-2 py-0.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-700 text-[#20B26B] text-[10px] font-black cursor-pointer active:scale-95"
                  >
                    ⭐ Best Value
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBadge('⚡ Super Fast');
                      setBadgeColor('#FFB703');
                    }}
                    className="px-2 py-0.5 rounded-lg bg-amber-950/60 hover:bg-amber-900 border border-amber-700 text-[#FFB703] text-[10px] font-black cursor-pointer active:scale-95"
                  >
                    ⚡ Super Fast
                  </button>
                  {badge && (
                    <button
                      type="button"
                      onClick={() => setBadge('')}
                      className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 text-[10px] font-bold cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-[#F72585]"
                  />
                </div>

                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-300 cursor-pointer py-2">
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={(e) => setActive(e.target.checked)}
                      className="rounded border-slate-700 text-[#F72585] focus:ring-0"
                    />
                    <span>Active</span>
                  </label>
                </div>

                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-300 cursor-pointer py-2">
                    <input
                      type="checkbox"
                      checked={featured}
                      onChange={(e) => setFeatured(e.target.checked)}
                      className="rounded border-slate-700 text-[#F72585] focus:ring-0"
                    />
                    <span>Featured</span>
                  </label>
                </div>
              </div>

              {/* SMM Provider Service ID Mapping */}
              {(() => {
                const parentSrv = services.find((s) => s.id === srvId);
                return (
                  <div className="p-3.5 rounded-2xl bg-purple-950/20 border border-purple-800/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Zap className="w-4 h-4 text-purple-400" />
                        <span className="text-xs font-bold text-white">SMM Provider Service ID</span>
                      </div>
                      <span className="text-[10px] text-purple-300 font-bold bg-purple-900/60 px-2 py-0.5 rounded-md">
                        Auto-Fulfill
                      </span>
                    </div>

                    {parentSrv?.providerServiceId ? (
                      <div className="p-2.5 rounded-xl bg-indigo-950/60 border border-indigo-800/80 text-[11px] text-indigo-200 flex items-center justify-between">
                        <div>
                          <span className="font-bold">Inherited from Service ({parentSrv.name}):</span>
                          <span className="font-mono ml-1.5 font-black text-indigo-300 bg-indigo-900/70 px-2 py-0.5 rounded">
                            API #{parentSrv.providerServiceId}
                          </span>
                        </div>
                        <span className="text-[10px] text-emerald-400 font-bold">✓ Active for this plan</span>
                      </div>
                    ) : (
                      <div className="p-2 rounded-xl bg-slate-800/60 border border-slate-700/60 text-[10px] text-amber-300/90">
                        ⚠️ Service "{parentSrv?.name || 'Selected'}" par Provider ID set nahi hai. Aap Admin &gt; Services mein jaakar set karein ya neeche custom override dalein.
                      </div>
                    )}

                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        Custom Plan Override (Optional)
                      </label>
                      <input
                        type="text"
                        value={providerServiceId}
                        onChange={(e) => setProviderServiceId(e.target.value)}
                        placeholder={
                          parentSrv?.providerServiceId
                            ? `Khali chhod dein (Auto-uses #${parentSrv.providerServiceId}) ya alag ID dalein`
                            : 'e.g. 1542 (smmxpert.in ID)'
                        }
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-purple-500 placeholder:text-slate-500"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">
                        Agar Service mein ID set hai, toh yahan kuch daalne ki zaroorat nahi hai (automatic lag jayegi).
                      </p>
                    </div>
                  </div>
                );
              })()}

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#F72585] hover:bg-[#E01E75] text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-pink-600/30 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Plan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
