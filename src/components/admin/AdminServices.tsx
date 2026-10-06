import React, { useState, useEffect } from 'react';
import { Service, Category } from '../../types';
import { dbService } from '../../lib/db';
import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Save,
  X,
  AlertTriangle,
  Loader2,
  CheckCircle,
} from 'lucide-react';

export const AdminServices: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedCatId, setSelectedCatId] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [deleteModalService, setDeleteModalService] = useState<Service | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form fields
  const [catId, setCatId] = useState('');
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [urlLabel, setUrlLabel] = useState('');
  const [urlPlaceholder, setUrlPlaceholder] = useState('');
  const [sortOrder, setSortOrder] = useState(1);
  const [active, setActive] = useState(true);
  const [providerServiceId, setProviderServiceId] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = async () => {
    try {
      const [cats, srvs] = await Promise.all([
        dbService.getCategories(false),
        dbService.getServices(undefined, false),
      ]);
      setCategories(cats);
      setServices(srvs);
      if (!catId && cats.length > 0) {
        setCatId(cats[0].id);
      }
    } catch (err) {
      console.error('Error loading services data:', err);
    }
  };

  useEffect(() => {
    loadData();
    const unsub = dbService.subscribe(() => {
      loadData();
    });
    return unsub;
  }, []);

  const handleOpenAdd = () => {
    setEditingService(null);
    setCatId(selectedCatId !== 'all' ? selectedCatId : categories[0]?.id || '');
    setName('');
    setSlug('');
    setDescription('');
    setUrlLabel('');
    setUrlPlaceholder('');
    setSortOrder(services.length + 1);
    setActive(true);
    setProviderServiceId('');
    setModalOpen(true);
  };

  const handleOpenEdit = (srv: Service) => {
    setEditingService(srv);
    setCatId(srv.categoryId);
    setName(srv.name);
    setSlug(srv.slug);
    setDescription(srv.description || '');
    setUrlLabel(srv.urlLabel || '');
    setUrlPlaceholder(srv.urlPlaceholder || '');
    setSortOrder(srv.sortOrder);
    setActive(srv.active);
    setProviderServiceId(srv.providerServiceId || '');
    setModalOpen(true);
  };

  const handleToggleActive = async (srv: Service) => {
    try {
      const updated = { ...srv, active: !srv.active };
      await dbService.saveService(updated);
      await loadData();
      showToast(`${srv.name} is now ${updated.active ? 'Active' : 'Hidden'}`);
    } catch (err) {
      console.error('Toggle active error:', err);
    }
  };

  const confirmDelete = async () => {
    if (!deleteModalService) return;
    setIsDeleting(true);
    try {
      await dbService.deleteService(deleteModalService.id);
      await loadData();
      showToast(`Service "${deleteModalService.name}" deleted successfully`);
      setDeleteModalService(null);
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete service. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !catId) return;

    setIsSaving(true);
    try {
      const matchedCat = categories.find((c) => c.id === catId);
      const serviceId = editingService
        ? editingService.id
        : `srv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const generatedSlug =
        slug.trim().toLowerCase().replace(/[^a-z0-9]/g, '-') ||
        name.trim().toLowerCase().replace(/[^a-z0-9]/g, '-');

      const newSrv: Service = {
        id: serviceId,
        categoryId: catId,
        categoryName: matchedCat?.name || 'Category',
        name: name.trim(),
        slug: generatedSlug,
        description: description.trim(),
        urlLabel: urlLabel.trim() || undefined,
        urlPlaceholder: urlPlaceholder.trim() || undefined,
        sortOrder: Number(sortOrder) || 1,
        active,
        providerServiceId: providerServiceId.trim() || undefined,
      };

      await dbService.saveService(newSrv);
      await loadData();
      showToast(
        editingService
          ? `Service "${newSrv.name}" updated successfully`
          : `Service "${newSrv.name}" added successfully`
      );
      setModalOpen(false);
    } catch (err) {
      console.error('Save error:', err);
      alert('Failed to save service. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredServices = services.filter((s) => {
    if (selectedCatId === 'all') return true;
    return s.categoryId === selectedCatId;
  });

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
          <h1 className="text-xl font-black text-white">Services Management</h1>
          <p className="text-xs text-slate-400">
            Define services per platform (e.g. Followers, Likes, Views, Comments).
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 rounded-xl bg-[#F72585] hover:bg-[#E01E75] text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-pink-600/30 cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add Service</span>
        </button>
      </div>

      {/* Platform Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        <button
          onClick={() => setSelectedCatId('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            selectedCatId === 'all'
              ? 'bg-[#F72585] text-white shadow-xs'
              : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
          }`}
        >
          All Platforms
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedCatId(c.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              selectedCatId === c.id
                ? 'bg-[#F72585] text-white shadow-xs'
                : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Services List Table */}
      <div className="rounded-3xl bg-slate-800/80 border border-slate-700/70 overflow-hidden shadow-lg">
        {filteredServices.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs font-bold">
            No services found. Click "Add Service" to create one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[550px]">
              <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-slate-850 border-b border-slate-700">
                <tr>
                  <th className="py-3 px-4">Platform</th>
                  <th className="py-3 px-4">Service Name</th>
                  <th className="py-3 px-4">Provider API ID</th>
                  <th className="py-3 px-4">Target Link Label</th>
                  <th className="py-3 px-4">Order</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {filteredServices.map((srv) => (
                  <tr key={srv.id} className="hover:bg-slate-750/50 transition-colors">
                    <td className="py-3 px-4 font-bold text-white whitespace-nowrap">
                      {srv.categoryName}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-extrabold text-[#F72585] text-sm block">
                        {srv.name}
                      </span>
                      {srv.description && (
                        <p className="text-[10px] text-slate-400 mt-0.5">{srv.description}</p>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {srv.providerServiceId ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-950/80 border border-purple-700/70 text-purple-300 font-mono text-[11px] font-bold shadow-xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse"></span>
                          API #{srv.providerServiceId}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500 italic">Not set (Manual)</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-300 whitespace-nowrap">
                      {srv.urlLabel || `${srv.categoryName} Link`}
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono">#{srv.sortOrder}</td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleToggleActive(srv)}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer ${
                          srv.active
                            ? 'bg-emerald-950/60 text-[#20B26B] border border-emerald-800'
                            : 'bg-red-950/60 text-red-400 border border-red-800'
                        }`}
                      >
                        {srv.active ? 'Active' : 'Hidden'}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(srv)}
                          className="p-1.5 rounded-lg bg-slate-700 hover:bg-[#F72585] text-white cursor-pointer transition-colors"
                          title="Edit Service"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteModalService(srv)}
                          className="p-1.5 rounded-lg bg-slate-700 hover:bg-red-600 text-slate-300 hover:text-white cursor-pointer transition-colors"
                          title="Delete Service"
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

      {/* In-App Delete Confirmation Modal (NEVER BLOCKED BY BROWSER / IFRAME) */}
      {deleteModalService && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-red-900/60 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-950 border border-red-800 text-red-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-black text-white">Delete Service?</h3>
              <p className="text-xs text-slate-400 mt-1">
                Are you sure you want to permanently delete{' '}
                <span className="text-white font-bold">"{deleteModalService.name}"</span>?
                Plans linked to this service will also be removed.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteModalService(null)}
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

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-black text-white">
                  {editingService ? `Edit: ${editingService.name}` : 'Add New Service'}
                </h3>
                {editingService && (
                  <span className="text-[10px] text-slate-500 font-mono">
                    ID: {editingService.id}
                  </span>
                )}
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Parent Platform / Category <span className="text-[#F72585]">*</span>
                </label>
                <select
                  value={catId}
                  onChange={(e) => setCatId(e.target.value)}
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

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Service Name (e.g. Followers, Likes, Views, Comments){' '}
                  <span className="text-[#F72585]">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!editingService) {
                      setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-'));
                    }
                  }}
                  placeholder="e.g. Followers"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-[#F72585]"
                  required
                />
              </div>

              {/* SMM Provider Service ID (Applies to all plans under this service) */}
              <div className="p-3 bg-purple-950/40 border border-purple-800/60 rounded-2xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-purple-200">
                    SMM Provider Service ID (smmxpert.in)
                  </label>
                  <span className="text-[10px] bg-purple-900/80 text-purple-300 px-2 py-0.5 rounded-full font-bold">
                    Auto-Applies to All Plans
                  </span>
                </div>
                <input
                  type="text"
                  value={providerServiceId}
                  onChange={(e) => setProviderServiceId(e.target.value)}
                  placeholder="e.g. 1542, 301, 89 (from smmxpert services list)"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-purple-700/60 text-white text-xs font-mono font-bold focus:outline-none focus:border-purple-400 placeholder:text-slate-500"
                />
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  💡 <strong>Tip:</strong> Is service mein jo ID yahan daalenge, wo iske sabhi plans (100, 500, 1K, 5K etc.) par automatically apply ho jayegi. Ek-ek plan mein alag se daalne ki zaroorat nahi hai!
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Custom Input URL Label
                </label>
                <input
                  type="text"
                  value={urlLabel}
                  onChange={(e) => setUrlLabel(e.target.value)}
                  placeholder="e.g. Instagram Profile Link"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-[#F72585]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  URL Placeholder
                </label>
                <input
                  type="text"
                  value={urlPlaceholder}
                  onChange={(e) => setUrlPlaceholder(e.target.value)}
                  placeholder="e.g. https://www.instagram.com/username"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-[#F72585]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. High Quality Real Indian & Non-Drop"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-[#F72585]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-[#F72585]"
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
                    <span>Active / Visible</span>
                  </label>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                {editingService ? (
                  <button
                    type="button"
                    onClick={() => {
                      setModalOpen(false);
                      setDeleteModalService(editingService);
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
                        <span>Save Service</span>
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
